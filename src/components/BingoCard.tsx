
import { useState } from 'react';

import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Expand,
  Pencil,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';

import {
  type BingoCard as BingoCardModel,
  type BingoCardAnalysis,
  type BingoViewMode,
} from '../models/bingo';

import { BingoGrid } from './BingoGrid';

/**
 * Bingo Tracker
 *
 * Componente visual de uma cartela.
 *
 * Suporta:
 * - Modo normal
 * - Modo compacto
 * - Ampliação
 * - Progresso
 * - Quase bingo
 * - Múltiplas vitórias
 * - Edição
 * - Exclusão com confirmação
 */

export interface BingoCardProps {
  card: BingoCardModel;
  analysis: BingoCardAnalysis;
  drawnNumbers: readonly number[];
  viewMode?: BingoViewMode;

  onEdit?: (card: BingoCardModel) => void;
  onDelete?: (cardId: string) => void;
}

export function BingoCard({
  card,
  analysis,
  drawnNumbers,
  viewMode = 'normal',
  onEdit,
  onDelete,
}: BingoCardProps) {
  const [expanded, setExpanded] = useState(false);

  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false);

  const [showAllCombinations, setShowAllCombinations] =
    useState(false);

  const compact =
    viewMode === 'compact' && !expanded;

  const hasWon = analysis.isWinner;

  const almostWins = analysis.almostWins;

  const hasAlmostBingo =
    almostWins.length > 0 && !hasWon;

  const percentage = Math.min(
    100,
    Math.max(0, analysis.percentage),
  );

  const closestCombination =
    analysis.combinations[0];

  /**
   * Reúne os números faltantes
   * sem duplicações.
   */
  const missingNumbers = [
    ...new Set(
      almostWins.flatMap(
        (result) => result.missingNumbers,
      ),
    ),
  ].sort((a, b) => a - b);

  function handleDelete() {
    if (!onDelete) return;

    onDelete(card.id);
    setShowDeleteConfirmation(false);
  }

  function handleExpand() {
    setExpanded((current) => !current);
  }

  const statusLabel = hasWon
    ? 'BINGO!'
    : hasAlmostBingo
      ? 'Quase bingo'
      : `${analysis.markedCount}/24`;

  const statusClasses = hasWon
    ? 'bg-emerald-400 text-slate-950'
    : hasAlmostBingo
      ? 'bg-amber-400/20 text-amber-300 border border-amber-500/50'
      : 'bg-slate-700 text-slate-200';

  return (
    <article
      className={[
        'min-w-0 overflow-hidden rounded-2xl',
        'border bg-slate-900',
        'transition-colors duration-200',
        hasWon
          ? 'border-emerald-400 shadow-lg shadow-emerald-500/10'
          : hasAlmostBingo
            ? 'border-amber-500/60'
            : 'border-slate-700',
        expanded ? 'col-span-full' : '',
      ].join(' ')}
      aria-label={`Cartela ${card.name}`}
    >
      {/* Cabeçalho */}
      <header
        className={[
          'flex items-center justify-between',
          'gap-2 border-b border-slate-800',
          compact ? 'px-2 py-2' : 'px-4 py-3',
        ].join(' ')}
      >
        <div className="flex min-w-0 items-center gap-2">
          {hasWon ? (
            <Trophy
              className="h-5 w-5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
          ) : hasAlmostBingo ? (
            <AlertTriangle
              className="h-5 w-5 shrink-0 text-amber-400"
              aria-hidden="true"
            />
          ) : null}

          <div className="min-w-0">
            <h3
              className={[
                'truncate font-bold text-white',
                compact ? 'text-sm' : 'text-lg',
              ].join(' ')}
              title={card.name}
            >
              {card.name}
            </h3>

            {!compact && (
              <p className="text-xs text-slate-400">
                ID: {card.id}
              </p>
            )}
          </div>
        </div>

        <span
          className={[
            'shrink-0 rounded-full px-2 py-1',
            'font-bold',
            compact ? 'text-[10px]' : 'text-xs',
            statusClasses,
          ].join(' ')}
        >
          {statusLabel}
        </span>
      </header>

      {/* Corpo da cartela */}
      <div
        className={
          compact ? 'p-2' : 'p-4'
        }
      >
        <BingoGrid
          card={card}
          drawnNumbers={drawnNumbers}
          analysis={analysis}
          viewMode={viewMode}
          enlarged={expanded}
        />

        {/* Progresso da cartela */}
        {!compact && (
          <div className="mt-4">
            <div
              className={
                'mb-2 flex items-center ' +
                'justify-between text-xs'
              }
            >
              <span className="text-slate-400">
                Números marcados
              </span>

              <span className="font-semibold text-slate-200">
                {analysis.markedCount}/24
                {' · '}
                {Math.round(percentage)}%
              </span>
            </div>

            <div
              className={
                'h-2 overflow-hidden rounded-full ' +
                'bg-slate-800'
              }
              role="progressbar"
              aria-label="Progresso da cartela"
              aria-valuemin={0}
              aria-valuemax={24}
              aria-valuenow={analysis.markedCount}
            >
              <div
                className={
                  'h-full rounded-full transition-all ' +
                  'duration-300 ' +
                  (hasWon
                    ? 'bg-emerald-400'
                    : 'bg-emerald-600')
                }
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Vitória */}
        {hasWon && (
          <div
            className={[
              'mt-3 rounded-xl border',
              'border-emerald-500/40',
              'bg-emerald-500/10',
              compact ? 'p-2' : 'p-3',
            ].join(' ')}
            role="status"
          >
            <div className="flex items-center gap-2">
              <Trophy
                className="h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />

              <strong
                className={
                  'text-emerald-300 ' +
                  (compact ? 'text-xs' : 'text-sm')
                }
              >
                BINGO CONFIRMADO!
              </strong>
            </div>

            {!compact && (
              <ul className="mt-2 space-y-1">
                {analysis.wins.map((win) => (
                  <li
                    key={win.combination.id}
                    className="flex items-center gap-2 text-xs text-emerald-100"
                  >
                    <Check
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {win.combination.label}
                  </li>
                ))}
              </ul>
            )}

            {compact && (
              <p className="mt-1 text-[11px] text-emerald-200">
                {analysis.wins.length}
                {' '}
                {analysis.wins.length === 1
                  ? 'combinação'
                  : 'combinações'}
              </p>
            )}
          </div>
        )}

        {/* Quase bingo */}
        {hasAlmostBingo && (
          <div
            className={[
              'mt-3 rounded-xl border',
              'border-amber-500/40',
              'bg-amber-500/10',
              compact ? 'p-2' : 'p-3',
            ].join(' ')}
            role="status"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                className="h-4 w-4 shrink-0 text-amber-400"
                aria-hidden="true"
              />

              <strong
                className={
                  'text-amber-300 ' +
                  (compact ? 'text-xs' : 'text-sm')
                }
              >
                FALTA 1 NÚMERO!
              </strong>
            </div>

            <p
              className={
                'mt-2 font-bold text-white ' +
                (compact ? 'text-xs' : 'text-sm')
              }
            >
              {missingNumbers.join(', ')}
            </p>

            {!compact && (
              <ul className="mt-2 space-y-1">
                {almostWins.map((result) => (
                  <li
                    key={result.combination.id}
                    className="text-xs text-amber-100"
                  >
                    {result.combination.label}
                    {': '}
                    <strong>
                      {result.missingNumbers.join(', ')}
                    </strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Combinação mais próxima */}
        {!compact &&
          !hasWon &&
          !hasAlmostBingo &&
          closestCombination && (
            <div
              className={
                'mt-3 flex items-center ' +
                'justify-between gap-2 ' +
                'text-xs text-slate-400'
              }
            >
              <span className="truncate">
                Mais próxima:
                {' '}
                {closestCombination.combination.label}
              </span>

              <span className="shrink-0 font-semibold text-slate-200">
                Faltam
                {' '}
                {closestCombination.remainingCount}
              </span>
            </div>
          )}

        {/* Lista opcional de combinações */}
        {!compact &&
          analysis.combinations.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() =>
                  setShowAllCombinations((value) => !value)
                }
                className={
                  'flex w-full items-center ' +
                  'justify-between rounded-lg ' +
                  'px-2 py-2 text-xs ' +
                  'text-slate-400 hover:bg-slate-800'
                }
                aria-expanded={showAllCombinations}
              >
                <span>
                  Todas as combinações
                </span>

                {showAllCombinations ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showAllCombinations && (
                <ul className="mt-2 space-y-2">
                  {analysis.combinations.map(
                    (progress) => (
                      <li
                        key={progress.combination.id}
                        className={
                          'flex items-center ' +
                          'justify-between gap-2 ' +
                          'rounded-lg bg-slate-800/60 ' +
                          'px-3 py-2 text-xs'
                        }
                      >
                        <span className="text-slate-300">
                          {progress.combination.label}
                        </span>

                        <span
                          className={
                            progress.remainingCount === 0
                              ? 'font-bold text-emerald-400'
                              : progress.remainingCount === 1
                                ? 'font-bold text-amber-400'
                                : 'text-slate-400'
                          }
                        >
                          {progress.remainingCount === 0
                            ? 'Completa'
                            : `Faltam ${progress.remainingCount}`}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          )}
      </div>

      {/* Ações da cartela */}
      <footer
        className={[
          'flex items-center justify-end gap-1',
          'border-t border-slate-800',
          compact ? 'px-2 py-2' : 'px-3 py-2',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={handleExpand}
          className={
            'flex items-center gap-1.5 ' +
            'rounded-lg px-2 py-2 ' +
            'text-slate-300 transition-colors ' +
            'hover:bg-slate-800 hover:text-white'
          }
          aria-label={
            expanded
              ? `Reduzir cartela ${card.id}`
              : `Ampliar cartela ${card.id}`
          }
          title={expanded ? 'Reduzir' : 'Ampliar'}
        >
          {expanded ? (
            <X className="h-4 w-4" />
          ) : (
            <Expand className="h-4 w-4" />
          )}

          {!compact && (
            <span className="text-xs">
              {expanded ? 'Reduzir' : 'Ampliar'}
            </span>
          )}
        </button>

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(card)}
            className={
              'flex items-center gap-1.5 ' +
              'rounded-lg px-2 py-2 ' +
              'text-slate-300 transition-colors ' +
              'hover:bg-slate-800 hover:text-white'
            }
            aria-label={`Editar cartela ${card.id}`}
            title="Editar"
          >
            <Pencil className="h-4 w-4" />

            {!compact && (
              <span className="text-xs">
                Editar
              </span>
            )}
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() =>
              setShowDeleteConfirmation(true)
            }
            className={
              'flex items-center gap-1.5 ' +
              'rounded-lg px-2 py-2 ' +
              'text-rose-400 transition-colors ' +
              'hover:bg-rose-500/10'
            }
            aria-label={`Excluir cartela ${card.id}`}
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />

            {!compact && (
              <span className="text-xs">
                Excluir
              </span>
            )}
          </button>
        )}
      </footer>

      {/* Confirmação de exclusão */}
      {showDeleteConfirmation && (
        <div
          className={
            'border-t border-rose-500/30 ' +
            'bg-rose-950/30 p-3'
          }
          role="group"
          aria-label="Confirmar exclusão"
        >
          <p className="text-sm font-semibold text-white">
            Excluir a cartela {card.id}?
          </p>

          <p className="mt-1 text-xs text-slate-300">
            Esta ação removerá a cartela da partida.
            Os números já sorteados serão preservados.
          </p>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setShowDeleteConfirmation(false)
              }
              className={
                'rounded-lg border border-slate-600 ' +
                'px-3 py-2 text-xs font-semibold ' +
                'text-slate-200'
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className={
                'rounded-lg bg-rose-600 ' +
                'px-3 py-2 text-xs font-bold ' +
                'text-white hover:bg-rose-500'
              }
            >
              Confirmar exclusão
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default BingoCard;

