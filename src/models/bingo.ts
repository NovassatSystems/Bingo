
/**
 * Bingo Tracker
 * Modelos e contratos do domínio.
 *
 * Bingo tradicional de 75 números.
 * Cartelas de 5 linhas e 5 colunas.
 * Centro livre na posição [2][2].
 */

export const BINGO_LETTERS = [
  'B',
  'I',
  'N',
  'G',
  'O',
] as const;

export type BingoLetter =
  (typeof BINGO_LETTERS)[number];

export type BingoNumber = number;

export type BingoGrid =
  BingoCell[][];

export const GRID_SIZE = 5;

export const FREE_ROW = 2;
export const FREE_COLUMN = 2;

export const COLUMN_RANGES: Record<
  BingoLetter,
  { min: number; max: number }
> = {
  B: { min: 1, max: 15 },
  I: { min: 16, max: 30 },
  N: { min: 31, max: 45 },
  G: { min: 46, max: 60 },
  O: { min: 61, max: 75 },
};

/**
 * Uma célula da cartela.
 *
 * A propriedade marked não é armazenada.
 * A marcação é calculada a partir dos
 * números sorteados.
 */
export interface BingoCell {
  row: number;
  column: number;
  value: BingoNumber | null;
  isFree: boolean;
}

/**
 * Cartela cadastrada.
 */
export interface BingoCard {
  id: string;
  name: string;
  grid: BingoGrid;
  createdAt: string;
}

/**
 * Modalidades de vitória.
 *
 * Cada modalidade pode ser ativada
 * ou desativada independentemente.
 */
export type BingoPattern =
  | 'horizontal'
  | 'vertical'
  | 'diagonal'
  | 'corners'
  | 'full';

/**
 * Regras configuráveis da partida.
 */
export interface BingoRules {
  horizontal: boolean;
  vertical: boolean;
  diagonal: boolean;
  corners: boolean;
  full: boolean;
}

/**
 * Regras iniciais.
 *
 * Diagonal e cartela cheia
 * começam desativadas.
 */
export const DEFAULT_BINGO_RULES: BingoRules = {
  horizontal: true,
  vertical: true,
  diagonal: false,
  corners: true,
  full: false,
};

/**
 * Posição de uma célula.
 */
export interface BingoPosition {
  row: number;
  column: number;
}

/**
 * Combinação que pode gerar vitória.
 *
 * Exemplo:
 * horizontal, índice 2,
 * terceira linha da cartela.
 */
export interface BingoCombination {
  id: string;
  pattern: BingoPattern;
  index?: number;
  label: string;
  positions: BingoPosition[];
}

/**
 * Resultado de uma combinação vencedora.
 */
export interface BingoResult {
  cardId: string;
  cardName: string;
  combination: BingoCombination;
  completedPositions: BingoPosition[];
}

/**
 * Resultado de quase bingo.
 *
 * Informa os números necessários
 * para completar a combinação.
 */
export interface AlmostBingoResult {
  cardId: string;
  cardName: string;
  combination: BingoCombination;
  missingNumbers: BingoNumber[];
  missingPositions: BingoPosition[];
  remainingCount: number;
}

/**
 * Progresso de uma combinação.
 *
 * Utilizado para ordenar cartelas
 * pela proximidade de vitória.
 */
export interface BingoProgress {
  combination: BingoCombination;
  completedCount: number;
  requiredCount: number;
  remainingCount: number;
  percentage: number;
}

/**
 * Análise completa de uma cartela.
 */
export interface BingoCardAnalysis {
  cardId: string;
  cardName: string;
  markedCount: number;
  totalNumbers: number;
  percentage: number;
  isWinner: boolean;
  wins: BingoResult[];
  almostWins: AlmostBingoResult[];
  combinations: BingoProgress[];
}

/**
 * Preferências de interface.
 */
export type BingoViewMode =
  | 'normal'
  | 'compact';

export type BingoTheme =
  | 'dark'
  | 'light';

export type BingoSortMode =
  | 'registration'
  | 'closest'
  | 'identifier';

/**
 * Configurações gerais.
 */
export interface BingoSettings {
  rules: BingoRules;
  viewMode: BingoViewMode;
  theme: BingoTheme;
  sortMode: BingoSortMode;
  soundEnabled: boolean;
}

/**
 * Configurações iniciais.
 */
export const DEFAULT_BINGO_SETTINGS: BingoSettings = {
  rules: { ...DEFAULT_BINGO_RULES },
  viewMode: 'normal',
  theme: 'dark',
  sortMode: 'registration',
  soundEnabled: false,
};

/**
 * Estado persistente da partida.
 *
 * Não armazenamos marcações,
 * alertas ou vitórias.
 *
 * Esses dados serão sempre
 * derivados do histórico.
 */
export interface BingoGame {
  version: number;
  cards: BingoCard[];
  drawnNumbers: BingoNumber[];
  settings: BingoSettings;
  round: number;
  updatedAt: string;
}

/**
 * Versão do formato de armazenamento.
 */
export const STORAGE_VERSION = 1;

/**
 * Estado inicial da aplicação.
 */
export function createInitialGame(): BingoGame {
  return {
    version: STORAGE_VERSION,
    cards: [],
    drawnNumbers: [],
    settings: {
      ...DEFAULT_BINGO_SETTINGS,
      rules: { ...DEFAULT_BINGO_RULES },
    },
    round: 1,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Resultado geral da verificação.
 */
export interface BingoGameAnalysis {
  cards: BingoCardAnalysis[];
  winners: BingoResult[];
  almostWins: AlmostBingoResult[];
  totalWinners: number;
  totalAlmostWins: number;
}

/**
 * Resultado de validação.
 */
export interface BingoValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Dados para importação de cartelas.
 */
export interface BingoCardImport {
  id: string;
  name?: string;
  sequence: string;
}

/**
 * Estrutura do backup JSON.
 */
export interface BingoBackup {
  application: 'bingo-tracker';
  exportedAt: string;
  game: BingoGame;
}
