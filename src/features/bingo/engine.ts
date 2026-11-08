
import {
  BINGO_LETTERS,
  COLUMN_RANGES,
  FREE_COLUMN,
  FREE_ROW,
  GRID_SIZE,
  type AlmostBingoResult,
  type BingoCard,
  type BingoCardAnalysis,
  type BingoCell,
  type BingoCombination,
  type BingoGame,
  type BingoGameAnalysis,
  type BingoNumber,
  type BingoPosition,
  type BingoProgress,
  type BingoResult,
  type BingoRules,
  type BingoValidationResult,
} from '../../models/bingo';

/**
 * Retorna se um número é válido
 * no bingo tradicional de 75 bolas.
 */
export function isValidNumber(
  value: unknown,
): value is BingoNumber {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 75
  );
}

/**
 * Valida uma cartela completa.
 *
 * A casa central deve ser livre.
 * Não permite números duplicados.
 * Respeita o intervalo de cada coluna.
 */
export function validateCard(
  card: BingoCard,
): BingoValidationResult {
  const errors: string[] = [];
  const seen = new Set<number>();

  if (
    !Array.isArray(card.grid) ||
    card.grid.length !== GRID_SIZE
  ) {
    return {
      valid: false,
      errors: ['A cartela deve ter 5 linhas.'],
    };
  }

  for (let row = 0; row < GRID_SIZE; row++) {
    const cells = card.grid[row];

    if (
      !Array.isArray(cells) ||
      cells.length !== GRID_SIZE
    ) {
      errors.push(
        `A linha ${row + 1} deve ter 5 células.`,
      );
      continue;
    }

    for (
      let column = 0;
      column < GRID_SIZE;
      column++
    ) {
      const cell = cells[column];

      if (!cell) {
        errors.push('Célula ausente.');
        continue;
      }

      const isCenter =
        row === FREE_ROW &&
        column === FREE_COLUMN;

      if (
        cell.row !== row ||
        cell.column !== column
      ) {
        errors.push(
          `Posição incorreta em ${row + 1},${column + 1}.`,
        );
      }

      if (isCenter) {
        if (
          !cell.isFree ||
          cell.value !== null
        ) {
          errors.push(
            'A casa central deve ser livre.',
          );
        }
        continue;
      }

      if (cell.isFree) {
        errors.push(
          'Somente a casa central pode ser livre.',
        );
        continue;
      }

      const value = cell.value;

      if (!isValidNumber(value)) {
        errors.push(
          `Número inválido na linha ${row + 1}.`,
        );
        continue;
      }

      const letter = BINGO_LETTERS[column];

      if (!letter) continue;

      const range = COLUMN_RANGES[letter];

      if (
        value < range.min ||
        value > range.max
      ) {
        errors.push(
          `${letter}${value} fora do intervalo permitido.`,
        );
      }

      if (seen.has(value)) {
        errors.push(
          `Número duplicado: ${value}.`,
        );
      }

      seen.add(value);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verifica se uma célula está marcada.
 *
 * A casa central é sempre marcada.
 */
export function isCellMarked(
  cell: BingoCell,
  drawnNumbers: ReadonlySet<number>,
): boolean {
  if (cell.isFree) return true;

  return (
    cell.value !== null &&
    drawnNumbers.has(cell.value)
  );
}

/**
 * Cria todas as combinações
 * habilitadas nas configurações.
 */
export function getCombinations(
  rules: BingoRules,
): BingoCombination[] {
  const combinations: BingoCombination[] = [];

  if (rules.horizontal) {
    for (let row = 0; row < GRID_SIZE; row++) {
      combinations.push({
        id: `horizontal-${row}`,
        pattern: 'horizontal',
        index: row,
        label: `${row + 1}ª linha horizontal`,
        positions: Array.from(
          { length: GRID_SIZE },
          (_, column) => ({ row, column }),
        ),
      });
    }
  }

  if (rules.vertical) {
    for (
      let column = 0;
      column < GRID_SIZE;
      column++
    ) {
      combinations.push({
        id: `vertical-${column}`,
        pattern: 'vertical',
        index: column,
        label: `Coluna ${BINGO_LETTERS[column]}`,
        positions: Array.from(
          { length: GRID_SIZE },
          (_, row) => ({ row, column }),
        ),
      });
    }
  }

  if (rules.diagonal) {
    combinations.push({
      id: 'diagonal-main',
      pattern: 'diagonal',
      index: 0,
      label: 'Diagonal principal',
      positions: Array.from(
        { length: GRID_SIZE },
        (_, index) => ({
          row: index,
          column: index,
        }),
      ),
    });

    combinations.push({
      id: 'diagonal-secondary',
      pattern: 'diagonal',
      index: 1,
      label: 'Diagonal secundária',
      positions: Array.from(
        { length: GRID_SIZE },
        (_, index) => ({
          row: index,
          column: GRID_SIZE - 1 - index,
        }),
      ),
    });
  }

  if (rules.corners) {
    combinations.push({
      id: 'four-corners',
      pattern: 'corners',
      label: 'Quatro cantos',
      positions: [
        { row: 0, column: 0 },
        { row: 0, column: 4 },
        { row: 4, column: 0 },
        { row: 4, column: 4 },
      ],
    });
  }

  if (rules.full) {
    const positions: BingoPosition[] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (
        let column = 0;
        column < GRID_SIZE;
        column++
      ) {
        positions.push({ row, column });
      }
    }

    combinations.push({
      id: 'full-card',
      pattern: 'full',
      label: 'Cartela cheia',
      positions,
    });
  }

  return combinations;
}

/**
 * Analisa uma combinação específica.
 *
 * Retorna as posições completas
 * e os números que ainda faltam.
 */
export function inspectCombination(
  card: BingoCard,
  combination: BingoCombination,
  drawnNumbers: ReadonlySet<number>,
): {
  completedPositions: BingoPosition[];
  missingPositions: BingoPosition[];
  missingNumbers: number[];
} {
  const completedPositions: BingoPosition[] = [];
  const missingPositions: BingoPosition[] = [];
  const missingNumbers: number[] = [];

  for (const position of combination.positions) {
    const cell =
      card.grid[position.row]?.[position.column];

    if (!cell) {
      throw new Error(
        'Cartela inválida: célula ausente.',
      );
    }

    if (isCellMarked(cell, drawnNumbers)) {
      completedPositions.push(position);
    } else {
      missingPositions.push(position);

      if (cell.value !== null) {
        missingNumbers.push(cell.value);
      }
    }
  }

  return {
    completedPositions,
    missingPositions,
    missingNumbers,
  };
}

/**
 * Analisa uma cartela inteira.
 *
 * Identifica:
 * - Números marcados
 * - Progresso geral
 * - Combinações vencedoras
 * - Combinações a um número da vitória
 */
export function analyzeCard(
  card: BingoCard,
  drawnNumbers: readonly number[],
  rules: BingoRules,
): BingoCardAnalysis {
  const validation = validateCard(card);

  if (!validation.valid) {
    throw new Error(
      `Cartela ${card.id} inválida: ` +
      validation.errors.join(' '),
    );
  }

  const drawn = new Set(
    drawnNumbers.filter(isValidNumber),
  );

  let markedCount = 0;

  for (const row of card.grid) {
    for (const cell of row) {
      if (
        !cell.isFree &&
        isCellMarked(cell, drawn)
      ) {
        markedCount++;
      }
    }
  }

  const totalNumbers = 24;

  const percentage =
    (markedCount / totalNumbers) * 100;

  const wins: BingoResult[] = [];

  const almostWins: AlmostBingoResult[] = [];

  const progress: BingoProgress[] = [];

  const combinations = getCombinations(rules);

  for (const combination of combinations) {
    const inspection = inspectCombination(
      card,
      combination,
      drawn,
    );

    const requiredCount =
      combination.positions.length;

    const completedCount =
      inspection.completedPositions.length;

    const remainingCount =
      inspection.missingPositions.length;

    progress.push({
      combination,
      completedCount,
      requiredCount,
      remainingCount,
      percentage:
        (completedCount / requiredCount) * 100,
    });

    if (remainingCount === 0) {
      wins.push({
        cardId: card.id,
        cardName: card.name,
        combination,
        completedPositions:
          inspection.completedPositions,
      });
    }

    if (remainingCount === 1) {
      almostWins.push({
        cardId: card.id,
        cardName: card.name,
        combination,
        missingNumbers:
          inspection.missingNumbers,
        missingPositions:
          inspection.missingPositions,
        remainingCount,
      });
    }
  }

  progress.sort(
    (a, b) =>
      a.remainingCount - b.remainingCount ||
      b.percentage - a.percentage,
  );

  return {
    cardId: card.id,
    cardName: card.name,
    markedCount,
    totalNumbers,
    percentage,
    isWinner: wins.length > 0,
    wins,
    almostWins,
    combinations: progress,
  };
}

/**
 * Analisa todas as cartelas.
 *
 * Uma única bola pode completar
 * várias combinações e provocar
 * vitórias simultâneas.
 */
export function analyzeGame(
  game: BingoGame,
): BingoGameAnalysis {
  const cards = game.cards.map((card) =>
    analyzeCard(
      card,
      game.drawnNumbers,
      game.settings.rules,
    ),
  );

  const winners = cards.flatMap(
    (card) => card.wins,
  );

  const almostWins = cards.flatMap(
    (card) => card.almostWins,
  );

  almostWins.sort(
    (a, b) =>
      a.remainingCount - b.remainingCount ||
      a.cardName.localeCompare(b.cardName),
  );

  return {
    cards,
    winners,
    almostWins,
    totalWinners: new Set(
      winners.map((win) => win.cardId),
    ).size,
    totalAlmostWins: almostWins.length,
  };
}

/**
 * Retorna todos os números faltantes
 * em combinações que estão a um
 * número do bingo.
 *
 * Útil para destacar as células
 * na interface.
 */
export function getAlmostBingoNumbers(
  analysis: BingoCardAnalysis,
): number[] {
  return [
    ...new Set(
      analysis.almostWins.flatMap(
        (result) => result.missingNumbers,
      ),
    ),
  ];
}

/**
 * Retorna as posições que fazem
 * parte de combinações vencedoras.
 */
export function getWinningPositions(
  analysis: BingoCardAnalysis,
): BingoPosition[] {
  const positions = new Map<
    string,
    BingoPosition
  >();

  for (const win of analysis.wins) {
    for (const position of win.completedPositions) {
      positions.set(
        `${position.row}-${position.column}`,
        position,
      );
    }
  }

  return [...positions.values()];
}

/**
 * Registra um número sorteado.
 *
 * Não permite:
 * - Número fora de 1 a 75
 * - Número duplicado
 *
 * Retorna um novo estado.
 * Nunca modifica o estado original.
 */
export function drawNumber(
  game: BingoGame,
  number: number,
): BingoGame {
  if (!isValidNumber(number)) {
    throw new Error(
      'O número deve estar entre 1 e 75.',
    );
  }

  if (game.drawnNumbers.includes(number)) {
    throw new Error(
      `O número ${number} já foi sorteado.`,
    );
  }

  return {
    ...game,
    drawnNumbers: [
      ...game.drawnNumbers,
      number,
    ],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Desfaz o último sorteio.
 *
 * As marcações e vitórias serão
 * recalculadas automaticamente
 * quando analyzeGame for executado.
 */
export function undoLastDraw(
  game: BingoGame,
): BingoGame {
  if (game.drawnNumbers.length === 0) {
    return game;
  }

  return {
    ...game,
    drawnNumbers: game.drawnNumbers.slice(
      0,
      -1,
    ),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Remove um número específico
 * do histórico da rodada.
 *
 * A confirmação deve acontecer
 * na interface, antes da chamada.
 */
export function removeDrawnNumber(
  game: BingoGame,
  number: number,
): BingoGame {
  if (!game.drawnNumbers.includes(number)) {
    return game;
  }

  return {
    ...game,
    drawnNumbers: game.drawnNumbers.filter(
      (value) => value !== number,
    ),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Inicia uma nova rodada.
 *
 * Preserva:
 * - Todas as cartelas
 * - Regras de vitória
 * - Preferências de interface
 *
 * Limpa:
 * - Histórico de sorteios
 *
 * Alertas, marcações e vitórias
 * desaparecem automaticamente
 * porque são dados derivados.
 */
export function startNewRound(
  game: BingoGame,
): BingoGame {
  return {
    ...game,
    drawnNumbers: [],
    round: game.round + 1,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Adiciona uma cartela validada.
 */
export function addCard(
  game: BingoGame,
  card: BingoCard,
): BingoGame {
  const validation = validateCard(card);

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(' '),
    );
  }

  if (
    game.cards.some(
      (existing) => existing.id === card.id,
    )
  ) {
    throw new Error(
      `A cartela ${card.id} já está cadastrada.`,
    );
  }

  return {
    ...game,
    cards: [...game.cards, card],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Atualiza uma cartela existente.
 */
export function updateCard(
  game: BingoGame,
  card: BingoCard,
): BingoGame {
  const validation = validateCard(card);

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(' '),
    );
  }

  if (
    !game.cards.some(
      (existing) => existing.id === card.id,
    )
  ) {
    throw new Error(
      'Cartela não encontrada.',
    );
  }

  return {
    ...game,
    cards: game.cards.map(
      (existing) =>
        existing.id === card.id
          ? card
          : existing,
    ),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Exclui uma cartela.
 *
 * Não altera o histórico
 * dos números sorteados.
 */
export function deleteCard(
  game: BingoGame,
  cardId: string,
): BingoGame {
  return {
    ...game,
    cards: game.cards.filter(
      (card) => card.id !== cardId,
    ),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Retorna o último número sorteado.
 */
export function getLastDrawnNumber(
  game: BingoGame,
): number | null {
  return game.drawnNumbers.at(-1) ?? null;
}

/**
 * Verifica se um número já saiu.
 */
export function wasNumberDrawn(
  game: BingoGame,
  number: number,
): boolean {
  return game.drawnNumbers.includes(number);
}
