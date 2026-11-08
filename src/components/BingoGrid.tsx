
import { useMemo } from 'react';
import { Star } from 'lucide-react';

import {
  BINGO_LETTERS,
  type BingoCard,
  type BingoCardAnalysis,
  type BingoPosition,
  type BingoViewMode,
} from '../models/bingo';

import {
  isCellMarked,
} from '../features/bingo/engine';

/**
 * Bingo Tracker
 * Grade visual de uma cartela.
 *
 * As marcações são calculadas
 * exclusivamente pelo histórico.
 */

export interface BingoGridProps {
  card: BingoCard;
  drawnNumbers: readonly number[];
  analysis: BingoCardAnalysis;
  viewMode?: BingoViewMode;
  enlarged?: boolean;
  onCellClick?: (
    value: number | null,
    position: BingoPosition,
  ) => void;
}

type CellStatus =
  | 'normal'
  | 'marked'
  | 'free'
  | 'almost'
  | 'winning';

function positionKey(
  row: number,
  column: number,
): string {
  return `${row}-${column}`;
}

export function BingoGrid({
  card,
  drawnNumbers,
  analysis,
  viewMode = 'normal',
  enlarged = false,
  onCellClick,
}: BingoGridProps) {
  const compact =
    viewMode === 'compact' && !enlarged;

  const drawnSet = useMemo(
    () => new Set(drawnNumbers),
    [drawnNumbers],
  );

  /**
   * Posições que pertencem
   * a combinações vencedoras.
   */
  const winningPositions = useMemo(() => {
    const positions = new Set<string>();

    for (const win of analysis.wins) {
      for (const position of win.completedPositions) {
        positions.add(
          positionKey(
            position.row,
            position.column,
          ),
        );
      }
    }

    return positions;
  }, [analysis.wins]);

  /**
   * Posições que faltam para
   * completar um quase bingo.
   */
  const almostPositions = useMemo(() => {
    const positions = new Set<string>();

    for (const result of analysis.almostWins) {
      for (const position of result.missingPositions) {
        positions.add(
          positionKey(
            position.row,
            position.column,
          ),
        );
      }
    }

    return positions;
  }, [analysis.almostWins]);

  /**
   * Determina o estado visual
   * de cada célula.
   *
   * Prioridade:
   * Vitória > Livre > Quase > Marcada.
   */
  function getCellStatus(
    row: number,
    column: number,
  ): CellStatus {
    const key = positionKey(row, column);

    const cell = card.grid[row]?.[column];

    if (!cell) return 'normal';

    if (winningPositions.has(key)) {
      return 'winning';
    }

    if (cell.isFree) {
      return 'free';
    }

    if (almostPositions.has(key)) {
      return 'almost';
    }

    if (isCellMarked(cell, drawnSet)) {
      return 'marked';
    }

    return 'normal';
  }

  /**
   * Classes visuais por status.
   *
   * Usamos cores específicas para
   * garantir contraste no tema escuro.
   */
  const statusClasses: Record<
    CellStatus,
    string
  > = {
    normal:
      'bg-slate-800/80 text-slate-100 ' +
      'border-slate-700/70',

    marked:
      'bg-emerald-600 text-white ' +
      'border-emerald-400/70',

    free:
      'bg-emerald-900/70 text-emerald-300 ' +
      'border-emerald-600/60',

    almost:
      'bg-amber-500/20 text-amber-300 ' +
      'border-amber-400 ring-1 ring-amber-400/60',

    winning:
      'bg-emerald-400 text-slate-950 ' +
      'border-emerald-200 ring-1 ring-emerald-300',
  };

  const cellSizeClasses = compact
    ? 'text-[clamp(10px,2.8vw,15px)]'
    : enlarged
      ? 'text-xl sm:text-2xl'
      : 'text-lg sm:text-xl';

  const cellPaddingClasses = compact
    ? 'rounded-md'
    : 'rounded-lg sm:rounded-xl';

  const gapClasses = compact
    ? 'gap-0.5'
    : 'gap-1.5 sm:gap-2';

  return (
    <div
      className="w-full min-w-0"
      role="group"
      aria-label={`Grade da ${card.name}`}
    >
      <div
        className={`grid grid-cols-5 ${gapClasses}`}
      >
        {BINGO_LETTERS.map((letter) => (
          <div
            key={letter}
            className={
              'flex items-center justify-center ' +
              'font-black tracking-wide ' +
              'text-emerald-400 ' +
              (compact
                ? 'pb-1 text-xs'
                : 'pb-2 text-xl')
            }
          >
            {letter}
          </div>
        ))}

        {card.grid.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => {
            const status = getCellStatus(
              rowIndex,
              columnIndex,
            );

            const marked =
              isCellMarked(cell, drawnSet);

            const isAlmost =
              status === 'almost';

            const isWinning =
              status === 'winning';

            const label = cell.isFree
              ? 'Casa central livre'
              : (
                  `${BINGO_LETTERS[columnIndex]}` +
                  `${cell.value}`
                );

            const description = cell.isFree
              ? 'marcada automaticamente'
              : isWinning
                ? 'combinação vencedora'
                : isAlmost
                  ? 'falta para o bingo'
                  : marked
                    ? 'número sorteado'
                    : 'não sorteado';

            const content = (
              <>
                {cell.isFree ? (
                  <Star
                    className={
                      compact
                        ? 'h-3 w-3'
                        : 'h-5 w-5'
                    }
                    fill="currentColor"
                    aria-hidden="true"
                  />
                ) : (
                  <span>{cell.value}</span>
                )}

                {isAlmost && !compact && (
                  <span
                    className={
                      'absolute bottom-1 ' +
                      'h-1 w-1 rounded-full ' +
                      'bg-amber-400'
                    }
                    aria-hidden="true"
                  />
                )}
              </>
            );

            const className = [
              'relative flex aspect-square',
              'min-w-0 items-center justify-center',
              'border font-bold tabular-nums',
              'transition-colors duration-150',
              cellSizeClasses,
              cellPaddingClasses,
              statusClasses[status],
              onCellClick
                ? 'cursor-pointer active:scale-95'
                : '',
            ].join(' ');

            const key = positionKey(
              rowIndex,
              columnIndex,
            );

            if (onCellClick) {
              return (
                <button
                  key={key}
                  type="button"
                  className={className}
                  aria-label={
                    `${label}, ${description}`
                  }
                  onClick={() =>
                    onCellClick(
                      cell.value,
                      {
                        row: rowIndex,
                        column: columnIndex,
                      },
                    )
                  }
                >
                  {content}
                </button>
              );
            }

            return (
              <div
                key={key}
                className={className}
                aria-label={
                  `${label}, ${description}`
                }
              >
                {content}
              </div>
            );
          }),
        )}
      </div>

      {!compact && (
        <div
          className={
            'mt-3 flex flex-wrap items-center ' +
            'justify-center gap-x-4 gap-y-2 ' +
            'text-xs text-slate-400'
          }
        >
          <span className="flex items-center gap-1.5">
            <span
              className={
                'h-2.5 w-2.5 rounded-sm ' +
                'bg-emerald-500'
              }
            />
            Sorteado
          </span>

          <span className="flex items-center gap-1.5">
            <span
              className={
                'h-2.5 w-2.5 rounded-sm ' +
                'bg-amber-400'
              }
            />
            Falta
          </span>

          <span className="flex items-center gap-1.5">
            <span
              className={
                'h-2.5 w-2.5 rounded-sm ' +
                'bg-emerald-300'
              }
            />
            Bingo
          </span>
        </div>
      )}
    </div>
  );
}

export default BingoGrid;
