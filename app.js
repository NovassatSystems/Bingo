
"use strict";
(() => {
const STORAGE_KEY="bingo-tracker-static-v1";
const LETTERS=["B","I","N","G","O"];
const RANGES={B:[1,15],I:[16,30],N:[31,45],G:[46,60],O:[61,75]};
const DEFAULT_RULES={horizontal:true,vertical:true,corners:true,diagonal:false,full:false,fiveCrazy:false};
const DEFAULT_SETTINGS={theme:"dark",viewMode:"normal",sortMode:"registration",soundEnabled:false,rules:{...DEFAULT_RULES}};
const $=id=>document.getElementById(id);
const initialState=()=>({version:1,round:1,cards:[],drawnNumbers:[],settings:{...DEFAULT_SETTINGS,rules:{...DEFAULT_RULES}}});
let state=initialState(),editingCardId=null,toastTimer=null;
const validNumber=n=>Number.isInteger(n)&&n>=1&&n<=75;
const letterFor=n=>LETTERS.find(l=>n>=RANGES[l][0]&&n<=RANGES[l][1])||"";
const escapeHtml=value=>String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
function toast(message,type="success") {const el=$("toast");if(!el)return;clearTimeout(toastTimer);el.textContent=message;el.className=`toast ${type}`;el.hidden=false;toastTimer=setTimeout(()=>el.hidden=true,3500);}
function sound(freq=650){if(!state.settings.soundEnabled)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;const ctx=new Audio(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.12,ctx.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.18);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.2);osc.onended=()=>ctx.close().catch(()=>{});}catch(e){console.warn(e);}}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch(e){toast("Não foi possível salvar os dados.","error");return false;}}
function parseSequence(text){const tokens=String(text).toUpperCase().replace(/\s+/g,"").replace(/[,|]+/g,";").replace(/;+$/g,"").split(";");if(tokens.length!==24)throw Error(`A cartela precisa ter 24 números; foram encontrados ${tokens.length}.`);const cols={B:[],I:[],N:[],G:[],O:[]},used=new Set();let k=0;for(const l of LETTERS){for(let i=0;i<(l==="N"?4:5);i++){const token=tokens[k++],match=/^([BINGO])(\d{1,2})$/.exec(token);if(!match)throw Error(`Valor inválido: ${token}. Use B6;I22;N35.`);const n=Number(match[2]);if(match[1]!==l)throw Error(`A posição ${k} deve pertencer à coluna ${l}.`);if(n<RANGES[l][0]||n>RANGES[l][1])throw Error(`${token} fora do intervalo da coluna ${l}.`);if(used.has(n))throw Error(`Número repetido: ${n}.`);used.add(n);cols[l].push(n);}}const grid=Array.from({length:5},()=>Array(5).fill(null));LETTERS.forEach((l,c)=>{let k=0;for(let r=0;r<5;r++)if(!(r===2&&c===2))grid[r][c]=cols[l][k++];});return grid;}
function gridToSequence(grid){const tokens=[];for(let c=0;c<5;c++)for(let r=0;r<5;r++)if(!(r===2&&c===2))tokens.push(`${LETTERS[c]}${grid[r][c]}`);return tokens.join(";");}
function validateCard(card){if(!card||typeof card!=="object"||typeof card.id!=="string"||!card.id.trim()||!Array.isArray(card.grid)||card.grid.length!==5||card.grid.some(r=>!Array.isArray(r)||r.length!==5))throw Error("Cartela inválida no backup.");if(JSON.stringify(parseSequence(gridToSequence(card.grid)))!==JSON.stringify(card.grid))throw Error(`Grade inválida na cartela ${card.id}.`);}
function validateGame(game){if(!game||typeof game!=="object"||!Array.isArray(game.cards)||!Array.isArray(game.drawnNumbers)||!Number.isInteger(game.round)||game.round<1)throw Error("Estrutura do backup inválida.");const ids=new Set(),numbers=new Set();for(const card of game.cards){validateCard(card);if(ids.has(card.id))throw Error(`Cartela duplicada: ${card.id}.`);ids.add(card.id);}for(const n of game.drawnNumbers){if(!validNumber(n)||numbers.has(n))throw Error("Histórico de sorteios inválido.");numbers.add(n);}}
function mergeSettings(settings={}){if(!settings||typeof settings!=="object")settings={};const rules=settings.rules&&typeof settings.rules==="object"?settings.rules:{};return {...DEFAULT_SETTINGS,...settings,rules:{...DEFAULT_RULES,...rules}};}
function load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw){state=initialState();return;}const saved=JSON.parse(raw);validateGame(saved);state={version:1,round:saved.round,cards:saved.cards,drawnNumbers:saved.drawnNumbers,settings:mergeSettings(saved.settings)};}catch(e){console.error("Erro ao carregar",e);state=initialState();toast("Dados locais inválidos. Confira seu backup.","warning");}}
function combinations(rules){const out=[];const add=(id,pattern,label,positions)=>out.push({id,pattern,label,positions});if(rules.horizontal)for(let r=0;r<5;r++)add(`h-${r}`,"horizontal",`Linha horizontal ${r+1}`,Array.from({length:5},(_,c)=>[r,c]));if(rules.vertical)for(let c=0;c<5;c++)add(`v-${c}`,"vertical",`Coluna ${LETTERS[c]}`,Array.from({length:5},(_,r)=>[r,c]));if(rules.corners)add("corners","corners","Quatro cantos",[[0,0],[0,4],[4,0],[4,4]]);if(rules.diagonal){add("diag-1","diagonal","Diagonal principal",Array.from({length:5},(_,i)=>[i,i]));add("diag-2","diagonal","Diagonal secundária",Array.from({length:5},(_,i)=>[i,4-i]));}if(rules.full)add("full","full","Cartela cheia",Array.from({length:25},(_,i)=>[Math.floor(i/5),i%5]));return out;}
const marked=(grid,r,c,drawn)=>r===2&&c===2||drawn.has(grid[r][c]);
function analyzeCard(card,drawn){const wins=[],almostWins=[],winningPositions=new Set(),markedPositions=[];for(let r=0;r<5;r++)for(let c=0;c<5;c++)if(!(r===2&&c===2)&&drawn.has(card.grid[r][c]))markedPositions.push([r,c]);for(const combo of combinations(state.settings.rules)){const missing=combo.positions.filter(([r,c])=>!marked(card.grid,r,c,drawn));if(missing.length===0){wins.push(combo);combo.positions.forEach(([r,c])=>winningPositions.add(`${r}-${c}`));}else if(missing.length===1){const [r,c]=missing[0];almostWins.push({combination:combo,missingNumber:card.grid[r][c]});}}if(state.settings.rules.fiveCrazy){const combo={id:"five-crazy",pattern:"fiveCrazy",label:"5 Pedras Loucas",positions:markedPositions.slice(0,5)};if(markedPositions.length>=5){wins.push(combo);markedPositions.forEach(([r,c])=>winningPositions.add(`${r}-${c}`));}else if(markedPositions.length===4)almostWins.push({combination:combo,missingNumber:null});}return {card,markedCount:markedPositions.length,wins,almostWins,winningPositions,isWinner:wins.length>0,isAlmost:wins.length===0&&almostWins.length>0};}
function analyzeGame(){const drawn=new Set(state.drawnNumbers),cards=state.cards.map(c=>analyzeCard(c,drawn));return {cards,winners:cards.filter(c=>c.isWinner),almost:cards.filter(c=>c.isAlmost)};}
function remaining(result){const drawn=new Set(state.drawnNumbers);let min=Infinity;for(const combo of combinations(state.settings.rules)){const missing=combo.positions.filter(([r,c])=>!marked(result.card.grid,r,c,drawn)).length;min=Math.min(min,missing);}if(state.settings.rules.fiveCrazy)min=Math.min(min,Math.max(0,5-result.markedCount));return Number.isFinite(min)?min:25;}
function sortedCards(cards){const out=[...cards];if(state.settings.sortMode==="identifier")out.sort((a,b)=>a.card.id.localeCompare(b.card.id,"pt-BR",{numeric:true}));if(state.settings.sortMode==="closest")out.sort((a,b)=>remaining(a)-remaining(b));return out;}
function registerNumber(n){if(!validNumber(n)){toast("Informe um número de 1 a 75.","error");return false;}if(state.drawnNumbers.includes(n)){toast(`${letterFor(n)}${n} já foi sorteado.`,"warning");return false;}const previous=new Set(analyzeGame().winners.map(a=>a.card.id));state.drawnNumbers.push(n);persist();render();const newly=analyzeGame().winners.filter(a=>!previous.has(a.card.id));sound(newly.length?880:620);toast(newly.length?`BINGO! ${newly.length} cartela(s) vencedora(s)!`:`${letterFor(n)}${n} registrado.`);return true;}
function undo(){if(!state.drawnNumbers.length){toast("Não há sorteios para desfazer.","warning");return;}const n=state.drawnNumbers.pop();persist();render();toast(`${letterFor(n)}${n} removido.`);}
function removeNumber(n){if(!state.drawnNumbers.includes(n)||!confirm(`Remover ${letterFor(n)}${n} do histórico?`))return;state.drawnNumbers=state.drawnNumbers.filter(x=>x!==n);persist();render();toast("Número removido.");}
function newRound(){if(!confirm("Iniciar nova rodada? Os sorteios serão apagados, mas as cartelas e as regras serão mantidas."))return;state.drawnNumbers=[];state.round++;persist();render();toast(`Rodada ${state.round} iniciada.`);}

/* ==========================================
   PARTE 2/3 — Interface e cartelas
   ========================================== */

function renderStats(analysis) {
  $("statCards").textContent = state.cards.length;
  $("statDrawn").textContent = state.drawnNumbers.length;
  $("statWinners").textContent = analysis.winners.length;
  $("statAlmost").textContent = analysis.almost.length;
  $("roundNumber").textContent = state.round;
}

function renderHistory() {
  const history = $("drawHistory");
  const numbers = state.drawnNumbers;

  $("historyCount").textContent =
    `${numbers.length} número(s)`;

  $("undoButton").disabled = numbers.length === 0;

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
    <strong>${letterFor(last)}${last}</strong>
  `;

  history.innerHTML = [...numbers]
    .reverse()
    .map((number, index) => `
      <button
        type="button"
        class="draw-ball ${index === 0 ? "latest" : ""}"
        data-remove-number="${number}"
        title="Toque para remover ${letterFor(number)}${number}"
        aria-label="Remover ${letterFor(number)}${number}"
      >
        ${letterFor(number)}${number}
      </button>
    `)
    .join("");
}

function almostDescription(result) {
  const messages = [];

  const regularNumbers = [
    ...new Set(
      result.almostWins
        .map(item => item.missingNumber)
        .filter(number => number !== null)
    )
  ];

  if (regularNumbers.length) {
    messages.push(
      "Falta: " +
      regularNumbers
        .map(number => `${letterFor(number)}${number}`)
        .join(", ")
    );
  }

  if (
    result.almostWins.some(
      item => item.combination.pattern === "fiveCrazy"
    )
  ) {
    messages.push(
      "5 Pedras Loucas: falta 1 número qualquer desta cartela."
    );
  }

  return messages.join(" | ");
}

function renderAlerts(analysis) {
  const section = $("alertsSection");
  const list = $("alertsList");

  if (
    !analysis.winners.length &&
    !analysis.almost.length
  ) {
    section.hidden = true;
    list.innerHTML = "";
    return;
  }

  section.hidden = false;

  const winners = analysis.winners
    .map(result => `
      <div class="alert-card bingo-alert">
        <h3>
          🏆 BINGO — ${escapeHtml(result.card.id)}
        </h3>
        <p>
          ${result.wins
            .map(win => escapeHtml(win.label))
            .join(", ")}
        </p>
      </div>
    `)
    .join("");

  const almost = analysis.almost
    .map(result => `
      <div class="alert-card almost">
        <h3>
          ⚠️ Quase bingo — ${escapeHtml(result.card.id)}
        </h3>
        <p>
          ${escapeHtml(almostDescription(result))}
        </p>
      </div>
    `)
    .join("");

  list.innerHTML = winners + almost;
}

function renderCardGrid(result) {
  const card = result.card;
  const drawn = new Set(state.drawnNumbers);
  let html = "";

  for (const letter of LETTERS) {
    html += `
      <div class="bingo-cell letter">
        ${letter}
      </div>
    `;
  }

  for (let row = 0; row < 5; row++) {
    for (let column = 0; column < 5; column++) {
      const number = card.grid[row][column];
      const free = row === 2 && column === 2;
      const isMarked = free || drawn.has(number);

      const winning = result.winningPositions.has(
        `${row}-${column}`
      );

      const classes = [
        "bingo-cell",
        free ? "free" : "",
        isMarked ? "marked" : "",
        winning ? "winning" : ""
      ].filter(Boolean).join(" ");

      const label = free
        ? "Centro livre"
        : `${LETTERS[column]}${number}`;

      html += `
        <div
          class="${classes}"
          title="${label}"
          aria-label="${label}${isMarked ? ", marcado" : ""}"
        >
          ${free ? "★" : number}
        </div>
      `;
    }
  }

  return html;
}

function renderCard(result) {
  const card = result.card;

  const status = result.isWinner
    ? `
      <span class="card-badge winner">
        🏆 BINGO
      </span>
    `
    : result.isAlmost
      ? `
        <span class="card-badge almost">
          ⚠️ Falta 1
        </span>
      `
      : `
        <span class="card-badge">
          Em andamento
        </span>
      `;

  const missingText = result.isAlmost
    ? `
      <p style="
        margin: 10px 0 0;
        color: var(--warning);
        font-size: 12px;
        font-weight: 700;
      ">
        ${escapeHtml(almostDescription(result))}
      </p>
    `
    : "";

  return `
    <article
      class="bingo-card
        ${result.isWinner ? "is-winner" : ""}
        ${result.isAlmost ? "is-almost" : ""}"
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
        ${renderCardGrid(result)}
      </div>

      <div class="card-footer">
        <span>
          ${result.markedCount}/24 marcados
        </span>

        ${status}
      </div>

      ${missingText}

    </article>
  `;
}

function renderCards(analysis) {
  const container = $("cardsContainer");
  const empty = $("emptyCards");
  const count = state.cards.length;

  $("cardsSubtitle").textContent = count === 0
    ? "Nenhuma cartela cadastrada."
    : `${count} cartela(s) cadastrada(s).`;

  empty.hidden = count > 0;

  const compact =
    state.settings.viewMode === "compact";

  container.className =
    `cards-container ${
      compact ? "compact-view" : "normal-view"
    }`;

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

  container.innerHTML = sortedCards(analysis.cards)
    .map(renderCard)
    .join("");
}

function renderSettings() {
  const settings = state.settings;
  const rules = settings.rules;

  document.body.dataset.theme = settings.theme;

  $("themeToggle").textContent =
    settings.theme === "dark" ? "☀️" : "🌙";

  $("sortSelect").value = settings.sortMode;

  $("ruleHorizontal").checked = rules.horizontal;
  $("ruleVertical").checked = rules.vertical;
  $("ruleCorners").checked = rules.corners;
  $("ruleDiagonal").checked = rules.diagonal;
  $("ruleFull").checked = rules.full;
  $("ruleFiveCrazy").checked = rules.fiveCrazy;

  $("soundToggle").checked = settings.soundEnabled;
}

function render() {
  const analysis = analyzeGame();

  renderStats(analysis);
  renderHistory();
  renderAlerts(analysis);
  renderCards(analysis);
  renderSettings();
}

function openCardDialog(cardId = null) {
  const dialog = $("cardDialog");

  $("cardForm").reset();
  $("cardFormError").hidden = true;

  editingCardId = cardId;

  if (cardId !== null) {
    const card = state.cards.find(
      item => item.id === cardId
    );

    if (!card) {
      toast("Cartela não encontrada.", "error");
      return;
    }

    $("cardDialogTitle").textContent =
      "Editar cartela";

    $("cardIdInput").value = card.id;
    $("cardNameInput").value = card.name || "";
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
  const sequence = $("cardSequenceInput").value;

  $("cardFormError").hidden = true;

  if (!id) {
    showCardError(
      "Informe o identificador da cartela."
    );
    return;
  }

  const duplicate = state.cards.some(
    card =>
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
        item => item.id === editingCardId
      );

      if (index < 0) {
        throw Error(
          "Cartela original não encontrada."
        );
      }

      card.createdAt =
        state.cards[index].createdAt;

      state.cards[index] = card;
    } else {
      state.cards.push(card);
    }

    persist();
    closeCardDialog();
    render();

    toast(`Cartela ${id} salva com sucesso.`);
  } catch (error) {
    showCardError(error.message);
  }
}

function deleteCard(cardId) {
  const card = state.cards.find(
    item => item.id === cardId
  );

  if (!card) return;

  if (!confirm(
    `Excluir a cartela ${cardId}?\n\n` +
    "Esta ação não poderá ser desfeita."
  )) {
    return;
  }

  state.cards = state.cards.filter(
    item => item.id !== cardId
  );

  persist();
  render();

  toast(`Cartela ${cardId} excluída.`);
}

/* ==========================================
   PARTE 3/3 — Backup e inicialização
   ========================================== */

function createBackup() {
  return {
    application: "bingo-tracker",
    exportedAt: new Date().toISOString(),
    game: state
  };
}

function backupJson() {
  return JSON.stringify(createBackup(), null, 2);
}

function exportBackup() {
  try {
    const content = backupJson();

    const blob = new Blob(
      [content],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    link.href = url;
    link.download = `bingo-tracker-${date}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    toast("Backup exportado com sucesso.");
  } catch (error) {
    console.error("Erro ao exportar backup:", error);

    toast(
      "Não foi possível exportar o backup.",
      "error"
    );
  }
}

async function copyBackup() {
  const content = backupJson();

  try {
    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      await navigator.clipboard.writeText(content);

      toast(
        "Backup copiado! Cole nas Notas ou em outro local seguro."
      );

      return;
    }

    throw Error("Área de transferência indisponível.");
  } catch (error) {
    console.warn(
      "Não foi possível copiar automaticamente:",
      error
    );

    // Alternativa para navegadores que bloqueiam
    // a API de transferência.
    const temporary = document.createElement(
      "textarea"
    );

    temporary.value = content;
    temporary.setAttribute("readonly", "");
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";
    temporary.style.left = "0";
    temporary.style.top = "0";

    document.body.appendChild(temporary);

    temporary.focus();
    temporary.select();
    temporary.setSelectionRange(
      0,
      temporary.value.length
    );

    let copied = false;

    try {
      copied = document.execCommand("copy");
    } catch (copyError) {
      console.warn(copyError);
    }

    temporary.remove();

    if (copied) {
      toast(
        "Backup copiado! Guarde o conteúdo em um local seguro."
      );
    } else {
      // Se o iPhone bloquear a cópia automática,
      // o conteúdo aparece no campo de texto.
      openBackupDialog(content);

      toast(
        "Selecione e copie o conteúdo exibido.",
        "warning"
      );
    }
  }
}

function normalizeImportedBackup(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw Error("O conteúdo JSON é inválido.");
  }

  let game;

  if (
    parsed.application === "bingo-tracker" &&
    parsed.game
  ) {
    game = parsed.game;
  } else if (
    Array.isArray(parsed.cards) &&
    Array.isArray(parsed.drawnNumbers)
  ) {
    // Compatibilidade com backups que
    // contêm diretamente o estado da partida.
    game = parsed;
  } else {
    throw Error(
      "O conteúdo não é um backup válido do Bingo Tracker."
    );
  }

  validateGame(game);

  return {
    version: 1,
    round: game.round,
    cards: game.cards,
    drawnNumbers: game.drawnNumbers,
    settings: mergeSettings(game.settings)
  };
}

function importBackupContent(content) {
  try {
    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      throw Error(
        "Cole o conteúdo JSON do backup."
      );
    }

    if (content.length > 5 * 1024 * 1024) {
      throw Error(
        "O conteúdo do backup é muito grande."
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(content.trim());
    } catch (error) {
      throw Error(
        "JSON inválido. Copie o conteúdo completo do backup."
      );
    }

    const importedState =
      normalizeImportedBackup(parsed);

    const confirmed = confirm(
      "Importar este backup?\n\n" +
      `Cartelas: ${importedState.cards.length}\n` +
      `Rodada: ${importedState.round}\n` +
      `Sorteios: ${importedState.drawnNumbers.length}\n\n` +
      "As cartelas, os números sorteados e " +
      "as configurações atuais serão substituídos."
    );

    if (!confirmed) {
      return {
        success: false,
        cancelled: true
      };
    }

    // Preserva os dados atuais caso o navegador
    // não consiga salvar o backup importado.
    const previousState = state;

    state = importedState;

    if (!persist()) {
      state = previousState;

      throw Error(
        "Não foi possível salvar o backup importado."
      );
    }

    render();

    toast(
      "Backup importado com sucesso!"
    );

    return {
      success: true,
      cancelled: false
    };
  } catch (error) {
    console.error(
      "Erro ao importar backup:",
      error
    );

    return {
      success: false,
      cancelled: false,
      error: error.message ||
        "Não foi possível importar o backup."
    };
  }
}

async function importBackupFile(file) {
  if (!file) return;

  try {
    if (file.size > 5 * 1024 * 1024) {
      throw Error(
        "O arquivo de backup é muito grande."
      );
    }

    const content = await file.text();
    const result = importBackupContent(content);

    if (result.error) {
      toast(result.error, "error");
    }
  } catch (error) {
    console.error(error);

    toast(
      error.message ||
      "Não foi possível ler o arquivo.",
      "error"
    );
  } finally {
    $("backupFileInput").value = "";
  }
}

function openBackupDialog(content = "") {
  const dialog = $("backupDialog");
  const textarea = $("backupTextInput");

  textarea.value = content;

  $("backupImportError").hidden = true;
  $("backupImportError").textContent = "";

  if (!dialog.open) {
    dialog.showModal();
  }

  textarea.focus();
}

function closeBackupDialog() {
  const dialog = $("backupDialog");

  if (dialog.open) {
    dialog.close();
  }
}

function showBackupError(message) {
  const element = $("backupImportError");

  element.textContent = message;
  element.hidden = false;
}

function importPastedBackup() {
  const content = $("backupTextInput").value;

  $("backupImportError").hidden = true;

  const result = importBackupContent(content);

  if (result.success) {
    closeBackupDialog();
    $("backupTextInput").value = "";
  } else if (result.error) {
    showBackupError(result.error);
  }
}

function updateSetting(key, value) {
  state.settings[key] = value;

  persist();
  render();
}

function updateRule(key, value) {
  state.settings.rules[key] = value;

  persist();
  render();
}

function bindEvents() {

  // REGISTRO DE NÚMEROS

  $("drawForm").addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const input = $("numberInput");
      const raw = input.value.trim();

      if (!/^\d+$/.test(raw)) {
        toast(
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
    undo
  );

  $("drawHistory").addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        "[data-remove-number]"
      );

      if (!button) return;

      removeNumber(
        Number(button.dataset.removeNumber)
      );
    }
  );

  // CADASTRO DE CARTELAS

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
    event => {
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

  // VISUALIZAÇÃO

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
    event => {
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

  // MODALIDADES DE VITÓRIA

  const ruleInputs = {
    ruleHorizontal: "horizontal",
    ruleVertical: "vertical",
    ruleCorners: "corners",
    ruleDiagonal: "diagonal",
    ruleFull: "full",
    ruleFiveCrazy: "fiveCrazy"
  };

  for (const [inputId, ruleKey] of
    Object.entries(ruleInputs)) {
    $(inputId).addEventListener(
      "change",
      event => {
        updateRule(
          ruleKey,
          event.target.checked
        );
      }
    );
  }

  $("soundToggle").addEventListener(
    "change",
    event => {
      updateSetting(
        "soundEnabled",
        event.target.checked
      );
    }
  );

  // NOVA RODADA

  $("newRoundButton").addEventListener(
    "click",
    newRound
  );

  // EXPORTAR BACKUP POR ARQUIVO

  $("exportButton").addEventListener(
    "click",
    exportBackup
  );

  // EXPORTAR BACKUP COPIANDO JSON

  $("copyBackupButton").addEventListener(
    "click",
    copyBackup
  );

  // IMPORTAR BACKUP POR ARQUIVO

  $("importButton").addEventListener(
    "click",
    () => {
      $("backupFileInput").click();
    }
  );

  $("backupFileInput").addEventListener(
    "change",
    event => {
      const file = event.target.files?.[0];

      if (file) {
        importBackupFile(file);
      }
    }
  );

  // IMPORTAR BACKUP COLANDO JSON

  $("pasteBackupButton").addEventListener(
    "click",
    () => {
      openBackupDialog();
    }
  );

  $("closeBackupDialog").addEventListener(
    "click",
    closeBackupDialog
  );

  $("cancelBackupButton").addEventListener(
    "click",
    closeBackupDialog
  );

  $("confirmPasteImportButton").addEventListener(
    "click",
    importPastedBackup
  );

  // SINCRONIZAÇÃO ENTRE ABAS

  window.addEventListener(
    "storage",
    event => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      load();
      render();
    }
  );
}

function initialize() {
  load();
  bindEvents();
  render();

  console.info(
    "Bingo Tracker inicializado " +
    "com 5 Pedras Loucas e backup JSON."
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
