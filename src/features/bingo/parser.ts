
import {
  BINGO_LETTERS,
  COLUMN_RANGES,
  FREE_COLUMN,
  FREE_ROW,
  GRID_SIZE,
  type BingoCard,
  type BingoCell,
  type BingoGrid,
  type BingoLetter,
  type BingoValidationResult,
} from '../../models/bingo';

import { validateCard } from './engine';

/**
 * Bingo Tracker
 * Importador de cartelas por texto.
 *
 * Formato:
 * B6;B10;B3;B14;B11;I22;...
 *
 * Ordem:
 * B: 5 números
 * I: 5 números
 * N: 4 números (centro livre)
 * G: 5 números
 * O: 5 números
 *
 * Total: 24 números.
 */

export interface ParsedBingoSequence {
  grid: BingoGrid | null;
  validation: BingoValidationResult;
  normalizedSequence: string;
}

interface ParsedToken {
  letter: BingoLetter;
  value: number;
}

/**
 * Remove espaços, quebras de linha
 * e padroniza as letras.
 */
export function normalizeSequence(
  sequence: string,
): string {
  return sequence
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/;+$/, '');
}

/**
 * Converte texto em tokens.
 *
 * Exemplo:
 * "B6;I22" -> [
 *   { letter: "B", value: 6 },
 *   { letter: "I", value: 22 }
 * ]
 */
export function tokenizeSequence(
  sequence: string,
): {
  tokens: ParsedToken[];
  errors: string[];
} {
  const normalized = normalizeSequence(sequence);

  const tokens: ParsedToken[] = [];
  const errors: string[] = [];

  if (!normalized) {
    return {
      tokens,
      errors: ['Informe os números da cartela.'],
    };
  }

  const entries = normalized.split(';');

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];

    if (!entry) {
      errors.push(
        `Entrada vazia na posição ${index + 1}.`,
      );
      continue;
    }

    const match = /^([BINGO])(\d{1,2})$/.exec(entry);

    if (!match) {
      errors.push(
        `Entrada inválida: ${entry}. Use B6, I22, N35 etc.`,
      );
      continue;
    }

    const letter = match[1] as BingoLetter;
    const value = Number(match[2]);

    const range = COLUMN_RANGES[letter];

    if (
      value < range.min ||
      value > range.max
    ) {
      errors.push(
        `${letter}${value} está fora do intervalo ` +
        `${range.min}–${range.max}.`,
      );
      continue;
    }

    tokens.push({ letter, value });
  }

  return { tokens, errors };
}

/**
 * Cria uma matriz vazia de 5x5.
 *
 * A casa central já nasce livre.
 */
export function createEmptyGrid(): BingoGrid {
  return Array.from(
    { length: GRID_SIZE },
    (_, row) =>
      Array.from(
        { length: GRID_SIZE },
        (_, column): BingoCell => ({
          row,
          column,
          value: null,
          isFree:
            row === FREE_ROW &&
            column === FREE_COLUMN,
        }),
      ),
  );
}

/**
 * Analisa uma sequência de 24 números.
 *
 * Exige exatamente:
 * 5 B, 5 I, 4 N, 5 G e 5 O.
 *
 * A ordem dentro de cada coluna
 * representa as linhas de cima
 * para baixo.
 */
export function parseBingoSequence(
  sequence: string,
): ParsedBingoSequence {
  const normalizedSequence =
    normalizeSequence(sequence);

  const { tokens, errors } =
    tokenizeSequence(normalizedSequence);

  const expectedCounts = [5, 5, 4, 5, 5];

  if (tokens.length !== 24) {
    errors.push(
      `A cartela precisa de 24 números válidos. ` +
      `Foram encontrados ${tokens.length}.`,
    );
  }

  const seen = new Set<number>();

  for (const token of tokens) {
    if (seen.has(token.value)) {
      errors.push(
        `Número duplicado: ${token.value}.`,
      );
    }

    seen.add(token.value);
  }

  const grid = createEmptyGrid();

  let tokenIndex = 0;

  for (
    let column = 0;
    column < GRID_SIZE;
    column++
  ) {
    const letter = BINGO_LETTERS[column];
    const expectedCount = expectedCounts[column];

    if (
      !letter ||
      expectedCount === undefined
    ) {
      continue;
    }

    for (
      let position = 0;
      position < expectedCount;
      position++
    ) {
      const token = tokens[tokenIndex];

      if (!token) break;

      if (token.letter !== letter) {
        errors.push(
          `Posição ${tokenIndex + 1}: ` +
          `esperado ${letter}, ` +
          `recebido ${token.letter}.`,
        );
      }

      const row =
        column === FREE_COLUMN &&
        position >= FREE_ROW
          ? position + 1
          : position;

      const cell = grid[row]?.[column];

      if (cell) {
        cell.value = token.value;
      }

      tokenIndex++;
    }
  }

  if (errors.length > 0) {
    return {
      grid: null,
      validation: {
        valid: false,
        errors: [...new Set(errors)],
      },
      normalizedSequence,
    };
  }

  const temporaryCard: BingoCard = {
    id: 'validation',
    name: 'Validação',
    grid,
    createdAt: new Date(0).toISOString(),
  };

  const validation = validateCard(temporaryCard);

  return {
    grid: validation.valid ? grid : null,
    validation,
    normalizedSequence,
  };
}

/**
 * Cria uma cartela a partir
 * de uma sequência validada.
 */
export function createCardFromSequence(
  id: string,
  sequence: string,
  name?: string,
): BingoCard {
  const cardId = id.trim();

  if (!cardId) {
    throw new Error(
      'Informe o identificador da cartela.',
    );
  }

  const result = parseBingoSequence(sequence);

  if (
    !result.validation.valid ||
    !result.grid
  ) {
    throw new Error(
      result.validation.errors.join(' '),
    );
  }

  return {
    id: cardId,
    name: name?.trim() || `Cartela ${cardId}`,
    grid: result.grid,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Converte uma cartela em uma
 * sequência de texto.
 *
 * A ordem é sempre:
 * B, I, N, G, O.
 *
 * A casa central livre é ignorada.
 */
export function cardToSequence(
  card: BingoCard,
): string {
  const validation = validateCard(card);

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(' '),
    );
  }

  const entries: string[] = [];

  for (
    let column = 0;
    column < GRID_SIZE;
    column++
  ) {
    const letter = BINGO_LETTERS[column];

    if (!letter) continue;

    for (
      let row = 0;
      row < GRID_SIZE;
      row++
    ) {
      if (
        row === FREE_ROW &&
        column === FREE_COLUMN
      ) {
        continue;
      }

      const cell = card.grid[row]?.[column];

      if (
        !cell ||
        cell.value === null
      ) {
        throw new Error(
          'Cartela incompleta.',
        );
      }

      entries.push(
        `${letter}${cell.value}`,
      );
    }
  }

  return entries.join(';');
}

/**
 * Importa várias cartelas.
 *
 * Formato de cada linha:
 *
 * 1942|B6;B10;...;O75
 *
 * O identificador é separado
 * da sequência pelo caractere |.
 */
export function importMultipleCards(
  text: string,
): {
  cards: BingoCard[];
  errors: string[];
} {
  const cards: BingoCard[] = [];
  const errors: string[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const identifiers = new Set<string>();

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (!line) continue;

    const separatorIndex = line.indexOf('|');

    if (separatorIndex === -1) {
      errors.push(
        `Linha ${index + 1}: falta o separador |.`,
      );
      continue;
    }

    const id = line
      .slice(0, separatorIndex)
      .trim();

    const sequence = line
      .slice(separatorIndex + 1)
      .trim();

    if (!id) {
      errors.push(
        `Linha ${index + 1}: identificador vazio.`,
      );
      continue;
    }

    if (identifiers.has(id)) {
      errors.push(
        `Linha ${index + 1}: cartela ${id} duplicada.`,
      );
      continue;
    }

    identifiers.add(id);

    try {
      const card = createCardFromSequence(
        id,
        sequence,
      );

      cards.push(card);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro desconhecido.';

      errors.push(
        `Linha ${index + 1} (${id}): ${message}`,
      );
    }
  }

  return { cards, errors };
}

/**
 * Exporta várias cartelas
 * para texto copiável.
 */
export function exportMultipleCards(
  cards: readonly BingoCard[],
): string {
  return cards
    .map(
      (card) =>
        `${card.id}|${cardToSequence(card)}`,
    )
    .join('\n');
}
