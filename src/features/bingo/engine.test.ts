
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  DEFAULT_BINGO_RULES,
  createInitialGame,
  type BingoCard,
  type BingoRules,
} from '../../models/bingo';

import {
  createCardFromSequence,
} from './parser';

import {
  addCard,
  analyzeCard,
  analyzeGame,
  deleteCard,
  drawNumber,
  getCombinations,
  isCellMarked,
  removeDrawnNumber,
  startNewRound,
  undoLastDraw,
  updateCard,
  validateCard,
} from './engine';

/**
 * Bingo Tracker
 * Testes automatizados do motor.
 *
 * Cartela fixa usada nos testes:
 *
 * B   I   N   G   O
 * 1  16  31  46  61
 * 2  17  32  47  62
 * 3  18  ★   48  63
 * 4  19  33  49  64
 * 5  20  34  50  65
 */

const TEST_SEQUENCE = [
  'B1', 'B2', 'B3', 'B4', 'B5',
  'I16', 'I17', 'I18', 'I19', 'I20',
  'N31', 'N32', 'N33', 'N34',
  'G46', 'G47', 'G48', 'G49', 'G50',
  'O61', 'O62', 'O63', 'O64', 'O65',
].join(';');

function makeCard(
  id = '1942',
  name = 'Cartela de teste',
): BingoCard {
  return createCardFromSequence(
    id,
    TEST_SEQUENCE,
    name,
  );
}

function makeRules(
  overrides: Partial<BingoRules> = {},
): BingoRules {
  return {
    ...DEFAULT_BINGO_RULES,
    ...overrides,
  };
}

function analyze(
  numbers: number[],
  rules: BingoRules = makeRules(),
) {
  return analyzeCard(
    makeCard(),
    numbers,
    rules,
  );
}

function makeGame() {
  return addCard(
    createInitialGame(),
    makeCard(),
  );
}

describe('Bingo Tracker — validação', () => {
  it('aceita uma cartela válida', () => {
    const result = validateCard(makeCard());

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejeita números fora da coluna', () => {
    const card = makeCard();

    card.grid[0]![0]!.value = 75;

    const result = validateCard(card);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejeita números repetidos', () => {
    const card = makeCard();

    card.grid[1]![0]!.value = 1;

    const result = validateCard(card);

    expect(result.valid).toBe(false);
  });

  it('reconhece o centro livre', () => {
    const card = makeCard();

    const center = card.grid[2]![2]!;

    expect(center.isFree).toBe(true);
    expect(center.value).toBeNull();

    expect(
      isCellMarked(center, new Set<number>()),
    ).toBe(true);
  });
});

describe('Bingo Tracker — combinações', () => {
  it('gera cinco linhas horizontais', () => {
    const combinations = getCombinations(
      makeRules({
        vertical: false,
        corners: false,
      }),
    );

    expect(
      combinations.filter(
        (item) => item.pattern === 'horizontal',
      ),
    ).toHaveLength(5);
  });

  it('gera cinco colunas verticais', () => {
    const combinations = getCombinations(
      makeRules({
        horizontal: false,
        corners: false,
      }),
    );

    expect(
      combinations.filter(
        (item) => item.pattern === 'vertical',
      ),
    ).toHaveLength(5);
  });

  it('gera duas diagonais quando ativadas', () => {
    const combinations = getCombinations(
      makeRules({
        horizontal: false,
        vertical: false,
        corners: false,
        diagonal: true,
      }),
    );

    expect(combinations).toHaveLength(2);

    expect(
      combinations.every(
        (item) => item.pattern === 'diagonal',
      ),
    ).toBe(true);
  });

  it('não gera combinações desativadas', () => {
    const combinations = getCombinations(
      makeRules({
        horizontal: false,
        vertical: false,
        diagonal: false,
        corners: false,
        full: false,
      }),
    );

    expect(combinations).toHaveLength(0);
  });
});

describe('Bingo Tracker — vitórias', () => {
  it('detecta uma linha horizontal completa', () => {
    const result = analyze(
      [1, 16, 31, 46, 61],
    );

    expect(result.isWinner).toBe(true);

    expect(
      result.wins.some(
        (win) =>
          win.combination.pattern === 'horizontal',
      ),
    ).toBe(true);
  });

  it('detecta uma coluna vertical completa', () => {
    const result = analyze(
      [1, 2, 3, 4, 5],
    );

    expect(result.isWinner).toBe(true);

    expect(
      result.wins.some(
        (win) =>
          win.combination.pattern === 'vertical',
      ),
    ).toBe(true);
  });

  it('detecta os quatro cantos', () => {
    const result = analyze(
      [1, 61, 5, 65],
    );

    expect(result.isWinner).toBe(true);

    expect(
      result.wins.some(
        (win) =>
          win.combination.pattern === 'corners',
      ),
    ).toBe(true);
  });

  it('não aceita diagonal desativada', () => {
    const result = analyze(
      [1, 17, 49, 65],
      makeRules({
        horizontal: false,
        vertical: false,
        diagonal: false,
        corners: false,
        full: false,
      }),
    );

    expect(result.isWinner).toBe(false);
  });

  it('aceita diagonal ativada', () => {
    const result = analyze(
      [1, 17, 49, 65],
      makeRules({
        horizontal: false,
        vertical: false,
        diagonal: true,
        corners: false,
        full: false,
      }),
    );

    expect(result.isWinner).toBe(true);

    expect(
      result.wins.some(
        (win) =>
          win.combination.pattern === 'diagonal',
      ),
    ).toBe(true);
  });

  it('detecta cartela cheia', () => {
    const card = makeCard();

    const allNumbers = card.grid
      .flat()
      .filter((cell) => !cell.isFree)
      .map((cell) => cell.value as number);

    const result = analyze(
      allNumbers,
      makeRules({
        horizontal: false,
        vertical: false,
        diagonal: false,
        corners: false,
        full: true,
      }),
    );

    expect(result.isWinner).toBe(true);

    expect(
      result.wins.some(
        (win) =>
          win.combination.pattern === 'full',
      ),
    ).toBe(true);
  });

  it('detecta quase bingo faltando um número', () => {
    const result = analyze(
      [1, 16, 31, 46],
      makeRules({
        horizontal: true,
        vertical: false,
        diagonal: false,
        corners: false,
        full: false,
      }),
    );

    expect(result.isWinner).toBe(false);

    expect(
      result.almostWins.some(
        (item) =>
          item.missingNumbers.includes(61),
      ),
    ).toBe(true);
  });

  it('considera o centro livre em uma linha', () => {
    const result = analyze(
      [3, 18, 48, 63],
      makeRules({
        horizontal: true,
        vertical: false,
        diagonal: false,
        corners: false,
        full: false,
      }),
    );

    expect(result.isWinner).toBe(true);
  });

  it('permite vitórias simultâneas', () => {
    const result = analyze(
      [1, 16, 31, 46, 61, 2, 3, 4, 5],
    );

    expect(result.isWinner).toBe(true);
    expect(result.wins.length).toBeGreaterThan(1);
  });
});

describe('Bingo Tracker — sorteios', () => {
  it('registra um número válido', () => {
    const game = drawNumber(
      makeGame(),
      69,
    );

    expect(game.drawnNumbers).toEqual([69]);
  });

  it('impede números repetidos', () => {
    const first = drawNumber(
      makeGame(),
      69,
    );

    expect(() =>
      drawNumber(first, 69),
    ).toThrow();
  });

  it('rejeita números fora de 1 a 75', () => {
    expect(() =>
      drawNumber(makeGame(), 0),
    ).toThrow();

    expect(() =>
      drawNumber(makeGame(), 76),
    ).toThrow();
  });

  it('desfaz o último sorteio', () => {
    let game = makeGame();

    game = drawNumber(game, 69);
    game = drawNumber(game, 65);
    game = drawNumber(game, 14);

    game = undoLastDraw(game);

    expect(game.drawnNumbers).toEqual([
      69,
      65,
    ]);
  });

  it('remove um número específico', () => {
    let game = makeGame();

    game = drawNumber(game, 69);
    game = drawNumber(game, 65);
    game = drawNumber(game, 14);

    game = removeDrawnNumber(game, 65);

    expect(game.drawnNumbers).toEqual([
      69,
      14,
    ]);
  });

  it('zera os sorteios na nova rodada', () => {
    let game = makeGame();

    game = drawNumber(game, 69);
    game = drawNumber(game, 65);

    const next = startNewRound(game);

    expect(next.drawnNumbers).toEqual([]);
    expect(next.round).toBe(game.round + 1);
  });

  it('preserva as cartelas na nova rodada', () => {
    const game = makeGame();

    const next = startNewRound(game);

    expect(next.cards).toHaveLength(1);
    expect(next.cards[0]?.id).toBe('1942');
    expect(next.cards[0]?.grid).toEqual(
      game.cards[0]?.grid,
    );
  });

  it('preserva as configurações na nova rodada', () => {
    const game = makeGame();

    const next = startNewRound(game);

    expect(next.settings).toEqual(game.settings);
  });
});

describe('Bingo Tracker — gerenciamento de cartelas', () => {
  it('adiciona uma cartela', () => {
    const game = makeGame();

    expect(game.cards).toHaveLength(1);
    expect(game.cards[0]?.id).toBe('1942');
  });

  it('não permite identificadores duplicados', () => {
    const game = makeGame();

    expect(() =>
      addCard(game, makeCard('1942')),
    ).toThrow();
  });

  it('edita uma cartela cadastrada', () => {
    const game = makeGame();

    const edited = {
      ...makeCard(),
      name: 'Cartela atualizada',
    };

    const next = updateCard(game, edited);

    expect(next.cards[0]?.name).toBe(
      'Cartela atualizada',
    );
  });

  it('remove uma cartela cadastrada', () => {
    const game = makeGame();

    const next = deleteCard(game, '1942');

    expect(next.cards).toHaveLength(0);
  });

  it('analisa todas as cartelas', () => {
    let game = makeGame();

    game = addCard(
      game,
      makeCard('2804'),
    );

    game = drawNumber(game, 1);
    game = drawNumber(game, 16);
    game = drawNumber(game, 31);
    game = drawNumber(game, 46);
    game = drawNumber(game, 61);

    const result = analyzeGame(game);

    expect(result.cards).toHaveLength(2);
    expect(result.totalWinners).toBe(2);
  });
});
