
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import {
  ArrowLeft,
  Delete,
  History,
  Keyboard,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';

import {
  BINGO_LETTERS,
  COLUMN_RANGES,
  type BingoLetter,
} from '../models/bingo';

/**
 * Bingo Tracker
 * Painel de entrada de números.
 *
 * O componente não modifica
 * diretamente a partida.
 *
 * Todas as ações são enviadas
 * ao hook principal por callbacks.
 */

export interface NumberInputProps {
  drawnNumbers: readonly number[];
  onRegister: (number: number) => boolean;
  onUndo: () => void;
  onRemove?: (number: number) => void;
  disabled?: boolean;
}

function getBingoLetter(
  number: number,
): BingoLetter | null {
  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 75
  ) {
    return null;
  }

  return (
    BINGO_LETTERS.find((letter) => {
      const range = COLUMN_RANGES[letter];

      return (
        number >= range.min &&
        number <= range.max
      );
    }) ?? null
  );
}

export function NumberInput({
  drawnNumbers,
  onRegister,
  onUndo,
  onRemove,
  disabled = false,
}: NumberInputProps) {
  const [value, setValue] = useState('');

  const [showKeypad, setShowKeypad] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [confirmRemove, setConfirmRemove] =
    useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const lastNumber =
    drawnNumbers.at(-1) ?? null;

  const parsedNumber =
    value.trim() === ''
      ? null
      : Number(value);

  const validNumber =
    parsedNumber !== null &&
    Number.isInteger(parsedNumber) &&
    parsedNumber >= 1 &&
    parsedNumber <= 75;

  const alreadyDrawn =
    validNumber &&
    drawnNumbers.includes(parsedNumber);

  const currentLetter =
    validNumber
      ? getBingoLetter(parsedNumber)
      : null;

  const canRegister =
    !disabled &&
    validNumber &&
    !alreadyDrawn;

  /**
   * Mantém a entrada restrita
   * a dois dígitos.
   */
  function handleValueChange(
    nextValue: string,
  ) {
    if (/^\d{0,2}$/.test(nextValue)) {
      setValue(nextValue);
    }
  }

  /**
   * Registra o número.
   *
   * A entrada só é limpa
   * quando o hook confirma
   * que aceitou o número.
   */
  function handleSubmit(
    event?: FormEvent<HTMLFormElement>,
  ) {
    event?.preventDefault();

    if (!canRegister || parsedNumber === null) {
      return;
    }

    const accepted = onRegister(parsedNumber);

    if (accepted) {
      setValue('');

      if (!showKeypad) {
        inputRef.current?.focus();
      }
    }
  }

  /**
   * Teclado numérico próprio.
   */
  function pressKey(key: string) {
    if (disabled) return;

    if (key === 'clear') {
      setValue('');
      return;
    }

    if (key === 'delete') {
      setValue((current) =>
        current.slice(0, -1),
      );
      return;
    }

    setValue((current) => {
      const next = current + key;

      return next.length <= 2
        ? next
        : current;
    });
  }

  /**
   * Cancela a confirmação de
   * remoção ao mudar o histórico.
   */
  useEffect(() => {
    setConfirmRemove(null);
  }, [drawnNumbers]);

  const reversedHistory = [
    ...drawnNumbers,
  ].reverse();

  return (
    <section
      className={
        'w-full rounded-2xl border ' +
        'border-slate-700 bg-slate-900 ' +
        'p-4 text-white shadow-lg'
      }
      aria-label="Painel de sorteio"
    >

      {/* Cabeçalho */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">
            Sorteio
          </h2>

          <p className="text-xs text-slate-400">
            {drawnNumbers.length} de 75 números
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowKeypad((current) => !current)
          }
          className={
            'flex items-center gap-2 rounded-lg ' +
            'border border-slate-700 ' +
            'px-3 py-2 text-xs text-slate-300 ' +
            'hover:bg-slate-800'
          }
          aria-pressed={showKeypad}
          aria-label={
            showKeypad
              ? 'Ocultar teclado numérico'
              : 'Mostrar teclado numérico'
          }
        >
          <Keyboard className="h-4 w-4" />
          {showKeypad ? 'Ocultar' : 'Teclado'}
        </button>
      </div>

      {/* Último número */}
      <div
        className={
          'mb-4 flex items-center justify-between ' +
          'rounded-xl bg-slate-800 p-3'
        }
      >
        <div>
          <p className="text-xs text-slate-400">
            Último sorteado
          </p>

          <p className="mt-1 text-2xl font-black text-emerald-400">
            {lastNumber === null
              ? '—'
              : `${getBingoLetter(lastNumber)}${lastNumber}`}
          </p>
        </div>

        <button
          type="button"
          onClick={onUndo}
          disabled={
            disabled ||
            drawnNumbers.length === 0
          }
          className={
            'flex items-center gap-2 rounded-lg ' +
            'border border-slate-600 ' +
            'px-3 py-2 text-sm font-semibold ' +
            'text-slate-200 ' +
            'hover:bg-slate-700 ' +
            'disabled:cursor-not-allowed ' +
            'disabled:opacity-40'
          }
        >
          <RotateCcw className="h-4 w-4" />
          Desfazer
        </button>
      </div>

      {/* Entrada numérica */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <label
          htmlFor="bingo-number-input"
          className="block text-sm font-semibold text-slate-300"
        >
          Número chamado
        </label>

        <div className="flex items-stretch gap-2">
          <div
            className={
              'flex w-14 shrink-0 items-center ' +
              'justify-center rounded-xl ' +
              'border border-slate-700 ' +
              'bg-slate-800 text-2xl font-black ' +
              'text-emerald-400'
            }
            aria-label="Coluna BINGO"
          >
            {currentLetter ?? '—'}
          </div>

          <input
            ref={inputRef}
            id="bingo-number-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={2}
            value={value}
            onChange={(event) =>
              handleValueChange(
                event.target.value,
              )
            }
            disabled={disabled}
            placeholder="1–75"
            className={
              'min-w-0 flex-1 rounded-xl ' +
              'border border-slate-600 ' +
              'bg-slate-950 px-4 py-3 ' +
              'text-center text-2xl font-bold ' +
              'tabular-nums text-white ' +
              'outline-none focus:border-emerald-400 ' +
              'disabled:opacity-50'
            }
          />

          <button
            type="submit"
            disabled={!canRegister}
            className={
              'flex shrink-0 items-center ' +
              'justify-center gap-2 rounded-xl ' +
              'bg-emerald-600 px-4 ' +
              'font-bold text-white ' +
              'hover:bg-emerald-500 ' +
              'disabled:cursor-not-allowed ' +
              'disabled:bg-slate-700 ' +
              'disabled:text-slate-400'
            }
            aria-label="Registrar número"
          >
            <Send className="h-5 w-5" />
            <span className="hidden sm:inline">
              Registrar
            </span>
          </button>
        </div>

        {/* Validação imediata */}
        <div
          className="min-h-5 text-xs"
          aria-live="polite"
        >
          {alreadyDrawn ? (
            <p className="text-amber-400">
              Este número já foi sorteado.
            </p>
          ) : value && !validNumber ? (
            <p className="text-rose-400">
              Informe um número de 1 a 75.
            </p>
          ) : validNumber ? (
            <p className="text-emerald-400">
              {currentLetter}
              {parsedNumber}
              {' '}
              pronto para registrar.
            </p>
          ) : (
            <p className="text-slate-500">
              Digite o número anunciado.
            </p>
          )}
        </div>
      </form>

      {/* Teclado numérico opcional */}
      {showKeypad && (
        <div
          className="mt-4 grid grid-cols-3 gap-2"
          aria-label="Teclado numérico"
        >
          {[
            '1', '2', '3',
            '4', '5', '6',
            '7', '8', '9',
            'clear', '0', 'delete',
          ].map((key) => (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => pressKey(key)}
              className={
                'flex min-h-12 items-center ' +
                'justify-center rounded-xl ' +
                'border border-slate-700 ' +
                'bg-slate-800 text-lg font-bold ' +
                'text-white active:bg-slate-700 ' +
                'disabled:opacity-40'
              }
              aria-label={
                key === 'clear'
                  ? 'Limpar entrada'
                  : key === 'delete'
                    ? 'Apagar último dígito'
                    : `Digitar ${key}`
              }
            >
              {key === 'clear' ? (
                <X className="h-5 w-5" />
              ) : key === 'delete' ? (
                <Delete className="h-5 w-5" />
              ) : (
                key
              )}
            </button>
          ))}

          <button
            type="button"
            disabled={!canRegister}
            onClick={() => handleSubmit()}
            className={
              'col-span-3 flex min-h-12 ' +
              'items-center justify-center gap-2 ' +
              'rounded-xl bg-emerald-600 ' +
              'font-bold text-white ' +
              'disabled:bg-slate-700 ' +
              'disabled:text-slate-400'
            }
          >
            <Send className="h-4 w-4" />
            Registrar número
          </button>
        </div>
      )}

      {/* Histórico */}
      <div className="mt-4 border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={() =>
            setShowHistory((current) => !current)
          }
          className={
            'flex w-full items-center ' +
            'justify-between rounded-lg ' +
            'px-2 py-2 text-sm ' +
            'text-slate-300 hover:bg-slate-800'
          }
          aria-expanded={showHistory}
        >
          <span className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de sorteios
          </span>

          <span className="text-xs text-slate-400">
            {showHistory ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {showHistory && (
          <div className="mt-3">
            {reversedHistory.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-500">
                Nenhum número sorteado.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {reversedHistory.map((number) => {
                  const letter =
                    getBingoLetter(number);

                  return (
                    <button
                      key={number}
                      type="button"
                      disabled={!onRemove || disabled}
                      onClick={() =>
                        setConfirmRemove(number)
                      }
                      className={
                        'rounded-lg border ' +
                        'border-emerald-700/60 ' +
                        'bg-emerald-900/30 ' +
                        'px-3 py-2 text-sm ' +
                        'font-bold text-emerald-300 ' +
                        'disabled:cursor-default'
                      }
                      title={
                        onRemove
                          ? 'Toque para remover'
                          : 'Número sorteado'
                      }
                    >
                      {letter}{number}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmação de remoção */}
      {confirmRemove !== null && (
        <div
          className={
            'mt-4 rounded-xl border ' +
            'border-rose-500/40 ' +
            'bg-rose-950/30 p-3'
          }
          role="group"
          aria-label="Confirmar remoção de sorteio"
        >
          <p className="text-sm font-semibold">
            Remover
            {' '}
            {getBingoLetter(confirmRemove)}
            {confirmRemove}
            {' '}
            do histórico?
          </p>

          <p className="mt-1 text-xs text-slate-300">
            As marcações e vitórias serão
            recalculadas automaticamente.
          </p>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setConfirmRemove(null)
              }
              className={
                'rounded-lg border border-slate-600 ' +
                'px-3 py-2 text-xs font-semibold'
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => {
                if (onRemove) {
                  onRemove(confirmRemove);
                }

                setConfirmRemove(null);
              }}
              className={
                'flex items-center gap-1.5 ' +
                'rounded-lg bg-rose-600 ' +
                'px-3 py-2 text-xs font-bold ' +
                'text-white hover:bg-rose-500'
              }
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Remover
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default NumberInput;
