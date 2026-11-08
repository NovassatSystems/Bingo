
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

import {
  type BingoCard,
  type BingoGame,
  type BingoRules,
  type BingoSettings,
} from '../models/bingo';

import {
  addCard,
  analyzeGame,
  deleteCard,
  drawNumber,
  getLastDrawnNumber,
  removeDrawnNumber,
  startNewRound,
  undoLastDraw,
  updateCard,
} from '../features/bingo/engine';

import {
  downloadGameBackup,
  loadGame,
  readBackupFile,
  saveGame,
} from '../storage/bingoStorage';

/**
 * Bingo Tracker
 * Hook central de gerenciamento.
 *
 * O estado persistente contém apenas:
 * - Cartelas
 * - Números sorteados
 * - Configurações
 * - Rodada atual
 *
 * Marcações, alertas e vitórias
 * são sempre dados derivados.
 */

type GameAction =
  | { type: 'DRAW'; number: number }
  | { type: 'UNDO' }
  | { type: 'REMOVE_DRAW'; number: number }
  | { type: 'NEW_ROUND' }
  | { type: 'ADD_CARD'; card: BingoCard }
  | { type: 'UPDATE_CARD'; card: BingoCard }
  | { type: 'DELETE_CARD'; cardId: string }
  | {
      type: 'UPDATE_SETTINGS';
      settings: Partial<BingoSettings>;
    }
  | {
      type: 'UPDATE_RULES';
      rules: Partial<BingoRules>;
    }
  | { type: 'RESTORE'; game: BingoGame };

function gameReducer(
  game: BingoGame,
  action: GameAction,
): BingoGame {
  switch (action.type) {
    case 'DRAW':
      return drawNumber(game, action.number);

    case 'UNDO':
      return undoLastDraw(game);

    case 'REMOVE_DRAW':
      return removeDrawnNumber(
        game,
        action.number,
      );

    case 'NEW_ROUND':
      return startNewRound(game);

    case 'ADD_CARD':
      return addCard(game, action.card);

    case 'UPDATE_CARD':
      return updateCard(game, action.card);

    case 'DELETE_CARD':
      return deleteCard(game, action.cardId);

    case 'UPDATE_SETTINGS':
      return {
        ...game,
        settings: {
          ...game.settings,
          ...action.settings,
          rules: {
            ...game.settings.rules,
            ...action.settings.rules,
          },
        },
        updatedAt: new Date().toISOString(),
      };

    case 'UPDATE_RULES':
      return {
        ...game,
        settings: {
          ...game.settings,
          rules: {
            ...game.settings.rules,
            ...action.rules,
          },
        },
        updatedAt: new Date().toISOString(),
      };

    case 'RESTORE':
      return action.game;

    default:
      return game;
  }
}

/**
 * Resultado da inicialização.
 */
function initializeGame(): {
  game: BingoGame;
  error: string | null;
} {
  const result = loadGame();

  return {
    game: result.game,
    error: result.error ?? null,
  };
}

/**
 * Hook principal.
 */
export function useBingoGame() {
  const [initial] = useState(initializeGame);

  const [game, dispatch] = useReducer(
    gameReducer,
    initial.game,
  );

  const [error, setError] = useState<
    string | null
  >(initial.error);

  const [notice, setNotice] = useState<
    string | null
  >(null);

  /**
   * Análise calculada a partir
   * do estado atual.
   */
  const analysis = useMemo(
    () => analyzeGame(game),
    [game],
  );

  /**
   * Último número sorteado.
   */
  const lastDrawnNumber = useMemo(
    () => getLastDrawnNumber(game),
    [game],
  );

  /**
   * Conjunto de números sorteados
   * para consultas rápidas.
   */
  const drawnSet = useMemo(
    () => new Set(game.drawnNumbers),
    [game.drawnNumbers],
  );

  /**
   * Salvamento automático.
   */
  useEffect(() => {
    const result = saveGame(game);

    if (!result.success) {
      setError(
        result.error ??
          'Não foi possível salvar a partida.',
      );
    }
  }, [game]);

  /**
   * Registra um número sorteado.
   *
   * Valida antes de enviar
   * a ação ao reducer.
   */
  const registerNumber = useCallback(
    (number: number): boolean => {
      if (
        !Number.isInteger(number) ||
        number < 1 ||
        number > 75
      ) {
        setError(
          'Digite um número entre 1 e 75.',
        );
        return false;
      }

      if (game.drawnNumbers.includes(number)) {
        setError(
          `O número ${number} já foi sorteado.`,
        );
        return false;
      }

      setError(null);
      setNotice(`Número ${number} registrado.`);

      dispatch({
        type: 'DRAW',
        number,
      });

      return true;
    },
    [game.drawnNumbers],
  );

  /**
   * Desfaz o último sorteio.
   */
  const undo = useCallback(() => {
    if (game.drawnNumbers.length === 0) {
      setNotice('Não há sorteios para desfazer.');
      return;
    }

    dispatch({ type: 'UNDO' });

    setError(null);
    setNotice('Último sorteio desfeito.');
  }, [game.drawnNumbers.length]);

  /**
   * Remove um número específico.
   *
   * A confirmação será feita
   * pelo componente visual.
   */
  const removeNumber = useCallback(
    (number: number) => {
      if (!game.drawnNumbers.includes(number)) {
        setError(
          `O número ${number} não está no histórico.`,
        );
        return;
      }

      dispatch({
        type: 'REMOVE_DRAW',
        number,
      });

      setError(null);
      setNotice(`Número ${number} removido.`);
    },
    [game.drawnNumbers],
  );

  /**
   * Inicia uma nova rodada.
   *
   * Preserva todas as cartelas.
   */
  const newRound = useCallback(() => {
    dispatch({ type: 'NEW_ROUND' });

    setError(null);
    setNotice('Nova rodada iniciada.');
  }, []);

  /**
   * Adiciona uma cartela.
   */
  const registerCard = useCallback(
    (card: BingoCard): boolean => {
      if (
        game.cards.some(
          (existing) => existing.id === card.id,
        )
      ) {
        setError(
          `A cartela ${card.id} já existe.`,
        );
        return false;
      }

      dispatch({
        type: 'ADD_CARD',
        card,
      });

      setError(null);
      setNotice(`Cartela ${card.id} adicionada.`);

      return true;
    },
    [game.cards],
  );

  /**
   * Atualiza uma cartela.
   */
  const editCard = useCallback(
    (card: BingoCard) => {
      dispatch({
        type: 'UPDATE_CARD',
        card,
      });

      setError(null);
      setNotice(`Cartela ${card.id} atualizada.`);
    },
    [],
  );

  /**
   * Exclui uma cartela.
   *
   * A confirmação será feita
   * na interface.
   */
  const removeCard = useCallback(
    (cardId: string) => {
      dispatch({
        type: 'DELETE_CARD',
        cardId,
      });

      setError(null);
      setNotice(`Cartela ${cardId} excluída.`);
    },
    [],
  );

  /**
   * Atualiza preferências.
   */
  const updateSettings = useCallback(
    (settings: Partial<BingoSettings>) => {
      dispatch({
        type: 'UPDATE_SETTINGS',
        settings,
      });
    },
    [],
  );

  /**
   * Atualiza modalidades de vitória.
   */
  const updateRules = useCallback(
    (rules: Partial<BingoRules>) => {
      dispatch({
        type: 'UPDATE_RULES',
        rules,
      });
    },
    [],
  );

  /**
   * Exporta o backup da partida.
   */
  const exportBackup = useCallback(() => {
    try {
      downloadGameBackup(game);

      setError(null);
      setNotice('Backup preparado para download.');

      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Erro ao exportar backup.',
      );

      return false;
    }
  }, [game]);

  /**
   * Importa e restaura um backup.
   *
   * A interface deve solicitar
   * confirmação antes da chamada.
   */
  const importBackup = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        const restored = await readBackupFile(file);

        const saved = saveGame(restored);

        if (!saved.success) {
          throw new Error(
            saved.error ??
              'Falha ao salvar backup importado.',
          );
        }

        dispatch({
          type: 'RESTORE',
          game: restored,
        });

        setError(null);
        setNotice('Backup restaurado com sucesso.');

        return true;
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Erro ao importar backup.',
        );

        return false;
      }
    },
    [],
  );

  /**
   * Ordenação visual das cartelas.
   *
   * Não altera a ordem persistida.
   */
  const sortedCards = useMemo(() => {
    const cards = [...game.cards];

    switch (game.settings.sortMode) {
      case 'identifier':
        return cards.sort((a, b) =>
          a.id.localeCompare(b.id, 'pt-BR', {
            numeric: true,
          }),
        );

      case 'closest': {
        const progress = new Map(
          analysis.cards.map((card) => [
            card.cardId,
            card,
          ]),
        );

        return cards.sort((a, b) => {
          const aAnalysis = progress.get(a.id);
          const bAnalysis = progress.get(b.id);

          const aRemaining =
            aAnalysis?.combinations[0]
              ?.remainingCount ?? Infinity;

          const bRemaining =
            bAnalysis?.combinations[0]
              ?.remainingCount ?? Infinity;

          return (
            aRemaining - bRemaining ||
            a.id.localeCompare(b.id, 'pt-BR', {
              numeric: true,
            })
          );
        });
      }

      case 'registration':
      default:
        return cards;
    }
  }, [
    game.cards,
    game.settings.sortMode,
    analysis.cards,
  ]);

  /**
   * Limpa mensagens da interface.
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setNotice(null);
  }, []);

  return {
    // Estado persistente
    game,
    settings: game.settings,
    cards: game.cards,
    drawnNumbers: game.drawnNumbers,
    round: game.round,

    // Estado calculado
    analysis,
    sortedCards,
    drawnSet,
    lastDrawnNumber,

    // Indicadores
    totalCards: game.cards.length,
    totalDrawn: game.drawnNumbers.length,
    totalWinners: analysis.totalWinners,
    totalAlmostWins: analysis.totalAlmostWins,

    // Sorteios
    registerNumber,
    undo,
    removeNumber,
    newRound,

    // Cartelas
    registerCard,
    editCard,
    removeCard,

    // Configurações
    updateSettings,
    updateRules,

    // Backup
    exportBackup,
    importBackup,

    // Mensagens
    error,
    notice,
    clearMessages,
  };
}
