
/* ==========================================
   BINGO TRACKER — APP.JS
   Parte 1/5 — Estado e validação
   ========================================== */

"use strict";

(() => {
  const STORAGE_KEY = "bingo-tracker-static-v1";
  const LETTERS = ["B", "I", "N", "G", "O"];

  const RANGES = {
    B: [1, 15],
    I: [16, 30],
    N: [31, 45],
    G: [46, 60],
    O: [61, 75]
  };

  const DEFAULT_RULES = {
    horizontal: true,
    vertical: true,
    corners: true,
    diagonal: false,
    full: false
  };

  const DEFAULT_SETTINGS = {
    theme: "dark",
    viewMode: "normal",
    sortMode: "registration",
    soundEnabled: false,
    rules: { ...DEFAULT_RULES }
  };

  function initialState() {
    return {
      version: 1,
      round: 1,
      cards: [],
      drawnNumbers: [],
      settings: {
        ...DEFAULT_SETTINGS,
        rules: { ...DEFAULT_RULES }
      }
    };
  }

  let state = initialState();
  let editingCardId = null;
  let toastTimer = null;

  const $ = (id) => document.getElementById(id);

  function isValidNumber(value) {
    return Number.isInteger(value) &&
      value >= 1 &&
      value <= 75;
  }

  function getLetter(number) {
    if (!isValidNumber(number)) return "";

    return LETTERS.find((letter) => {
      const [min, max] = RANGES[letter];
      return number >= min && number <= max;
    }) || "";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function showToast(message, type = "success") {
    const toast = $("toast");
    if (!toast) return;

    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.hidden = false;

    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 3500);
  }

  function playSound(frequency = 650) {
    if (!state.settings.soundEnabled) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(
        0.0001,
        context.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        context.currentTime + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.18
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);

      oscillator.onended = () => {
        context.close().catch(() => {});
      };
    } catch (error) {
      console.warn("Som indisponível:", error);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );

      return true;
    } catch (error) {
      console.error("Erro ao salvar:", error);

      showToast(
        "Não foi possível salvar os dados.",
        "error"
      );

      return false;
    }
  }

  function normalizeSequence(sequence) {
    return String(sequence)
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[,|\n]+/g, ";")
      .replace(/;+$/g, "");
  }

  function parseSequence(sequence) {
    const normalized = normalizeSequence(sequence);

    if (!normalized) {
      throw new Error(
        "Informe os números da cartela."
      );
    }

    const tokens = normalized.split(";");

    if (tokens.length !== 24) {
      throw new Error(
        `A cartela precisa ter 24 números. ` +
        `Foram encontrados ${tokens.length}.`
      );
    }

    const columns = {
      B: [],
      I: [],
      N: [],
      G: [],
      O: []
    };

    const used = new Set();
    let index = 0;

    for (const letter of LETTERS) {
      const required = letter === "N" ? 4 : 5;

      for (let position = 0;
        position < required;
        position++) {

        const token = tokens[index++];

        const match = /^([BINGO])(\d{1,2})$/.exec(token);

        if (!match) {
          throw new Error(
            `Valor inválido: ${token}. ` +
            "Use o formato B6;I22;N35."
          );
        }

        const tokenLetter = match[1];
        const number = Number(match[2]);

        if (tokenLetter !== letter) {
          throw new Error(
            `A posição ${index} deve ` +
            `pertencer à coluna ${letter}.`
          );
        }

        const [min, max] = RANGES[letter];

        if (number < min || number > max) {
          throw new Error(
            `${token} está fora do intervalo ` +
            `${letter}: ${min} a ${max}.`
          );
        }

        if (used.has(number)) {
          throw new Error(
            `Número repetido: ${number}.`
          );
        }

        used.add(number);
        columns[letter].push(number);
      }
    }

    const grid = Array.from(
      { length: 5 },
      () => Array(5).fill(null)
    );

    LETTERS.forEach((letter, column) => {
      let sourceIndex = 0;

      for (let row = 0; row < 5; row++) {
        if (row === 2 && column === 2) {
          grid[row][column] = null;
          continue;
        }

        grid[row][column] =
          columns[letter][sourceIndex++];
      }
    });

    return grid;
  }

  function gridToSequence(grid) {
    const tokens = [];

    for (let column = 0; column < 5; column++) {
      for (let row = 0; row < 5; row++) {
        if (row === 2 && column === 2) {
          continue;
        }

        tokens.push(
          `${LETTERS[column]}${grid[row][column]}`
        );
      }
    }

    return tokens.join(";");
  }

  function validateCardData(card) {
    if (!card || typeof card !== "object") {
      throw new Error("Cartela inválida.");
    }

    if (typeof card.id !== "string" ||
        !card.id.trim()) {
      throw new Error(
        "Identificador da cartela inválido."
      );
    }

    if (!Array.isArray(card.grid) ||
        card.grid.length !== 5 ||
        card.grid.some(
          (row) =>
            !Array.isArray(row) ||
            row.length !== 5
        )) {
      throw new Error(
        `Grade inválida na cartela ${card.id}.`
      );
    }

    const sequence = gridToSequence(card.grid);
    const validatedGrid = parseSequence(sequence);

    if (JSON.stringify(validatedGrid) !==
        JSON.stringify(card.grid)) {
      throw new Error(
        `Os números da cartela ${card.id} ` +
        "não correspondem à grade."
      );
    }

    return true;
  }

  function validateGameData(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Dados inválidos.");
    }

    if (!Array.isArray(data.cards) ||
        !Array.isArray(data.drawnNumbers)) {
      throw new Error(
        "Estrutura do backup inválida."
      );
    }

    if (!Number.isInteger(data.round) ||
        data.round < 1) {
      throw new Error(
        "Número da rodada inválido."
      );
    }

    const ids = new Set();

    for (const card of data.cards) {
      validateCardData(card);

      if (ids.has(card.id)) {
        throw new Error(
          `Identificador duplicado: ${card.id}.`
        );
      }

      ids.add(card.id);
    }

    const drawn = new Set();

    for (const number of data.drawnNumbers) {
      if (!isValidNumber(number) ||
          drawn.has(number)) {
        throw new Error(
          "Histórico de sorteios inválido."
        );
      }

      drawn.add(number);
    }

    return true;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return;

      const saved = JSON.parse(raw);
      validateGameData(saved);

      const savedSettings =
        saved.settings &&
        typeof saved.settings === "object"
          ? saved.settings
          : {};

      const savedRules =
        savedSettings.rules &&
        typeof savedSettings.rules === "object"
          ? savedSettings.rules
          : {};

      state = {
        version: 1,
        round: saved.round,
        cards: saved.cards,
        drawnNumbers: saved.drawnNumbers,
        settings: {
          ...DEFAULT_SETTINGS,
          ...savedSettings,
          rules: {
            ...DEFAULT_RULES,
            ...savedRules
          }
        }
      };
    } catch (error) {
      console.error(
        "Falha ao carregar os dados:",
        error
      );

      showToast(
        "Dados anteriores inválidos. " +
        "O aplicativo iniciou uma nova sessão.",
        "warning"
      );
    }
  }

/* ==========================================
   Parte 2/5 — Motor de combinações
   ========================================== */

  function makeCombination(
    id,
    pattern,
    label,
    positions
  ) {
    return {
      id,
      pattern,
      label,
      positions
    };
  }

  function getCombinations(rules) {
    const combinations = [];

    if (rules.horizontal) {
      for (let row = 0; row < 5; row++) {
        combinations.push(
          makeCombination(
            `horizontal-${row}`,
            "horizontal",
            `Linha horizontal ${row + 1}`,
            Array.from(
              { length: 5 },
              (_, column) => [row, column]
            )
          )
        );
      }
    }

    if (rules.vertical) {
      for (let column = 0; column < 5; column++) {
        combinations.push(
          makeCombination(
            `vertical-${column}`,
            "vertical",
            `Coluna ${LETTERS[column]}`,
            Array.from(
              { length: 5 },
              (_, row) => [row, column]
            )
          )
        );
      }
    }

    if (rules.corners) {
      combinations.push(
        makeCombination(
          "corners",
          "corners",
          "Quatro cantos",
          [
            [0, 0],
            [0, 4],
            [4, 0],
            [4, 4]
          ]
        )
      );
    }

    if (rules.diagonal) {
      combinations.push(
        makeCombination(
          "diagonal-main",
          "diagonal",
          "Diagonal principal",
          Array.from(
            { length: 5 },
            (_, index) => [index, index]
          )
        )
      );

      combinations.push(
        makeCombination(
          "diagonal-secondary",
          "diagonal",
          "Diagonal secundária",
          Array.from(
            { length: 5 },
            (_, index) => [index, 4 - index]
          )
        )
      );
    }

    if (rules.full) {
      const positions = [];

      for (let row = 0; row < 5; row++) {
        for (let column = 0; column < 5;
          column++) {
          positions.push([row, column]);
        }
      }

      combinations.push(
        makeCombination(
          "full",
          "full",
          "Cartela cheia",
          positions
        )
      );
    }

    return combinations;
  }

  function isMarked(grid, row, column, drawnSet) {
    if (row === 2 && column === 2) {
      return true;
    }

    return drawnSet.has(grid[row][column]);
  }

  function analyzeCard(card, drawnSet) {
    const combinations = getCombinations(
      state.settings.rules
    );

    const wins = [];
    const almostWins = [];
    const winningPositions = new Set();

    let markedCount = 0;

    for (let row = 0; row < 5; row++) {
      for (let column = 0; column < 5;
        column++) {
        if (row === 2 && column === 2) {
          continue;
        }

        if (drawnSet.has(card.grid[row][column])) {
          markedCount++;
        }
      }
    }

    for (const combination of combinations) {
      const missing = [];

      for (const [row, column] of
        combination.positions) {

        if (!isMarked(
          card.grid,
          row,
          column,
          drawnSet
        )) {
          missing.push({
            row,
            column,
            number: card.grid[row][column]
          });
        }
      }

      if (missing.length === 0) {
        wins.push(combination);

        for (const [row, column] of
          combination.positions) {
          winningPositions.add(
            `${row}-${column}`
          );
        }
      } else if (missing.length === 1) {
        almostWins.push({
          combination,
          missingNumber: missing[0].number,
          missingPosition: missing[0]
        });
      }
    }

    return {
      card,
      markedCount,
      percentage: Math.round(
        (markedCount / 24) * 100
      ),
      wins,
      almostWins,
      winningPositions,
      isWinner: wins.length > 0,
      isAlmost: wins.length === 0 &&
        almostWins.length > 0
    };
  }

  function analyzeGame() {
    const drawnSet = new Set(
      state.drawnNumbers
    );

    const cards = state.cards.map(
      (card) => analyzeCard(card, drawnSet)
    );

    return {
      cards,
      winners: cards.filter(
        (result) => result.isWinner
      ),
      almost: cards.filter(
        (result) => result.isAlmost
      )
    };
  }

  function getClosestRemaining(analysis) {
    const combinations = getCombinations(
      state.settings.rules
    );

    if (!combinations.length) {
      return 25;
    }

    const drawnSet = new Set(
      state.drawnNumbers
    );

    let minimum = Infinity;

    for (const combination of combinations) {
      let missing = 0;

      for (const [row, column] of
        combination.positions) {

        if (!isMarked(
          analysis.card.grid,
          row,
          column,
          drawnSet
        )) {
          missing++;
        }
      }

      minimum = Math.min(minimum, missing);
    }

    return minimum;
  }

  function getSortedAnalyses(analyses) {
    const sorted = [...analyses];

    switch (state.settings.sortMode) {
      case "identifier":
        sorted.sort((a, b) =>
          a.card.id.localeCompare(
            b.card.id,
            "pt-BR",
            { numeric: true }
          )
        );
        break;

      case "closest":
        sorted.sort((a, b) =>
          getClosestRemaining(a) -
          getClosestRemaining(b)
        );
        break;

      default:
        break;
    }

    return sorted;
  }

  function registerNumber(number) {
    if (!isValidNumber(number)) {
      showToast(
        "Informe um número entre 1 e 75.",
        "error"
      );
      return false;
    }

    if (state.drawnNumbers.includes(number)) {
      showToast(
        `${getLetter(number)}${number} ` +
        "já foi sorteado.",
        "warning"
      );
      return false;
    }

    const previousWinners = new Set(
      analyzeGame().winners.map(
        (result) => result.card.id
      )
    );

    state.drawnNumbers.push(number);

    saveState();
    render();

    const newWinners = analyzeGame().winners
      .filter(
        (result) =>
          !previousWinners.has(result.card.id)
      );

    if (newWinners.length) {
      playSound(880);

      showToast(
        `BINGO! ${newWinners.length} ` +
        "cartela(s) vencedora(s)!",
        "success"
      );
    } else {
      playSound(620);

      showToast(
        `${getLetter(number)}${number} registrado.`
      );
    }

    return true;
  }

  function undoLastNumber() {
    if (!state.drawnNumbers.length) {
      showToast(
        "Não há sorteios para desfazer.",
        "warning"
      );
      return;
    }

    const number = state.drawnNumbers.pop();

    saveState();
    render();

    showToast(
      `${getLetter(number)}${number} removido.`
    );
  }

  function removeDrawnNumber(number) {
    if (!state.drawnNumbers.includes(number)) {
      return;
    }

    if (!confirm(
      `Remover ${getLetter(number)}${number} ` +
      "do histórico?"
    )) {
      return;
    }

    state.drawnNumbers =
      state.drawnNumbers.filter(
        (value) => value !== number
      );

    saveState();
    render();

    showToast("Número removido.");
  }

  function startNewRound() {
    if (!confirm(
      "Iniciar uma nova rodada?\n\n" +
      "Os números sorteados serão apagados, " +
      "mas todas as cartelas serão mantidas."
    )) {
      return;
    }

    state.drawnNumbers = [];
    state.round++;

    saveState();
    render();

    showToast(
      `Rodada ${state.round} iniciada!`
    );
  }

/* ==========================================
   Parte 3/5 — Interface e renderização
   ========================================== */

  function renderStats(analysis) {
    $("statCards").textContent =
      state.cards.length;

    $("statDrawn").textContent =
      state.drawnNumbers.length;

    $("statWinners").textContent =
      analysis.winners.length;

    $("statAlmost").textContent =
      analysis.almost.length;

    $("roundNumber").textContent =
      state.round;
  }

  function renderHistory() {
    const history = $("drawHistory");
    const numbers = state.drawnNumbers;

    $("historyCount").textContent =
      `${numbers.length} número(s)`;

    $("undoButton").disabled =
      numbers.length === 0;

    if (!numbers.length) {
      $("lastDrawn").textContent =
        "Nenhum número sorteado.";

      history.innerHTML = `
        <span class="field-help">
          O histórico aparecerá aqui.
        </span>
      `;

      return;
    }

    const last = numbers[numbers.length - 1];

    $("lastDrawn").innerHTML = `
      Último sorteado:
      <strong>
        ${getLetter(last)}${last}
      </strong>
    `;

    history.innerHTML = [...numbers]
      .reverse()
      .map((number, index) => `
        <button
          type="button"
          class="draw-ball ${index === 0
            ? "latest" : ""}"
          data-remove-number="${number}"
          title="Toque para remover ${getLetter(number)}${number}"
          aria-label="Remover ${getLetter(number)}${number}"
        >
          ${getLetter(number)}${number}
        </button>
      `)
      .join("");
  }

  function renderAlerts(analysis) {
    const section = $("alertsSection");
    const list = $("alertsList");

    if (!analysis.winners.length &&
        !analysis.almost.length) {
      section.hidden = true;
      list.innerHTML = "";
      return;
    }

    section.hidden = false;

    const winnerHtml = analysis.winners.map(
      (result) => {
        const labels = result.wins
          .map((win) => escapeHtml(win.label))
          .join(", ");

        return `
          <div class="alert-card bingo-alert">
            <h3>🏆 BINGO — ${escapeHtml(
              result.card.id
            )}</h3>
            <p>${labels}</p>
          </div>
        `;
      }
    ).join("");

    const almostHtml = analysis.almost.map(
      (result) => {
        const missing = [
          ...new Set(
            result.almostWins.map(
              (item) => item.missingNumber
            )
          )
        ];

        const numbers = missing
          .map((number) =>
            `${getLetter(number)}${number}`
          )
          .join(", ");

        return `
          <div class="alert-card almost">
            <h3>⚠️ Quase bingo — ${escapeHtml(
              result.card.id
            )}</h3>
            <p>
              Falta: <strong>${numbers}</strong>
            </p>
          </div>
        `;
      }
    ).join("");

    list.innerHTML = winnerHtml + almostHtml;
  }

  function renderCardGrid(analysis) {
    const card = analysis.card;
    const drawnSet = new Set(
      state.drawnNumbers
    );

    let html = "";

    for (const letter of LETTERS) {
      html += `
        <div class="bingo-cell letter">
          ${letter}
        </div>
      `;
    }

    for (let row = 0; row < 5; row++) {
      for (let column = 0; column < 5;
        column++) {

        const number = card.grid[row][column];

        const free =
          row === 2 && column === 2;

        const marked = free ||
          drawnSet.has(number);

        const winning =
          analysis.winningPositions.has(
            `${row}-${column}`
          );

        const classes = [
          "bingo-cell",
          free ? "free" : "",
          marked ? "marked" : "",
          winning ? "winning" : ""
        ].filter(Boolean).join(" ");

        const label = free
          ? "Centro livre"
          : `${LETTERS[column]}${number}`;

        html += `
          <div
            class="${classes}"
            title="${label}"
            aria-label="${label}${marked
              ? ", marcado" : ""}"
          >
            ${free ? "★" : number}
          </div>
        `;
      }
    }

    return html;
  }

  function renderCard(analysis) {
    const card = analysis.card;

    const status = analysis.isWinner
      ? `<span class="card-badge winner">
           🏆 BINGO
         </span>`
      : analysis.isAlmost
        ? `<span class="card-badge almost">
             ⚠️ Falta 1
           </span>`
        : `<span class="card-badge">
             Em andamento
           </span>`;

    const missingNumbers = [
      ...new Set(
        analysis.almostWins.map(
          (item) => item.missingNumber
        )
      )
    ];

    const missingText = missingNumbers.length
      ? `
        <p style="
          margin: 10px 0 0;
          color: var(--warning);
          font-size: 12px;
          font-weight: 700;
        ">
          Falta:
          ${missingNumbers.map(
            (number) =>
              `${getLetter(number)}${number}`
          ).join(", ")}
        </p>
      `
      : "";

    return `
      <article
        class="bingo-card
          ${analysis.isWinner ? "is-winner" : ""}
          ${analysis.isAlmost ? "is-almost" : ""}"
        data-card-id="${escapeHtml(card.id)}"
      >
        <div class="card-header">

          <div class="card-title">
            <h3>
              Cartela ${escapeHtml(card.id)}
            </h3>

            ${card.name ? `
              <p>${escapeHtml(card.name)}</p>
            ` : ""}
          </div>

          <div class="card-actions">

            <button
              type="button"
              data-edit-card="${escapeHtml(card.id)}"
              aria-label="Editar cartela"
              title="Editar cartela"
            >
              ✎
            </button>

            <button
              type="button"
              data-delete-card="${escapeHtml(card.id)}"
              aria-label="Excluir cartela"
              title="Excluir cartela"
            >
              ✕
            </button>

          </div>
        </div>

        <div class="bingo-grid">
          ${renderCardGrid(analysis)}
        </div>

        <div class="card-footer">
          <span>
            ${analysis.markedCount}/24 marcados
          </span>

          ${status}
        </div>

        ${analysis.isAlmost ? missingText : ""}

      </article>
    `;
  }

  function renderCards(analysis) {
    const container = $("cardsContainer");
    const empty = $("emptyCards");

    const count = state.cards.length;

    $("cardsSubtitle").textContent =
      count === 0
        ? "Nenhuma cartela cadastrada."
        : `${count} cartela(s) cadastrada(s).`;

    empty.hidden = count > 0;

    const compact =
      state.settings.viewMode === "compact";

    container.className =
      `cards-container ${compact
        ? "compact-view"
        : "normal-view"}`;

    $("normalViewButton").classList.toggle(
      "active",
      !compact
    );

    $("compactViewButton").classList.toggle(
      "active",
      compact
    );

    $("normalViewButton").setAttribute(
      "aria-pressed",
      String(!compact)
    );

    $("compactViewButton").setAttribute(
      "aria-pressed",
      String(compact)
    );

    const sorted = getSortedAnalyses(
      analysis.cards
    );

    container.innerHTML = sorted
      .map(renderCard)
      .join("");
  }

  function renderSettings() {
    const settings = state.settings;
    const rules = settings.rules;

    document.body.dataset.theme =
      settings.theme;

    $("themeToggle").textContent =
      settings.theme === "dark"
        ? "☀️"
        : "🌙";

    $("sortSelect").value =
      settings.sortMode;

    $("ruleHorizontal").checked =
      rules.horizontal;

    $("ruleVertical").checked =
      rules.vertical;

    $("ruleCorners").checked =
      rules.corners;

    $("ruleDiagonal").checked =
      rules.diagonal;

    $("ruleFull").checked =
      rules.full;

    $("soundToggle").checked =
      settings.soundEnabled;
  }

  function render() {
    const analysis = analyzeGame();

    renderStats(analysis);
    renderHistory();
    renderAlerts(analysis);
    renderCards(analysis);
    renderSettings();
  }

/* ==========================================
   Parte 4/5 — Cartelas e backup
   ========================================== */

  function openCardDialog(cardId = null) {
    const dialog = $("cardDialog");
    const form = $("cardForm");

    form.reset();
    $("cardFormError").hidden = true;

    editingCardId = cardId;

    if (cardId !== null) {
      const card = state.cards.find(
        (item) => item.id === cardId
      );

      if (!card) {
        showToast(
          "Cartela não encontrada.",
          "error"
        );
        return;
      }

      $("cardDialogTitle").textContent =
        "Editar cartela";

      $("cardIdInput").value = card.id;
      $("cardNameInput").value =
        card.name || "";

      $("cardSequenceInput").value =
        gridToSequence(card.grid);
    } else {
      $("cardDialogTitle").textContent =
        "Adicionar cartela";
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    $("cardIdInput").focus();
  }

  function closeCardDialog() {
    $("cardDialog").close();
    editingCardId = null;
  }

  function showCardError(message) {
    const element = $("cardFormError");

    element.textContent = message;
    element.hidden = false;
  }

  function saveCardFromForm(event) {
    event.preventDefault();

    const id = $("cardIdInput").value.trim();
    const name = $("cardNameInput").value.trim();
    const sequence =
      $("cardSequenceInput").value;

    $("cardFormError").hidden = true;

    if (!id) {
      showCardError(
        "Informe o identificador da cartela."
      );
      return;
    }

    const duplicate = state.cards.some(
      (card) =>
        card.id === id &&
        card.id !== editingCardId
    );

    if (duplicate) {
      showCardError(
        `A cartela ${id} já está cadastrada.`
      );
      return;
    }

    try {
      const grid = parseSequence(sequence);

      const card = {
        id,
        name,
        grid,
        createdAt: new Date().toISOString()
      };

      if (editingCardId !== null) {
        const index = state.cards.findIndex(
          (item) => item.id === editingCardId
        );

        if (index < 0) {
          throw new Error(
            "Cartela original não encontrada."
          );
        }

        card.createdAt =
          state.cards[index].createdAt;

        state.cards[index] = card;
      } else {
        state.cards.push(card);
      }

      saveState();
      closeCardDialog();
      render();

      showToast(
        `Cartela ${id} salva com sucesso.`
      );
    } catch (error) {
      showCardError(error.message);
    }
  }

  function deleteCard(cardId) {
    const card = state.cards.find(
      (item) => item.id === cardId
    );

    if (!card) return;

    if (!confirm(
      `Excluir a cartela ${cardId}?\n\n` +
      "Esta ação não poderá ser desfeita."
    )) {
      return;
    }

    state.cards = state.cards.filter(
      (item) => item.id !== cardId
    );

    saveState();
    render();

    showToast(
      `Cartela ${cardId} excluída.`
    );
  }

  function exportBackup() {
    try {
      const backup = {
        application: "bingo-tracker",
        exportedAt: new Date().toISOString(),
        game: state
      };

      const content = JSON.stringify(
        backup,
        null,
        2
      );

      const blob = new Blob(
        [content],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      const date = new Date()
        .toISOString()
        .slice(0, 10);

      link.href = url;
      link.download =
        `bingo-tracker-${date}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      showToast(
        "Backup exportado com sucesso."
      );
    } catch (error) {
      console.error(error);

      showToast(
        "Erro ao exportar o backup.",
        "error"
      );
    }
  }

  async function importBackup(file) {
    if (!file) return;

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(
          "O arquivo de backup é muito grande."
        );
      }

      const content = await file.text();
      const backup = JSON.parse(content);

      if (!backup ||
          backup.application !== "bingo-tracker" ||
          !backup.game) {
        throw new Error(
          "Este arquivo não é um backup " +
          "válido do Bingo Tracker."
        );
      }

      validateGameData(backup.game);

      if (!confirm(
        "Importar este backup?\n\n" +
        "As cartelas e os sorteios atuais " +
        "serão substituídos."
      )) {
        return;
      }

      const imported = backup.game;
      const settings = imported.settings || {};

      state = {
        version: 1,
        round: imported.round,
        cards: imported.cards,
        drawnNumbers: imported.drawnNumbers,
        settings: {
          ...DEFAULT_SETTINGS,
          ...settings,
          rules: {
            ...DEFAULT_RULES,
            ...(settings.rules || {})
          }
        }
      };

      saveState();
      render();

      showToast(
        "Backup importado com sucesso."
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
        "Não foi possível importar o backup.",
        "error"
      );
    } finally {
      $("backupFileInput").value = "";
    }
  }

/* ==========================================
   Parte 5/5 — Eventos e inicialização
   ========================================== */

  function updateSetting(key, value) {
    state.settings[key] = value;

    saveState();
    render();
  }

  function updateRule(key, value) {
    state.settings.rules[key] = value;

    saveState();
    render();
  }

  function bindEvents() {
    $("drawForm").addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const input = $("numberInput");
        const raw = input.value.trim();

        if (!/^\d+$/.test(raw)) {
          showToast(
            "Digite um número inteiro.",
            "error"
          );
          return;
        }

        const number = Number(raw);

        if (registerNumber(number)) {
          input.value = "";
        }

        input.focus();
      }
    );

    $("undoButton").addEventListener(
      "click",
      undoLastNumber
    );

    $("drawHistory").addEventListener(
      "click",
      (event) => {
        const button = event.target.closest(
          "[data-remove-number]"
        );

        if (!button) return;

        const number = Number(
          button.dataset.removeNumber
        );

        removeDrawnNumber(number);
      }
    );

    $("addCardButton").addEventListener(
      "click",
      () => openCardDialog()
    );

    $("emptyAddButton").addEventListener(
      "click",
      () => openCardDialog()
    );

    $("closeCardDialog").addEventListener(
      "click",
      closeCardDialog
    );

    $("cancelCardButton").addEventListener(
      "click",
      closeCardDialog
    );

    $("cardForm").addEventListener(
      "submit",
      saveCardFromForm
    );

    $("cardDialog").addEventListener(
      "close",
      () => {
        editingCardId = null;
      }
    );

    $("cardsContainer").addEventListener(
      "click",
      (event) => {
        const editButton = event.target.closest(
          "[data-edit-card]"
        );

        if (editButton) {
          openCardDialog(
            editButton.dataset.editCard
          );
          return;
        }

        const deleteButton = event.target.closest(
          "[data-delete-card]"
        );

        if (deleteButton) {
          deleteCard(
            deleteButton.dataset.deleteCard
          );
        }
      }
    );

    $("normalViewButton").addEventListener(
      "click",
      () => {
        updateSetting("viewMode", "normal");
      }
    );

    $("compactViewButton").addEventListener(
      "click",
      () => {
        updateSetting("viewMode", "compact");
      }
    );

    $("sortSelect").addEventListener(
      "change",
      (event) => {
        updateSetting(
          "sortMode",
          event.target.value
        );
      }
    );

    $("themeToggle").addEventListener(
      "click",
      () => {
        const nextTheme =
          state.settings.theme === "dark"
            ? "light"
            : "dark";

        updateSetting("theme", nextTheme);
      }
    );

    const ruleInputs = {
      ruleHorizontal: "horizontal",
      ruleVertical: "vertical",
      ruleCorners: "corners",
      ruleDiagonal: "diagonal",
      ruleFull: "full"
    };

    for (const [inputId, ruleKey] of
      Object.entries(ruleInputs)) {

      $(inputId).addEventListener(
        "change",
        (event) => {
          updateRule(
            ruleKey,
            event.target.checked
          );
        }
      );
    }

    $("soundToggle").addEventListener(
      "change",
      (event) => {
        updateSetting(
          "soundEnabled",
          event.target.checked
        );
      }
    );

    $("newRoundButton").addEventListener(
      "click",
      startNewRound
    );

    $("exportButton").addEventListener(
      "click",
      exportBackup
    );

    $("importButton").addEventListener(
      "click",
      () => {
        $("backupFileInput").click();
      }
    );

    $("backupFileInput").addEventListener(
      "change",
      (event) => {
        const file = event.target.files?.[0];

        if (file) {
          importBackup(file);
        }
      }
    );

    window.addEventListener(
      "storage",
      (event) => {
        if (event.key !== STORAGE_KEY) {
          return;
        }

        loadState();
        render();
      }
    );
  }

  function initialize() {
    loadState();
    bindEvents();
    render();

    console.info(
      "Bingo Tracker inicializado."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }

})();
