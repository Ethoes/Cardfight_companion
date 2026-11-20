// Game-level state: any number of players plus the shared turn structure.
//
// The solo "test hand" uses one player; a player-vs-player match can use the
// exact same reducer with two players – only the transport of actions
// (local dispatch vs. network) differs.

import { PHASE, PHASE_ORDER } from './constants';
import { playerReducer } from './playerReducer';
import { createPlayerState } from './playerState';
import { draw, standAll } from './actions';

export const GAME_ACTION = Object.freeze({
  PLAYER: 'game/player',
  NEXT_PHASE: 'game/nextPhase',
  SET_PHASE: 'game/setPhase',
  SET_AUTO_PHASE: 'game/setAutoPhase',
});

/**
 * @param {Array<{id: string, name?: string, mainDeck: object[], rideDeck: object[], seed: number}>} players
 */
export function createGameState(players, { autoPhaseActions = true } = {}) {
  const playerStates = {};
  players.forEach((p) => {
    playerStates[p.id] = { ...createPlayerState({ ...p, playerId: p.id }), name: p.name ?? p.id };
  });
  return {
    players: playerStates,
    playerOrder: players.map((p) => p.id),
    turn: {
      number: 1,
      phase: PHASE.STAND,
      activePlayerId: players[0]?.id,
    },
    settings: { autoPhaseActions },
  };
}

// Wrap a player action so the game reducer knows whose board it targets.
export const playerAction = (playerId, action) => ({ type: GAME_ACTION.PLAYER, playerId, action });
export const nextPhase = () => ({ type: GAME_ACTION.NEXT_PHASE });
export const setPhase = (phase) => ({ type: GAME_ACTION.SET_PHASE, phase });
export const setAutoPhaseActions = (enabled) => ({ type: GAME_ACTION.SET_AUTO_PHASE, enabled });

function applyToPlayer(state, playerId, action) {
  const player = state.players[playerId];
  if (!player) return state;
  const updated = playerReducer(player, action);
  if (updated === player) return state;
  return { ...state, players: { ...state.players, [playerId]: updated } };
}

/** Automatic rules-actions when a phase begins (stand all units, draw a card). */
function enterPhase(state, phase) {
  const { activePlayerId } = state.turn;
  if (!state.settings.autoPhaseActions) return state;
  if (phase === PHASE.STAND) return applyToPlayer(state, activePlayerId, standAll());
  if (phase === PHASE.DRAW) return applyToPlayer(state, activePlayerId, draw(1));
  return state;
}

export function gameReducer(state, action) {
  switch (action.type) {
    case GAME_ACTION.PLAYER:
      return applyToPlayer(state, action.playerId, action.action);

    case GAME_ACTION.NEXT_PHASE: {
      const index = PHASE_ORDER.indexOf(state.turn.phase);
      let turn;
      if (index === PHASE_ORDER.length - 1) {
        const order = state.playerOrder;
        const nextPlayer = order[(order.indexOf(state.turn.activePlayerId) + 1) % order.length];
        turn = { number: state.turn.number + 1, phase: PHASE_ORDER[0], activePlayerId: nextPlayer };
      } else {
        turn = { ...state.turn, phase: PHASE_ORDER[index + 1] };
      }
      return enterPhase({ ...state, turn }, turn.phase);
    }

    case GAME_ACTION.SET_PHASE:
      return { ...state, turn: { ...state.turn, phase: action.phase } };

    case GAME_ACTION.SET_AUTO_PHASE:
      return { ...state, settings: { ...state.settings, autoPhaseActions: action.enabled } };

    default:
      return state;
  }
}
