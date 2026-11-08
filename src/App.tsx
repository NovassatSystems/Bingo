
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Menu,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Trophy,
  Upload,
  X,
} from 'lucide-react';

import { useBingoGame } from './hooks/useBingoGame';

import { BingoCard } from './components/BingoCard';
import { NumberInput } from './components/NumberInput';
import { CardForm } from './components/CardForm';
import { BingoSettings } from './components/BingoSettings';

import type { BingoCard as BingoCardModel } from './models/bingo';

/**
 * Bingo Tracker
 * Tela principal.
 */

type ActivePanel = 'none' | 'card' | 'settings';

export default function App() {
  const {
    game,
    settings,
    cards,
    drawnNumbers,
    round,
    analysis,
    sortedCards,
    totalWinners,
    totalAlmostWins,
    registerNumber,
    undo,
    removeNumber,
    newRound,
    registerCard,
    editCard,
    removeCard,
    updateSettings,
    updateRules,
    exportBackup,
    importBackup,
    error,
    notice,
    clearMessages,
  } = useBingoGame();

  const [activePanel, setActivePanel] =
    useState<ActivePanel>('none');

  const [editingCard, setEditingCard] =
    useState<BingoCardModel | null>(null);

  const [showNewRoundConfirmation, setShowNewRoundConfirmation] =
    useState(false);

  const [showMenu, setShowMenu] =
    useState(false);

  const [importing, setImporting] =
    useState(false);

  const backupInputRef =
    useRef<HTMLInputElement>(null);

  const panelRef =
    useRef<HTMLDivElement>(null);

  const darkMode = settings.theme === 'dark';

  /**
   * O tema é aplicado na raiz
   * para permitir classes dark:
   * em componentes futuros.
   */
  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      darkMode,
    );

    document.documentElement.style.colorScheme =
      darkMode ? 'dark' : 'light';

    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = '';
    };
  }, [darkMode]);

  /**
   * Abre um painel e posiciona
   * a tela no formulário.
   */
  function openPanel(panel: ActivePanel) {
    clearMessages();
    setShowMenu(false);
    setActivePanel(panel);

    if (panel !== 'card') {
      setEditingCard(null);
    }

    if (panel !== 'none') {
      window.requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  }

  function openNewCard() {
    setEditingCard(null);
    openPanel('card');
  }

  function openEditCard(card: BingoCardModel) {
    setEditingCard(card);
    openPanel('card');
  }

  function closePanel() {
    setActivePanel('none');
    setEditingCard(null);
  }

  /**
   * Salva uma cartela nova
   * ou atualiza uma existente.
   */
  function handleSaveCard(
    card: BingoCardModel,
  ): boolean {
    const accepted = editingCard
      ? editCard(card)
      : registerCard(card);

    if (accepted !== false) {
      closePanel();
      return true;
    }

    return false;
  }

  /**
   * Importação de backup JSON.
   */
  async function handleBackupFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImporting(true);
    clearMessages();

    try {
      const accepted = await importBackup(file);

      if (accepted) {
        closePanel();
      }
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  }

  function handleNewRound() {
    newRound();
    setShowNewRoundConfirmation(false);
    setShowMenu(false);
  }

  const cardAnalyses = new Map(
    analysis.cards.map((item) => [
      item.cardId,
      item,
    ]),
  );

  const gridClasses =
    settings.viewMode === 'compact'
      ? 'grid grid-cols-2 gap-2 sm:gap-3'
      : 'grid grid-cols-1 gap-4';

  const pageClasses = darkMode
    ? 'bg-slate-950 text-white'
    : 'bg-slate-100 text-slate-900';

  return (
    <div
      className={
        'min-h-screen w-full ' +
        pageClasses
      }
    >

      {/* Cabeçalho principal */}
      <header
        className={
          'sticky top-0 z-30 border-b ' +
          'border-slate-700 bg-slate-900/95 ' +
          'text-white backdrop-blur'
        }
      >
        <div
          className={
            'mx-auto flex max-w-5xl ' +
            'items-center justify-between ' +
            'gap-3 px-4 py-3'
          }
        >
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={
                'flex h-10 w-10 shrink-0 ' +
                'items-center justify-center ' +
                'rounded-xl bg-emerald-500/15'
              }
            >
              <span className="text-xl font-black text-emerald-400">
                B
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-black">
                Bingo Tracker
              </h1>

              <p className="text-xs text-slate-400">
                Rodada {round}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openNewCard}
              className={
                'flex items-center gap-1.5 ' +
                'rounded-xl bg-emerald-600 ' +
                'px-3 py-2 text-sm font-bold ' +
                'text-white hover:bg-emerald-500'
              }
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">
                Cartela
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                openPanel(
                  activePanel === 'settings'
                    ? 'none'
                    : 'settings',
                )
              }
              className={
                'rounded-xl border border-slate-700 ' +
                'p-2 text-slate-300 ' +
                'hover:bg-slate-800'
              }
              aria-label="Configurações"
            >
              <Settings2 className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() =>
                setShowMenu((value) => !value)
              }
              className={
                'rounded-xl border border-slate-700 ' +
                'p-2 text-slate-300 ' +
                'hover:bg-slate-800'
              }
              aria-label="Menu"
              aria-expanded={showMenu}
            >
              {showMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {showMenu && (
          <div
            className={
              'mx-auto max-w-5xl space-y-2 ' +
              'border-t border-slate-800 ' +
              'px-4 py-3'
            }
          >
            <button
              type="button"
              onClick={() => {
                exportBackup();
                setShowMenu(false);
              }}
              className={
                'flex w-full items-center gap-2 ' +
                'rounded-lg px-3 py-2 ' +
                'text-left text-sm hover:bg-slate-800'
              }
            >
              <Download className="h-4 w-4" />
              Exportar backup
            </button>

            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                backupInputRef.current?.click();
              }}
              className={
                'flex w-full items-center gap-2 ' +
                'rounded-lg px-3 py-2 ' +
                'text-left text-sm hover:bg-slate-800'
              }
            >
              <Upload className="h-4 w-4" />
              Importar backup
            </button>

            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowNewRoundConfirmation(true);
              }}
              className={
                'flex w-full items-center gap-2 ' +
                'rounded-lg px-3 py-2 ' +
                'text-left text-sm text-amber-300 ' +
                'hover:bg-slate-800'
              }
            >
              <RotateCcw className="h-4 w-4" />
              Nova rodada
            </button>
          </div>
        )}
      </header>

      <input
        ref={backupInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleBackupFile}
        aria-label="Selecionar backup JSON"
      />

      <main
        className={
          'mx-auto flex max-w-5xl ' +
          'flex-col gap-5 px-3 py-5 sm:px-4'
        }
      >
        {/* Resumo da partida */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div
            className={
              'rounded-xl border border-slate-700 ' +
              'bg-slate-900 p-3 text-white'
            }
          >
            <p className="text-xs text-slate-400">
              Cartelas
            </p>

            <p className="mt-1 text-2xl font-black">
              {cards.length}
            </p>
          </div>

          <div
            className={
              'rounded-xl border border-slate-700 ' +
              'bg-slate-900 p-3 text-white'
            }
          >
            <p className="text-xs text-slate-400">
              Sorteados
            </p>

            <p className="mt-1 text-2xl font-black">
              {drawnNumbers.length}
            </p>
          </div>

          <div
            className={
              'rounded-xl border border-emerald-700/50 ' +
              'bg-slate-900 p-3 text-white'
            }
          >
            <p className="text-xs text-slate-400">
              Vencedoras
            </p>

            <p className="mt-1 text-2xl font-black text-emerald-400">
              {totalWinners}
            </p>
          </div>
        </div>

        {/* Mensagens do sistema */}
        {error && (
          <div
            className={
              'flex items-start gap-2 rounded-xl ' +
              'border border-rose-500/40 ' +
              'bg-rose-500/10 p-3 ' +
              'text-sm text-rose-400'
            }
            role="alert"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={clearMessages}
              aria-label="Fechar erro"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {notice && (
          <div
            className={
              'flex items-start gap-2 rounded-xl ' +
              'border border-emerald-500/40 ' +
              'bg-emerald-500/10 p-3 ' +
              'text-sm text-emerald-400'
            }
            role="status"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="flex-1">{notice}</span>

            <button
              type="button"
              onClick={clearMessages}
              aria-label="Fechar mensagem"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {importing && (
          <p className="text-center text-sm text-slate-400">
            Importando backup...
          </p>
        )}

        {/* Painéis de cadastro e configuração */}
        <div ref={panelRef} className="scroll-mt-24">
          {activePanel === 'card' && (
            <CardForm
              key={editingCard?.id ?? 'new-card'}
              card={editingCard}
              existingIds={cards.map((card) => card.id)}
              onSave={handleSaveCard}
              onCancel={closePanel}
            />
          )}

          {activePanel === 'settings' && (
            <BingoSettings
              settings={settings}
              onUpdateSettings={updateSettings}
              onUpdateRules={updateRules}
            />
          )}
        </div>

        {/* Painel de sorteio */}
        <NumberInput
          drawnNumbers={drawnNumbers}
          onRegister={registerNumber}
          onUndo={undo}
          onRemove={removeNumber}
        />

        {/* Alertas gerais */}
        {totalWinners > 0 && (
          <div
            className={
              'flex items-start gap-3 rounded-xl ' +
              'border border-emerald-400/50 ' +
              'bg-emerald-500/10 p-4'
            }
            role="status"
          >
            <Trophy
              className="h-6 w-6 shrink-0 text-emerald-400"
              aria-hidden="true"
            />

            <div>
              <p className="font-black text-emerald-400">
                BINGO!
              </p>

              <p className="mt-1 text-sm text-emerald-300">
                {totalWinners}
                {' '}
                {totalWinners === 1
                  ? 'cartela vencedora'
                  : 'cartelas vencedoras'}
                {' '}
                nesta rodada.
              </p>
            </div>
          </div>
        )}

        {totalAlmostWins > 0 && (
          <div
            className={
              'flex items-start gap-3 rounded-xl ' +
              'border border-amber-500/40 ' +
              'bg-amber-500/10 p-4'
            }
          >
            <AlertTriangle
              className="h-5 w-5 shrink-0 text-amber-400"
              aria-hidden="true"
            />

            <div>
              <p className="font-bold text-amber-300">
                Atenção: quase bingo!
              </p>

              <p className="mt-1 text-sm text-amber-200">
                Existem combinações a apenas
                um número da vitória.
              </p>
            </div>
          </div>
        )}

        {/* Lista de cartelas */}
        <section
          className="space-y-3"
          aria-label="Cartelas cadastradas"
        >
          <div
            className={
              'flex flex-wrap items-center ' +
              'justify-between gap-2'
            }
          >
            <div>
              <h2 className="text-xl font-black">
                Minhas cartelas
              </h2>

              <p className="text-xs opacity-70">
                {settings.viewMode === 'compact'
                  ? 'Visualização compacta'
                  : 'Visualização normal'}
              </p>
            </div>

            <button
              type="button"
              onClick={openNewCard}
              className={
                'flex items-center gap-2 ' +
                'rounded-xl border ' +
                'border-emerald-500/50 ' +
                'px-3 py-2 text-sm font-semibold ' +
                'text-emerald-400 ' +
                'hover:bg-emerald-500/10'
              }
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>

          {sortedCards.length === 0 ? (
            <div
              className={
                'rounded-2xl border border-dashed ' +
                'border-slate-600 bg-slate-900 ' +
                'px-4 py-12 text-center'
              }
            >
              <ShieldCheck
                className={
                  'mx-auto mb-3 h-10 w-10 ' +
                  'text-emerald-400'
                }
              />

              <h3 className="font-bold text-white">
                Nenhuma cartela cadastrada
              </h3>

              <p
                className={
                  'mx-auto mt-2 max-w-sm ' +
                  'text-sm text-slate-400'
                }
              >
                Adicione uma cartela informando
                seus números manualmente ou
                colando a sequência B-I-N-G-O.
              </p>

              <button
                type="button"
                onClick={openNewCard}
                className={
                  'mt-5 rounded-xl bg-emerald-600 ' +
                  'px-5 py-3 text-sm font-bold ' +
                  'text-white hover:bg-emerald-500'
                }
              >
                Adicionar primeira cartela
              </button>
            </div>
          ) : (
            <div className={gridClasses}>
              {sortedCards.map((card) => {
                const cardAnalysis =
                  cardAnalyses.get(card.id);

                if (!cardAnalysis) {
                  return null;
                }

                return (
                  <BingoCard
                    key={card.id}
                    card={card}
                    analysis={cardAnalysis}
                    drawnNumbers={drawnNumbers}
                    viewMode={settings.viewMode}
                    onEdit={openEditCard}
                    onDelete={removeCard}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Rodada */}
        <div
          className={
            'flex flex-col items-center gap-2 ' +
            'border-t border-slate-700 ' +
            'py-5 text-center'
          }
        >
          <p className="text-xs opacity-60">
            Rodada {round} · Bingo de 75 números
          </p>

          <button
            type="button"
            onClick={() =>
              setShowNewRoundConfirmation(true)
            }
            className={
              'flex items-center gap-2 rounded-xl ' +
              'border border-amber-500/50 ' +
              'px-4 py-3 text-sm font-semibold ' +
              'text-amber-400 ' +
              'hover:bg-amber-500/10'
            }
          >
            <RotateCcw className="h-4 w-4" />
            Iniciar nova rodada
          </button>

          <p className="text-xs opacity-60">
            As cartelas serão preservadas.
          </p>
        </div>
      </main>

      {/* Confirmação de nova rodada */}
      {showNewRoundConfirmation && (
        <div
          className={
            'fixed inset-0 z-50 flex items-center ' +
            'justify-center bg-black/75 p-4'
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-round-title"
            className={
              'w-full max-w-md rounded-2xl ' +
              'border border-slate-700 ' +
              'bg-slate-900 p-5 text-white shadow-2xl'
            }
          >
            <div className="flex items-center gap-3">
              <RotateCcw
                className="h-6 w-6 text-amber-400"
                aria-hidden="true"
              />

              <h2
                id="new-round-title"
                className="text-lg font-black"
              >
                Iniciar nova rodada?
              </h2>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Todos os números sorteados serão
              zerados e as marcações serão
              recalculadas.
            </p>

            <p className="mt-2 text-sm font-semibold text-emerald-400">
              Suas {cards.length} cartelas
              serão preservadas.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowNewRoundConfirmation(false)
                }
                className={
                  'rounded-xl border border-slate-600 ' +
                  'px-4 py-3 text-sm font-semibold'
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleNewRound}
                className={
                  'rounded-xl bg-amber-500 ' +
                  'px-4 py-3 text-sm font-bold ' +
                  'text-slate-950 hover:bg-amber-400'
                }
              >
                Confirmar nova rodada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <footer
        className={
          'border-t border-slate-700 ' +
          'px-4 py-5 text-center ' +
          'text-xs opacity-60'
        }
      >
        Bingo Tracker · Dados salvos neste dispositivo
        <span className="sr-only">
          Versão {game.version}
        </span>
      </footer>
    </div>
  );
}
