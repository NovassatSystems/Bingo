
import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  LayoutList,
  Moon,
  Settings2,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';

import {
  type BingoPattern,
  type BingoRules,
  type BingoSettings as BingoSettingsModel,
  type BingoSortMode,
  type BingoTheme,
  type BingoViewMode,
} from '../models/bingo';

import { useState } from 'react';

/**
 * Bingo Tracker
 * Painel de configurações.
 *
 * Todas as alterações são enviadas
 * ao hook principal por callbacks.
 */

export interface BingoSettingsProps {
  settings: BingoSettingsModel;

  onUpdateSettings: (
    settings: Partial<BingoSettingsModel>,
  ) => void;

  onUpdateRules: (
    rules: Partial<BingoRules>,
  ) => void;
}

interface RuleOption {
  key: BingoPattern;
  title: string;
  description: string;
  symbol: string;
}

const RULE_OPTIONS: RuleOption[] = [
  {
    key: 'horizontal',
    title: 'Linha horizontal',
    description:
      'Completar os 5 números de uma linha.',
    symbol: '━',
  },
  {
    key: 'vertical',
    title: 'Coluna vertical',
    description:
      'Completar os 5 espaços de uma coluna.',
    symbol: '┃',
  },
  {
    key: 'diagonal',
    title: 'Diagonal',
    description:
      'Completar uma das duas diagonais.',
    symbol: '╱',
  },
  {
    key: 'corners',
    title: 'Quatro cantos',
    description:
      'Completar as quatro extremidades.',
    symbol: '▣',
  },
  {
    key: 'full',
    title: 'Cartela cheia',
    description:
      'Completar todos os 24 números.',
    symbol: '▦',
  },
];

/**
 * Interruptor acessível reutilizável.
 */
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-7 w-12 shrink-0',
        'items-center rounded-full',
        'transition-colors duration-200',
        'focus-visible:outline-2',
        'focus-visible:outline-offset-2',
        'focus-visible:outline-emerald-400',
        'disabled:cursor-not-allowed',
        'disabled:opacity-40',
        checked
          ? 'bg-emerald-500'
          : 'bg-slate-600',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-5 w-5 items-center',
          'justify-center rounded-full',
          'bg-white shadow-sm',
          'transition-transform duration-200',
          checked
            ? 'translate-x-6'
            : 'translate-x-1',
        ].join(' ')}
      >
        {checked && (
          <Check
            className="h-3 w-3 text-emerald-700"
            aria-hidden="true"
          />
        )}
      </span>
    </button>
  );
}

/**
 * Botão de seleção visual.
 */
interface ChoiceButtonProps {
  selected: boolean;
  label: string;
  description?: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

function ChoiceButton({
  selected,
  label,
  description,
  onClick,
  icon,
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'flex min-w-0 flex-1 flex-col',
        'items-center justify-center gap-1.5',
        'rounded-xl border px-2 py-3',
        'text-center transition-colors',
        selected
          ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
          : 'border-slate-700 bg-slate-800 text-slate-300',
      ].join(' ')}
    >
      {icon && (
        <span aria-hidden="true">
          {icon}
        </span>
      )}

      <span className="text-sm font-semibold">
        {label}
      </span>

      {description && (
        <span className="text-[11px] text-slate-400">
          {description}
        </span>
      )}
    </button>
  );
}

export function BingoSettings({
  settings,
  onUpdateSettings,
  onUpdateRules,
}: BingoSettingsProps) {
  const [expanded, setExpanded] = useState(true);

  const enabledRules = RULE_OPTIONS.filter(
    (rule) => settings.rules[rule.key],
  );

  function toggleRule(
    key: BingoPattern,
    enabled: boolean,
  ) {
    onUpdateRules({
      [key]: enabled,
    });
  }

  function updateViewMode(
    viewMode: BingoViewMode,
  ) {
    onUpdateSettings({ viewMode });
  }

  function updateTheme(
    theme: BingoTheme,
  ) {
    onUpdateSettings({ theme });
  }

  function updateSortMode(
    sortMode: BingoSortMode,
  ) {
    onUpdateSettings({ sortMode });
  }

  return (
    <section
      className={
        'w-full overflow-hidden rounded-2xl ' +
        'border border-slate-700 ' +
        'bg-slate-900 text-white'
      }
      aria-label="Configurações do Bingo Tracker"
    >
      {/* Cabeçalho */}
      <button
        type="button"
        onClick={() =>
          setExpanded((current) => !current)
        }
        aria-expanded={expanded}
        className={
          'flex w-full items-center ' +
          'justify-between gap-3 px-4 py-4 ' +
          'text-left hover:bg-slate-800/60'
        }
      >
        <span className="flex items-center gap-3">
          <Settings2
            className="h-5 w-5 text-emerald-400"
            aria-hidden="true"
          />

          <span>
            <span className="block text-lg font-bold">
              Configurações
            </span>

            <span className="block text-xs text-slate-400">
              Regras e preferências
            </span>
          </span>
        </span>

        {expanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="space-y-6 border-t border-slate-800 p-4">
          {/* Regras */}
          <div>
            <div className="mb-3">
              <h3 className="text-base font-bold">
                Modalidades de vitória
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Ative somente as combinações
                que valem nesta partida.
              </p>
            </div>

            <div className="space-y-2">
              {RULE_OPTIONS.map((rule) => {
                const checked =
                  settings.rules[rule.key];

                return (
                  <div
                    key={rule.key}
                    className={[
                      'flex items-center gap-3',
                      'rounded-xl border p-3',
                      checked
                        ? 'border-emerald-700/50 bg-emerald-500/5'
                        : 'border-slate-700 bg-slate-800/50',
                    ].join(' ')}
                  >
                    <span
                      className={
                        'flex h-10 w-10 shrink-0 ' +
                        'items-center justify-center ' +
                        'rounded-lg bg-slate-800 ' +
                        'text-xl font-black text-emerald-400'
                      }
                      aria-hidden="true"
                    >
                      {rule.symbol}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {rule.title}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {rule.description}
                      </p>
                    </div>

                    <Toggle
                      checked={checked}
                      label={
                        `${checked ? 'Desativar' : 'Ativar'} ` +
                        rule.title
                      }
                      onChange={(enabled) =>
                        toggleRule(
                          rule.key,
                          enabled,
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>

            <div
              className={
                'mt-3 rounded-xl border ' +
                'border-slate-700 bg-slate-800/60 ' +
                'p-3'
              }
            >
              <p className="text-xs font-semibold text-slate-200">
                {enabledRules.length}
                {' '}
                {enabledRules.length === 1
                  ? 'modalidade ativa'
                  : 'modalidades ativas'}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {enabledRules.length > 0
                  ? enabledRules
                      .map((rule) => rule.title)
                      .join(' · ')
                  : 'Nenhuma modalidade ativa. Não haverá vencedores até ativar uma regra.'}
              </p>
            </div>
          </div>

          {/* Modo de visualização */}
          <div>
            <h3 className="mb-3 text-base font-bold">
              Visualização das cartelas
            </h3>

            <div className="flex gap-2">
              <ChoiceButton
                selected={
                  settings.viewMode === 'normal'
                }
                label="Normal"
                description="Uma abaixo da outra"
                icon={
                  <LayoutList className="h-6 w-6" />
                }
                onClick={() =>
                  updateViewMode('normal')
                }
              />

              <ChoiceButton
                selected={
                  settings.viewMode === 'compact'
                }
                label="Compacto"
                description="Duas por linha"
                icon={
                  <Grid2X2 className="h-6 w-6" />
                }
                onClick={() =>
                  updateViewMode('compact')
                }
              />
            </div>
          </div>

          {/* Ordenação */}
          <div>
            <label
              htmlFor="bingo-sort-mode"
              className="mb-2 block text-base font-bold"
            >
              Ordenação das cartelas
            </label>

            <select
              id="bingo-sort-mode"
              value={settings.sortMode}
              onChange={(event) =>
                updateSortMode(
                  event.target.value as BingoSortMode,
                )
              }
              className={
                'w-full rounded-xl border ' +
                'border-slate-600 bg-slate-800 ' +
                'px-3 py-3 text-sm text-white ' +
                'outline-none focus:border-emerald-400'
              }
            >
              <option value="registration">
                Ordem de cadastro
              </option>

              <option value="closest">
                Mais próximas do bingo
              </option>

              <option value="identifier">
                Identificador da cartela
              </option>
            </select>
          </div>

          {/* Tema */}
          <div>
            <h3 className="mb-3 text-base font-bold">
              Aparência
            </h3>

            <div className="flex gap-2">
              <ChoiceButton
                selected={
                  settings.theme === 'dark'
                }
                label="Escuro"
                icon={
                  <Moon className="h-6 w-6" />
                }
                onClick={() =>
                  updateTheme('dark')
                }
              />

              <ChoiceButton
                selected={
                  settings.theme === 'light'
                }
                label="Claro"
                icon={
                  <Sun className="h-6 w-6" />
                }
                onClick={() =>
                  updateTheme('light')
                }
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              A aparência será aplicada
              pela tela principal.
            </p>
          </div>

          {/* Som */}
          <div
            className={
              'flex items-center gap-3 rounded-xl ' +
              'border border-slate-700 ' +
              'bg-slate-800/50 p-3'
            }
          >
            <div
              className={
                'flex h-10 w-10 shrink-0 ' +
                'items-center justify-center ' +
                'rounded-lg bg-slate-800'
              }
            >
              {settings.soundEnabled ? (
                <Volume2
                  className="h-5 w-5 text-emerald-400"
                  aria-hidden="true"
                />
              ) : (
                <VolumeX
                  className="h-5 w-5 text-slate-400"
                  aria-hidden="true"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Alertas sonoros
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Ativar sons de aviso para
                eventos da partida.
              </p>
            </div>

            <Toggle
              checked={settings.soundEnabled}
              label="Alertas sonoros"
              onChange={(soundEnabled) =>
                onUpdateSettings({
                  soundEnabled,
                })
              }
            />
          </div>

          {/* Informação */}
          <div
            className={
              'flex items-start gap-2 rounded-xl ' +
              'border border-slate-700 ' +
              'bg-slate-800/40 p-3'
            }
          >
            <Bell
              className={
                'mt-0.5 h-4 w-4 shrink-0 ' +
                'text-emerald-400'
              }
              aria-hidden="true"
            />

            <p className="text-xs leading-relaxed text-slate-400">
              Alterar uma modalidade de vitória
              recalcula automaticamente todas
              as cartelas. Os números já
              sorteados permanecem registrados.
              O centro da cartela é sempre livre.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default BingoSettings;
