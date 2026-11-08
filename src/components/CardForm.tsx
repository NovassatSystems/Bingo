
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  Grid3X3,
  Save,
  X,
} from 'lucide-react';

import {
  BINGO_LETTERS,
  COLUMN_RANGES,
  FREE_COLUMN,
  FREE_ROW,
  GRID_SIZE,
  type BingoCard,
  type BingoGrid,
  type BingoLetter,
} from '../models/bingo';

import {
  createEmptyGrid,
  normalizeSequence,
  parseBingoSequence,
  cardToSequence,
} from '../features/bingo/parser';

import {
  validateCard,
} from '../features/bingo/engine';

/**
 * Bingo Tracker
 * Formulário de cadastro e edição.
 */

export interface CardFormProps {
  card?: BingoCard | null;
  existingIds?: readonly string[];
  onSave: (card: BingoCard) => boolean | void;
  onCancel: () => void;
}

type InputMode = 'sequence' | 'manual';

function cloneGrid(grid: BingoGrid): BingoGrid {
  return grid.map((row) =>
    row.map((cell) => ({ ...cell })),
  );
}

function createDraftGrid(
  card?: BingoCard | null,
): BingoGrid {
  return card
    ? cloneGrid(card.grid)
    : createEmptyGrid();
}

export function CardForm({
  card,
  existingIds = [],
  onSave,
  onCancel,
}: CardFormProps) {
  const editing = Boolean(card);

  const [id, setId] = useState(
    card?.id ?? '',
  );

  const [name, setName] = useState(
    card?.name ?? '',
  );

  const [mode, setMode] = useState<InputMode>(
    'sequence',
  );

  const [sequence, setSequence] = useState(
    card ? cardToSequence(card) : '',
  );

  const [grid, setGrid] = useState<BingoGrid>(
    () => createDraftGrid(card),
  );

  const [errors, setErrors] = useState<string[]>(
    [],
  );

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  /**
   * Reinicializa o formulário
   * quando outra cartela é escolhida.
   */
  useEffect(() => {
    setId(card?.id ?? '');
    setName(card?.name ?? '');
    setSequence(
      card ? cardToSequence(card) : '',
    );
    setGrid(createDraftGrid(card));
    setErrors([]);
    setSuccessMessage(null);
  }, [card]);

  /**
   * Analisa a sequência sem modificar
   * o estado principal da cartela.
   */
  const sequenceResult = useMemo(
    () => parseBingoSequence(sequence),
    [sequence],
  );

  /**
   * A prévia usa a sequência válida
   * ou a grade preenchida manualmente.
   */
  const previewGrid =
    mode === 'sequence'
      ? sequenceResult.grid
      : grid;

  const filledNumbers = previewGrid
    ? previewGrid
        .flat()
        .filter(
          (cell) =>
            !cell.isFree &&
            cell.value !== null,
        ).length
    : 0;

  /**
   * Altera uma célula da grade manual.
   *
   * Cada coluna aceita somente
   * números de seu intervalo.
   */
  function updateCell(
    row: number,
    column: number,
    rawValue: string,
  ) {
    if (
      row === FREE_ROW &&
      column === FREE_COLUMN
    ) {
      return;
    }

    if (!/^\d{0,2}$/.test(rawValue)) {
      return;
    }

    const nextValue =
      rawValue === ''
        ? null
        : Number(rawValue);

    setGrid((current) => {
      const next = cloneGrid(current);
      const cell = next[row]?.[column];

      if (cell) {
        cell.value = nextValue;
      }

      return next;
    });

    setErrors([]);
    setSuccessMessage(null);
  }

  /**
   * Converte a sequência válida
   * para a grade de edição manual.
   */
  function switchToManual() {
    if (mode === 'sequence' && sequenceResult.grid) {
      setGrid(cloneGrid(sequenceResult.grid));
    }

    setMode('manual');
    setErrors([]);
  }

  /**
   * Converte a grade manual válida
   * para uma sequência copiável.
   */
  function switchToSequence() {
    const temporaryCard: BingoCard = {
      id: id.trim() || 'preview',
      name: name.trim() || 'Prévia',
      grid,
      createdAt:
        card?.createdAt ??
        new Date().toISOString(),
    };

    const validation = validateCard(temporaryCard);

    if (validation.valid) {
      setSequence(
        cardToSequence(temporaryCard),
      );
    }

    setMode('sequence');
    setErrors([]);
  }

  /**
   * Valida e envia a cartela.
   */
  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const nextErrors: string[] = [];

    const cardId = id.trim();

    if (!cardId) {
      nextErrors.push(
        'Informe o identificador da cartela.',
      );
    }

    if (
      existingIds.some(
        (existing) =>
          existing === cardId &&
          existing !== card?.id,
      )
    ) {
      nextErrors.push(
        `A cartela ${cardId} já está cadastrada.`,
      );
    }

    let finalGrid: BingoGrid | null = null;

    if (mode === 'sequence') {
      const result = parseBingoSequence(sequence);

      if (!result.validation.valid) {
        nextErrors.push(
          ...result.validation.errors,
        );
      } else {
        finalGrid = result.grid;
      }
    } else {
      finalGrid = cloneGrid(grid);
    }

    if (finalGrid) {
      const temporaryCard: BingoCard = {
        id: cardId,
        name:
          name.trim() ||
          `Cartela ${cardId}`,
        grid: finalGrid,
        createdAt:
          card?.createdAt ??
          new Date().toISOString(),
      };

      const validation = validateCard(
        temporaryCard,
      );

      if (!validation.valid) {
        nextErrors.push(
          ...validation.errors,
        );
      }

      if (nextErrors.length === 0) {
        try {
          const accepted = onSave(
            temporaryCard,
          );

          if (accepted === false) {
            setErrors([
              'Não foi possível salvar a cartela.',
            ]);
            return;
          }

          setErrors([]);
          setSuccessMessage(
            editing
              ? 'Cartela atualizada.'
              : 'Cartela cadastrada.',
          );

          return;
        } catch (error) {
          setErrors([
            error instanceof Error
              ? error.message
              : 'Erro ao salvar cartela.',
          ]);

          return;
        }
      }
    }

    setSuccessMessage(null);
    setErrors([...new Set(nextErrors)]);
  }

  const inputClasses =
    'w-full rounded-xl border border-slate-600 ' +
    'bg-slate-950 px-3 py-3 text-white ' +
    'outline-none focus:border-emerald-400';

  return (
    <form
      onSubmit={handleSubmit}
      className={
        'w-full space-y-5 rounded-2xl ' +
        'border border-slate-700 ' +
        'bg-slate-900 p-4 text-white'
      }
      aria-label={
        editing
          ? 'Editar cartela'
          : 'Cadastrar cartela'
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">
            {editing
              ? 'Editar cartela'
              : 'Nova cartela'}
          </h2>

          <p className="text-xs text-slate-400">
            Bingo tradicional de 75 números
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className={
            'rounded-lg p-2 text-slate-400 ' +
            'hover:bg-slate-800 hover:text-white'
          }
          aria-label="Fechar formulário"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Identificador */}
      <div>
        <label
          htmlFor="card-id"
          className="mb-2 block text-sm font-semibold"
        >
          Identificador da cartela *
        </label>

        <input
          id="card-id"
          value={id}
          onChange={(event) => {
            setId(event.target.value);
            setErrors([]);
          }}
          disabled={editing}
          maxLength={50}
          placeholder="Ex.: 1942"
          className={
            inputClasses +
            ' disabled:cursor-not-allowed ' +
            'disabled:opacity-60'
          }
        />
      </div>

      {/* Nome opcional */}
      <div>
        <label
          htmlFor="card-name"
          className="mb-2 block text-sm font-semibold"
        >
          Nome da cartela (opcional)
        </label>

        <input
          id="card-name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          maxLength={80}
          placeholder="Ex.: Cartela da mesa 2"
          className={inputClasses}
        />
      </div>

      {/* Seleção do método */}
      <div>
        <p className="mb-2 text-sm font-semibold">
          Como deseja preencher?
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={switchToSequence}
            className={[
              'flex items-center justify-center gap-2',
              'rounded-xl border px-3 py-3',
              'text-sm font-semibold',
              mode === 'sequence'
                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-300',
            ].join(' ')}
            aria-pressed={mode === 'sequence'}
          >
            <ClipboardPaste className="h-4 w-4" />
            Sequência
          </button>

          <button
            type="button"
            onClick={switchToManual}
            className={[
              'flex items-center justify-center gap-2',
              'rounded-xl border px-3 py-3',
              'text-sm font-semibold',
              mode === 'manual'
                ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-300',
            ].join(' ')}
            aria-pressed={mode === 'manual'}
          >
            <Grid3X3 className="h-4 w-4" />
            Manual
          </button>
        </div>
      </div>

      {/* Importação por sequência */}
      {mode === 'sequence' && (
        <div>
          <label
            htmlFor="card-sequence"
            className="mb-2 block text-sm font-semibold"
          >
            Sequência dos 24 números
          </label>

          <textarea
            id="card-sequence"
            value={sequence}
            onChange={(event) => {
              setSequence(event.target.value);
              setErrors([]);
            }}
            rows={5}
            spellCheck={false}
            autoCapitalize="characters"
            placeholder={
              'B6;B10;B3;B14;B11;I22;I17;...'
            }
            className={
              inputClasses +
              ' resize-y font-mono text-sm'
            }
          />

          <p className="mt-2 text-xs text-slate-400">
            Ordem: 5 números B, 5 I,
            4 N, 5 G e 5 O.
            Separe por ponto e vírgula.
            O centro é livre.
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {normalizeSequence(sequence)
              ? sequenceResult.validation.valid
                ? 'Sequência válida.'
                : 'Sequência ainda incompleta ou inválida.'
              : 'Cole aqui a sequência da cartela.'}
          </p>
        </div>
      )}

      {/* Preenchimento manual */}
      {mode === 'manual' && (
        <div>
          <p className="mb-3 text-sm font-semibold">
            Preencha os números
          </p>

          <div className="grid grid-cols-5 gap-1.5">
            {BINGO_LETTERS.map((letter) => (
              <div
                key={letter}
                className={
                  'py-1 text-center text-lg ' +
                  'font-black text-emerald-400'
                }
              >
                {letter}
              </div>
            ))}

            {Array.from(
              { length: GRID_SIZE },
              (_, row) =>
                Array.from(
                  { length: GRID_SIZE },
                  (_, column) => {
                    const isFree =
                      row === FREE_ROW &&
                      column === FREE_COLUMN;

                    const letter =
                      BINGO_LETTERS[column] as BingoLetter;

                    const range =
                      COLUMN_RANGES[letter];

                    const cell =
                      grid[row]?.[column];

                    if (isFree) {
                      return (
                        <div
                          key={`${row}-${column}`}
                          className={
                            'flex aspect-square items-center ' +
                            'justify-center rounded-lg ' +
                            'bg-emerald-900/60 ' +
                            'text-xs font-bold text-emerald-300'
                          }
                        >
                          LIVRE
                        </div>
                      );
                    }

                    return (
                      <input
                        key={`${row}-${column}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={cell?.value ?? ''}
                        onChange={(event) =>
                          updateCell(
                            row,
                            column,
                            event.target.value,
                          )
                        }
                        aria-label={
                          `${letter}, linha ${row + 1}, ` +
                          `número entre ${range.min} e ${range.max}`
                        }
                        className={
                          'aspect-square w-full min-w-0 ' +
                          'rounded-lg border border-slate-600 ' +
                          'bg-slate-800 text-center ' +
                          'text-sm font-bold text-white ' +
                          'outline-none focus:border-emerald-400'
                        }
                      />
                    );
                  },
                ),
            )}
          </div>
        </div>
      )}

      {/* Prévia */}
      <div
        className={
          'rounded-xl border border-slate-700 ' +
          'bg-slate-950 p-3'
        }
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">
            Prévia da cartela
          </h3>

          <span className="text-xs text-slate-400">
            {filledNumbers}/24
          </span>
        </div>

        {previewGrid ? (
          <div className="grid grid-cols-5 gap-1">
            {BINGO_LETTERS.map((letter) => (
              <div
                key={letter}
                className={
                  'text-center text-sm ' +
                  'font-black text-emerald-400'
                }
              >
                {letter}
              </div>
            ))}

            {previewGrid.flatMap((row) =>
              row.map((cell) => (
                <div
                  key={`${cell.row}-${cell.column}`}
                  className={[
                    'flex aspect-square items-center',
                    'justify-center rounded-md',
                    'text-sm font-bold',
                    cell.isFree
                      ? 'bg-emerald-900 text-emerald-300'
                      : cell.value === null
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-slate-800 text-white',
                  ].join(' ')}
                >
                  {cell.isFree
                    ? '★'
                    : cell.value ?? '—'}
                </div>
              )),
            )}
          </div>
        ) : (
          <p className="py-5 text-center text-xs text-slate-400">
            A prévia aparecerá quando a
            sequência estiver válida.
          </p>
        )}
      </div>

      {/* Erros */}
      {errors.length > 0 && (
        <div
          className={
            'rounded-xl border border-rose-500/40 ' +
            'bg-rose-500/10 p-3'
          }
          role="alert"
        >
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400" />

            <strong className="text-sm text-rose-300">
              Verifique a cartela
            </strong>
          </div>

          <ul className="list-disc space-y-1 pl-5 text-xs text-rose-200">
            {errors.map((error, index) => (
              <li key={`${index}-${error}`}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sucesso */}
      {successMessage && (
        <div
          className={
            'flex items-center gap-2 rounded-xl ' +
            'border border-emerald-500/40 ' +
            'bg-emerald-500/10 p-3 ' +
            'text-sm text-emerald-300'
          }
          role="status"
        >
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={
            'rounded-xl border border-slate-600 ' +
            'px-4 py-3 text-sm font-semibold ' +
            'text-slate-200 hover:bg-slate-800'
          }
        >
          Cancelar
        </button>

        <button
          type="submit"
          className={
            'flex items-center gap-2 rounded-xl ' +
            'bg-emerald-600 px-4 py-3 ' +
            'text-sm font-bold text-white ' +
            'hover:bg-emerald-500'
          }
        >
          <Save className="h-4 w-4" />
          {editing
            ? 'Salvar alterações'
            : 'Adicionar cartela'}
        </button>
      </div>
    </form>
  );
}

export default CardForm;
