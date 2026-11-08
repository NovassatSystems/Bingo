
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  BINGO_LETTERS,
  COLUMN_RANGES,
  FREE_COLUMN,
  FREE_ROW,
} from '../../models/bingo';

import {
  cardToSequence,
  createCardFromSequence,
  createEmptyGrid,
  normalizeSequence,
  parseBingoSequence,
} from './parser';

import {
  validateCard,
} from './engine';

/**
 * Bingo Tracker
 * Testes automatizados do parser.
 *
 * Sequência de 24 números:
 * B: 5
 * I: 5
 * N: 4 (centro livre)
 * G: 5
 * O: 5
 */

const VALID_SEQUENCE = [
  'B6', 'B10', 'B3', 'B14', 'B11',
  'I22', 'I17', 'I29', 'I16', 'I28',
  'N35', 'N38', 'N41', 'N44',
  'G50', 'G55', 'G58', 'G49', 'G59',
  'O65', 'O70', 'O71', 'O63', 'O74',
].join(';');

const EXPECTED_ROWS = [
  [6, 22, 35, 50, 65],
  [10, 17, 38, 55, 70],
  [3, 29, null, 58, 71],
  [14, 16, 41, 49, 63],
  [11, 28, 44, 59, 74],
];

describe('Parser — estrutura da cartela', () => {
  it('cria uma grade de 5 linhas', () => {
    const grid = createEmptyGrid();

    expect(grid).toHaveLength(5);
  });

  it('cria cinco colunas em cada linha', () => {
    const grid = createEmptyGrid();

    grid.forEach((row) => {
      expect(row).toHaveLength(5);
    });
  });

  it('define o centro como livre', () => {
    const grid = createEmptyGrid();

    const center =
      grid[FREE_ROW]?.[FREE_COLUMN];

    expect(center?.isFree).toBe(true);
    expect(center?.value).toBeNull();
  });

  it('preserva as coordenadas das células', () => {
    const grid = createEmptyGrid();

    grid.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        expect(cell.row).toBe(rowIndex);
        expect(cell.column).toBe(columnIndex);
      });
    });
  });

  it('define os intervalos corretos', () => {
    expect(COLUMN_RANGES.B).toEqual({
      min: 1,
      max: 15,
    });

    expect(COLUMN_RANGES.I).toEqual({
      min: 16,
      max: 30,
    });

    expect(COLUMN_RANGES.N).toEqual({
      min: 31,
      max: 45,
    });

    expect(COLUMN_RANGES.G).toEqual({
      min: 46,
      max: 60,
    });

    expect(COLUMN_RANGES.O).toEqual({
      min: 61,
      max: 75,
    });
  });

  it('mantém a ordem B-I-N-G-O', () => {
    expect(BINGO_LETTERS).toEqual([
      'B', 'I', 'N', 'G', 'O',
    ]);
  });
});

describe('Parser — sequência válida', () => {
  it('aceita os 24 números corretos', () => {
    const result =
      parseBingoSequence(VALID_SEQUENCE);

    expect(result.validation.valid).toBe(true);
    expect(result.grid).not.toBeNull();
  });

  it('distribui os números por coluna', () => {
    const result =
      parseBingoSequence(VALID_SEQUENCE);

    expect(result.validation.valid).toBe(true);

    const actualRows = result.grid!.map(
      (row) => row.map((cell) => cell.value),
    );

    expect(actualRows).toEqual(EXPECTED_ROWS);
  });

  it('não desloca a coluna N após o centro', () => {
    const result =
      parseBingoSequence(VALID_SEQUENCE);

    const grid = result.grid!;

    expect(grid[0]?.[2]?.value).toBe(35);
    expect(grid[1]?.[2]?.value).toBe(38);

    expect(grid[2]?.[2]?.isFree).toBe(true);
    expect(grid[2]?.[2]?.value).toBeNull();

    expect(grid[3]?.[2]?.value).toBe(41);
    expect(grid[4]?.[2]?.value).toBe(44);
  });

  it('gera uma cartela válida para o motor', () => {
    const card = createCardFromSequence(
      '1942',
      VALID_SEQUENCE,
      'Cartela 1942',
    );

    const validation = validateCard(card);

    expect(validation.valid).toBe(true);
    expect(card.id).toBe('1942');
    expect(card.name).toBe('Cartela 1942');
  });
});

describe('Parser — entradas inválidas', () => {
  it('rejeita sequência vazia', () => {
    const result = parseBingoSequence('');

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita menos de 24 números', () => {
    const incomplete = VALID_SEQUENCE
      .split(';')
      .slice(0, 23)
      .join(';');

    const result =
      parseBingoSequence(incomplete);

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita mais de 24 números', () => {
    const result = parseBingoSequence(
      `${VALID_SEQUENCE};O75`,
    );

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita número fora do intervalo B', () => {
    const invalid = VALID_SEQUENCE.replace(
      'B6',
      'B16',
    );

    const result =
      parseBingoSequence(invalid);

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita número fora do intervalo I', () => {
    const invalid = VALID_SEQUENCE.replace(
      'I22',
      'I31',
    );

    const result =
      parseBingoSequence(invalid);

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita número fora do intervalo N', () => {
    const invalid = VALID_SEQUENCE.replace(
      'N35',
      'N46',
    );

    const result =
      parseBingoSequence(invalid);

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita número fora do intervalo G', () => {
    const invalid = VALID_SEQUENCE.replace(
      'G50',
      'G61',
    );

    const result =
      parseBingoSequence(invalid);

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita número fora do intervalo O', () => {
    const invalid = VALID_SEQUENCE.replace(
      'O65',
      'O60',
    );

    const result =
      parseBingoSequence(invalid);

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita números repetidos', () => {
    const invalid = VALID_SEQUENCE.replace(
      'B10',
      'B6',
    );

    const result =
      parseBingoSequence(invalid);

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita letras de colunas trocadas', () => {
    const invalid = VALID_SEQUENCE.replace(
      'B6',
      'I6',
    );

    const result =
      parseBingoSequence(invalid);

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita valores não numéricos', () => {
    const invalid = VALID_SEQUENCE.replace(
      'B6',
      'BXX',
    );

    const result =
      parseBingoSequence(invalid);

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita número zero', () => {
    const invalid = VALID_SEQUENCE.replace(
      'B6',
      'B0',
    );

    const result =
      parseBingoSequence(invalid);

    expect(result.validation.valid).toBe(false);
  });

  it('rejeita número acima de 75', () => {
    const invalid = VALID_SEQUENCE.replace(
      'O65',
      'O76',
    );

    const result =
      parseBingoSequence(invalid);

    expect(result.validation.valid).toBe(false);
  });
});

describe('Parser — normalização', () => {
  it('remove espaços externos', () => {
    const normalized = normalizeSequence(
      '  B6;I22;N35  ',
    );

    expect(normalized).toBe(
      'B6;I22;N35',
    );
  });

  it('mantém os separadores da sequência', () => {
    const normalized = normalizeSequence(
      VALID_SEQUENCE,
    );

    expect(normalized).toContain(';');
  });

  it('não altera uma sequência válida', () => {
    const normalized = normalizeSequence(
      VALID_SEQUENCE,
    );

    expect(normalized).toBe(
      VALID_SEQUENCE,
    );
  });
});

describe('Parser — conversão de cartela', () => {
  it('converte cartela em sequência', () => {
    const card = createCardFromSequence(
      '1942',
      VALID_SEQUENCE,
    );

    const exported = cardToSequence(card);

    expect(exported).toBe(VALID_SEQUENCE);
  });

  it('mantém exatamente 24 tokens', () => {
    const card = createCardFromSequence(
      '1942',
      VALID_SEQUENCE,
    );

    const exported = cardToSequence(card);

    expect(
      exported.split(';'),
    ).toHaveLength(24);
  });

  it('não exporta o centro livre', () => {
    const card = createCardFromSequence(
      '1942',
      VALID_SEQUENCE,
    );

    const exported = cardToSequence(card);

    expect(exported).not.toContain('FREE');
    expect(exported).not.toContain('LIVRE');
    expect(exported).not.toContain('★');
  });

  it('preserva a grade após importar e exportar', () => {
    const original = createCardFromSequence(
      '1942',
      VALID_SEQUENCE,
    );

    const exported = cardToSequence(original);

    const restored = createCardFromSequence(
      '1942',
      exported,
    );

    expect(restored.grid).toEqual(
      original.grid,
    );
  });

  it('preserva a ordem das cinco colunas', () => {
    const card = createCardFromSequence(
      '1942',
      VALID_SEQUENCE,
    );

    const tokens =
      cardToSequence(card).split(';');

    expect(tokens.slice(0, 5)).toEqual([
      'B6', 'B10', 'B3', 'B14', 'B11',
    ]);

    expect(tokens.slice(5, 10)).toEqual([
      'I22', 'I17', 'I29', 'I16', 'I28',
    ]);

    expect(tokens.slice(10, 14)).toEqual([
      'N35', 'N38', 'N41', 'N44',
    ]);

    expect(tokens.slice(14, 19)).toEqual([
      'G50', 'G55', 'G58', 'G49', 'G59',
    ]);

    expect(tokens.slice(19, 24)).toEqual([
      'O65', 'O70', 'O71', 'O63', 'O74',
    ]);
  });
});
