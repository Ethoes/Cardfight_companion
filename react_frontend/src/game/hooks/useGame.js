import { useCallback, useEffect, useMemo, useReducer } from 'react';
import {
  createGameState,
  gameReducer,
  initHistory,
  playerAction,
  redo as redoAction,
  resetHistory,
  undo as undoAction,
  withHistory,
} from '../engine';

const historyGameReducer = withHistory(gameReducer);

/**
 * Local game state with undo/redo.
 *
 * @param {() => Array} buildPlayers returns the player setup list passed to
 *   createGameState (called on mount and on every reset so each new game gets
 *   a fresh shuffle).
 *
 * For an online match, replace this hook with one that forwards the same
 * actions over a socket – the components only depend on the returned shape.
 */
export default function useGame(buildPlayers, { enableKeyboardShortcuts = true } = {}) {
  const [history, dispatch] = useReducer(historyGameReducer, undefined, () =>
    initHistory(createGameState(buildPlayers())),
  );

  const game = history.present;

  const dispatchFor = useCallback(
    (playerId) => (action) => dispatch(playerAction(playerId, action)),
    [],
  );

  const undo = useCallback(() => dispatch(undoAction()), []);
  const redo = useCallback(() => dispatch(redoAction()), []);
  const reset = useCallback(
    () => dispatch(resetHistory(createGameState(buildPlayers(), game.settings))),
    [buildPlayers, game.settings],
  );

  useEffect(() => {
    if (!enableKeyboardShortcuts) return undefined;
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableKeyboardShortcuts, undo, redo]);

  return useMemo(() => ({
    game,
    dispatch,
    dispatchFor,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }), [game, dispatchFor, undo, redo, reset, history.past.length, history.future.length]);
}
