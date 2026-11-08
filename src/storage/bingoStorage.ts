
import {
  createInitialGame,
  DEFAULT_BINGO_SETTINGS,
  STORAGE_VERSION,
  type BingoBackup,
  type BingoGame,
  type BingoRules,
  type BingoSettings,
} from '../models/bingo';

import {
  isValidNumber,
  validateCard,
} from '../features/bingo/engine';

/**
 * Bingo Tracker
 * Persistência local e backups.
 *
 * Nenhum backend é necessário.
 */

export const STORAGE_KEY =
  'bingo-tracker:game:v1';

const LEGACY_STORAGE_KEYS: string[] = [];

export interface StorageResult {
  success: boolean;
  error?: string;
}

export interface GameLoadResult {
  game: BingoGame;
  source: 'saved' | 'initial';
  error?: string;
}

/**
 * Verifica se o armazenamento
 * do navegador está disponível.
 */
export function isStorageAvailable(): boolean {
  try {
    const key = '__bingo_storage_test__';

    localStorage.setItem(key, '1');
    localStorage.removeItem(key);

    return true;
  } catch {
    return false;
  }
}

/**
 * Salva a partida atual.
 *
 * Retorna um resultado explícito
 * para a interface poder informar
 * falhas de armazenamento.
 */
export function saveGame(
  game: BingoGame,
): StorageResult {
  try {
    const validation = validateGameData(game);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(' '),
      };
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(game),
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a partida.',
    };
  }
}

/**
 * Carrega uma partida salva.
 *
 * Não sobrescreve dados inválidos.
 * Retorna um estado inicial separado
 * e informa o problema encontrado.
 */
export function loadGame(): GameLoadResult {
  try {
    const stored = localStorage.getItem(
      STORAGE_KEY,
    );

    if (!stored) {
      return {
        game: createInitialGame(),
        source: 'initial',
      };
    }

    const parsed: unknown = JSON.parse(stored);

    const game = parseGameData(parsed);

    return {
      game,
      source: 'saved',
    };
  } catch (error) {
    return {
      game: createInitialGame(),
      source: 'initial',
      error:
        error instanceof Error
          ? error.message
          : 'Falha ao restaurar a partida.',
    };
  }
}

/**
 * Exclui o estado salvo.
 *
 * A interface deve solicitar
 * confirmação antes desta operação.
 */
export function clearSavedGame(): StorageResult {
  try {
    localStorage.removeItem(STORAGE_KEY);

    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Não foi possível limpar os dados.',
    };
  }
}

/**
 * Retorna o tamanho aproximado
 * do estado salvo em bytes.
 */
export function getSavedGameSize(): number {
  try {
    const value = localStorage.getItem(
      STORAGE_KEY,
    );

    return value
      ? new Blob([value]).size
      : 0;
  } catch {
    return 0;
  }
}

/**
 * Verifica se um valor é um objeto.
 */
function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isIsoDate(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !Number.isNaN(Date.parse(value))
  );
}

/**
 * Valida configurações e regras.
 */
function validateSettings(
  value: unknown,
): value is BingoSettings {
  if (!isRecord(value)) return false;

  const settings = value as Record<
    string,
    unknown
  >;

  if (!isRecord(settings.rules)) {
    return false;
  }

  const rules = settings.rules;

  const ruleNames: (keyof BingoRules)[] = [
    'horizontal',
    'vertical',
    'diagonal',
    'corners',
    'full',
  ];

  for (const rule of ruleNames) {
    if (typeof rules[rule] !== 'boolean') {
      return false;
    }
  }

  if (
    settings.viewMode !== 'normal' &&
    settings.viewMode !== 'compact'
  ) {
    return false;
  }

  if (
    settings.theme !== 'dark' &&
    settings.theme !== 'light'
  ) {
    return false;
  }

  if (
    settings.sortMode !== 'registration' &&
    settings.sortMode !== 'closest' &&
    settings.sortMode !== 'identifier'
  ) {
    return false;
  }

  return typeof settings.soundEnabled === 'boolean';
}

/**
 * Valida o estado completo.
 *
 * Impede:
 * - Cartelas inválidas
 * - Identificadores duplicados
 * - Números sorteados duplicados
 * - Números fora de 1 a 75
 * - Configurações incompatíveis
 */
export function validateGameData(
  value: unknown,
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return {
      valid: false,
      errors: ['Formato de partida inválido.'],
    };
  }

  if (value.version !== STORAGE_VERSION) {
    errors.push(
      'Versão de armazenamento incompatível.',
    );
  }

  if (!Array.isArray(value.cards)) {
    errors.push('Lista de cartelas inválida.');
  } else {
    const ids = new Set<string>();

    for (const rawCard of value.cards) {
      if (
        !isRecord(rawCard) ||
        typeof rawCard.id !== 'string' ||
        !rawCard.id.trim() ||
        typeof rawCard.name !== 'string' ||
        !isIsoDate(rawCard.createdAt)
      ) {
        errors.push(
          'Uma cartela possui dados inválidos.',
        );
        continue;
      }

      if (ids.has(rawCard.id)) {
        errors.push(
          `Cartela duplicada: ${rawCard.id}.`,
        );
      }

      ids.add(rawCard.id);

      const validation = validateCard(
        rawCard as unknown as BingoGame['cards'][number],
      );

      errors.push(...validation.errors);
    }
  }

  if (!Array.isArray(value.drawnNumbers)) {
    errors.push(
      'Histórico de sorteios inválido.',
    );
  } else {
    const numbers = value.drawnNumbers;

    if (!numbers.every(isValidNumber)) {
      errors.push(
        'O histórico contém números inválidos.',
      );
    }

    if (
      new Set(numbers).size !== numbers.length
    ) {
      errors.push(
        'O histórico contém números duplicados.',
      );
    }
  }

  if (!validateSettings(value.settings)) {
    errors.push('Configurações inválidas.');
  }

  if (
    typeof value.round !== 'number' ||
    !Number.isInteger(value.round) ||
    value.round < 1
  ) {
    errors.push('Número da rodada inválido.');
  }

  if (!isIsoDate(value.updatedAt)) {
    errors.push(
      'Data de atualização inválida.',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Interpreta e valida dados desconhecidos.
 *
 * Não inventa nem corrige números.
 */
export function parseGameData(
  value: unknown,
): BingoGame {
  const validation = validateGameData(value);

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(' '),
    );
  }

  const game = value as BingoGame;

  return {
    ...game,
    cards: game.cards.map((card) => ({
      ...card,
      grid: card.grid.map((row) =>
        row.map((cell) => ({ ...cell })),
      ),
    })),
    drawnNumbers: [...game.drawnNumbers],
    settings: {
      ...DEFAULT_BINGO_SETTINGS,
      ...game.settings,
      rules: { ...game.settings.rules },
    },
  };
}

/**
 * Gera um backup JSON completo.
 *
 * Inclui:
 * - Cartelas
 * - Histórico
 * - Regras
 * - Preferências
 * - Número da rodada
 */
export function exportGameBackup(
  game: BingoGame,
): string {
  const validation = validateGameData(game);

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(' '),
    );
  }

  const backup: BingoBackup = {
    application: 'bingo-tracker',
    exportedAt: new Date().toISOString(),
    game,
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Lê um backup JSON.
 *
 * Não altera o armazenamento.
 * A interface deve apresentar uma
 * confirmação antes de substituir
 * a partida atual.
 */
export function importGameBackup(
  json: string,
): BingoGame {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(
      'O arquivo não contém um JSON válido.',
    );
  }

  if (!isRecord(parsed)) {
    throw new Error(
      'Estrutura do backup inválida.',
    );
  }

  if (
    parsed.application !== 'bingo-tracker'
  ) {
    throw new Error(
      'Este backup não pertence ao Bingo Tracker.',
    );
  }

  if (!isIsoDate(parsed.exportedAt)) {
    throw new Error(
      'Data de exportação inválida.',
    );
  }

  return parseGameData(parsed.game);
}

/**
 * Cria um arquivo JSON para download.
 *
 * Deve ser chamada diretamente
 * após uma ação do usuário.
 */
export function downloadGameBackup(
  game: BingoGame,
): void {
  const json = exportGameBackup(game);

  const blob = new Blob(
    [json],
    { type: 'application/json;charset=utf-8' },
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');

  const date = new Date()
    .toISOString()
    .slice(0, 10);

  link.href = url;
  link.download =
    `bingo-tracker-backup-${date}.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // Libera o endereço temporário.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Lê um arquivo JSON escolhido
 * pelo usuário.
 */
export async function readBackupFile(
  file: File,
): Promise<BingoGame> {
  const text = await file.text();

  return importGameBackup(text);
}
