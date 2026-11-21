// Generic undo/redo wrapper for any reducer.

export const HISTORY_ACTION = Object.freeze({
  UNDO: 'history/undo',
  REDO: 'history/redo',
  RESET: 'history/reset',
});

export const undo = () => ({ type: HISTORY_ACTION.UNDO });
export const redo = () => ({ type: HISTORY_ACTION.REDO });
export const resetHistory = (state) => ({ type: HISTORY_ACTION.RESET, state });

export const initHistory = (present) => ({ past: [], present, future: [] });

export function withHistory(reducer, { limit = 100 } = {}) {
  return function historyReducer(history, action) {
    const { past, present, future } = history;
    switch (action.type) {
      case HISTORY_ACTION.UNDO:
        if (!past.length) return history;
        return { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] };
      case HISTORY_ACTION.REDO:
        if (!future.length) return history;
        return { past: [...past, present], present: future[0], future: future.slice(1) };
      case HISTORY_ACTION.RESET:
        return initHistory(action.state);
      default: {
        const next = reducer(present, action);
        if (next === present) return history;
        // Follow-up actions (e.g. an automatic check resolution) can fold into
        // the previous undo step. Also looks inside wrapped game actions.
        const merge = action.meta?.mergeHistory || action.action?.meta?.mergeHistory;
        if (merge && past.length) return { past, present: next, future: [] };
        return { past: [...past, present].slice(-limit), present: next, future: [] };
      }
    }
  };
}
