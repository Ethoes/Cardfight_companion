// Pure reducer for a single player's board.
// Every action is a plain serialisable object (see ./actions.js), so the same
// actions can later be sent over the network for player-vs-player games.

import { BOOST_TARGET, CIRCLES, ZONE, isCircle } from './constants';
import { freshInstance } from './cards';
import { shuffle } from './random';
import { findCard } from './selectors';

export const PLAYER_ACTION = Object.freeze({
  MOVE_CARD: 'player/moveCard',
  MOVE_TOP_CARDS: 'player/moveTopCards',
  RIDE_FROM_RIDE_DECK: 'player/rideFromRideDeck',
  SHUFFLE_DECK: 'player/shuffleDeck',
  TOGGLE_REST: 'player/toggleRest',
  TOGGLE_FACE_DOWN: 'player/toggleFaceDown',
  STAND_ALL: 'player/standAll',
  COUNTER_BLAST: 'player/counterBlast',
  COUNTER_CHARGE: 'player/counterCharge',
  CLEAR_ZONE: 'player/clearZone',
  MULLIGAN: 'player/mulligan',
  STAND_UP: 'player/standUp',
  REVEAL_CHECK: 'player/revealCheck',
  RESOLVE_CHECK: 'player/resolveCheck',
  ADJUST_POWER: 'player/adjustPower',
  RESET_POWER: 'player/resetPower',
  SET_BOOST: 'player/setBoost',
  END_TURN: 'player/endTurn',
});

// ---------------------------------------------------------------------------
// Low level helpers (all return new state objects)
// ---------------------------------------------------------------------------

const withZones = (state, changes) => ({ ...state, zones: { ...state.zones, ...changes } });

function removeCard(state, uid) {
  const found = findCard(state, uid);
  if (!found) return [state, null, null];
  const cards = state.zones[found.zone].filter((c) => c.uid !== uid);
  return [withZones(state, { [found.zone]: cards }), found.instance, found.zone];
}

function insertCard(state, zone, instance, position = 'top') {
  const cards = state.zones[zone];
  const next = position === 'bottom' ? [instance, ...cards] : [...cards, instance];
  return withZones(state, { [zone]: next });
}

/**
 * Move one card to `to`. Vanguard rules for occupied circles:
 *  - riding onto the VC puts the previous vanguard into the soul
 *  - calling onto an occupied RC retires the previous rear-guard to the drop
 */
function moveCard(state, uid, to, { position = 'top', faceDown = false, rested = false } = {}) {
  const found = findCard(state, uid);
  if (!found) return state;
  if (found.zone === to && isCircle(to)) return state;

  let [next, instance] = removeCard(state, uid);

  if (isCircle(to) && next.zones[to].length > 0) {
    const [occupant] = next.zones[to];
    next = withZones(next, { [to]: [] });
    const destination = to === ZONE.VC ? ZONE.SOUL : ZONE.DROP;
    next = insertCard(next, destination, freshInstance(occupant));
  }

  next = insertCard(next, to, freshInstance(instance, { faceDown, rested }), position);
  // A boost belongs to one specific unit: it ends when that unit leaves or is replaced.
  return clearBoostsInto(next, [found.zone, to]);
}

/** Stop boosting for the back-row units behind any of `frontZones`. */
function clearBoostsInto(state, frontZones) {
  const changes = {};
  Object.entries(BOOST_TARGET).forEach(([back, front]) => {
    if (!frontZones.includes(front)) return;
    if (!state.zones[back].some((c) => c.boosting)) return;
    changes[back] = state.zones[back].map((c) => ({ ...c, boosting: false }));
  });
  return Object.keys(changes).length ? withZones(state, changes) : state;
}

function moveTopCards(state, from, to, count, options) {
  let next = state;
  for (let i = 0; i < count; i += 1) {
    const cards = next.zones[from];
    if (!cards.length) break;
    next = moveCard(next, cards[cards.length - 1].uid, to, options);
  }
  return next;
}

function updateCard(state, uid, update) {
  const found = findCard(state, uid);
  if (!found) return state;
  const cards = state.zones[found.zone].map((c) => (c.uid === uid ? { ...c, ...update(c) } : c));
  return withZones(state, { [found.zone]: cards });
}

function flipDamage(state, count, toFaceDown) {
  let remaining = count;
  const damage = state.zones[ZONE.DAMAGE].map((c) => {
    if (remaining > 0 && c.faceDown !== toFaceDown) {
      remaining -= 1;
      return { ...c, faceDown: toFaceDown };
    }
    return c;
  });
  return withZones(state, { [ZONE.DAMAGE]: damage });
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function playerReducer(state, action) {
  switch (action.type) {
    case PLAYER_ACTION.MOVE_CARD:
      return moveCard(state, action.uid, action.to, action.options);

    case PLAYER_ACTION.MOVE_TOP_CARDS:
      return moveTopCards(state, action.from, action.to, action.count ?? 1, action.options);

    case PLAYER_ACTION.RIDE_FROM_RIDE_DECK: {
      const ride = state.zones[ZONE.RIDE_DECK];
      if (!ride.length) return state;
      return moveCard(state, ride[ride.length - 1].uid, ZONE.VC);
    }

    case PLAYER_ACTION.SHUFFLE_DECK:
      return withZones(state, { [ZONE.DECK]: shuffle(state.zones[ZONE.DECK], action.seed) });

    case PLAYER_ACTION.TOGGLE_REST:
      // Standing a booster ends its boost.
      return updateCard(state, action.uid, (c) => (c.rested
        ? { rested: false, boosting: false }
        : { rested: true }));

    case PLAYER_ACTION.TOGGLE_FACE_DOWN:
      return updateCard(state, action.uid, (c) => ({ faceDown: !c.faceDown }));

    case PLAYER_ACTION.STAND_ALL: {
      const changes = {};
      CIRCLES.forEach((zone) => {
        changes[zone] = state.zones[zone].map((c) => ({ ...c, rested: false, boosting: false }));
      });
      return withZones(state, changes);
    }

    case PLAYER_ACTION.ADJUST_POWER: {
      const found = findCard(state, action.uid);
      if (!found || !isCircle(found.zone) || !action.delta) return state;
      return updateCard(state, action.uid, (c) => ({ powerMod: (c.powerMod || 0) + action.delta }));
    }

    case PLAYER_ACTION.RESET_POWER:
      return updateCard(state, action.uid, () => ({ powerMod: 0 }));

    case PLAYER_ACTION.SET_BOOST: {
      // Boosting rests the back-row unit and adds its power to the unit in front.
      const found = findCard(state, action.uid);
      const front = found && BOOST_TARGET[found.zone];
      if (!front) return state;
      if (action.boosting && !state.zones[front].length) return state;
      return updateCard(state, action.uid, () => (action.boosting
        ? { boosting: true, rested: true }
        : { boosting: false }));
    }

    case PLAYER_ACTION.END_TURN: {
      // "Until end of turn" power changes and boosts all wear off.
      const changes = {};
      CIRCLES.forEach((zone) => {
        if (state.zones[zone].some((c) => c.powerMod || c.boosting)) {
          changes[zone] = state.zones[zone].map((c) => ({ ...c, powerMod: 0, boosting: false }));
        }
      });
      return Object.keys(changes).length ? withZones(state, changes) : state;
    }

    case PLAYER_ACTION.COUNTER_BLAST:
      return flipDamage(state, action.count ?? 1, true);

    case PLAYER_ACTION.COUNTER_CHARGE:
      return flipDamage(state, action.count ?? 1, false);

    case PLAYER_ACTION.CLEAR_ZONE: {
      // e.g. retire all guardians, or put all drive-checked cards into hand
      let next = state;
      [...state.zones[action.zone]].forEach((c) => {
        next = moveCard(next, c.uid, action.to);
      });
      return next;
    }

    case PLAYER_ACTION.MULLIGAN: {
      // Return the chosen cards to the deck, draw the same number, shuffle.
      if (state.mulliganDone) return state;
      let next = state;
      const uids = action.uids.filter((uid) => state.zones[ZONE.HAND].some((c) => c.uid === uid));
      uids.forEach((uid) => {
        next = moveCard(next, uid, ZONE.DECK, { position: 'bottom' });
      });
      next = moveTopCards(next, ZONE.DECK, ZONE.HAND, uids.length);
      next = withZones(next, { [ZONE.DECK]: shuffle(next.zones[ZONE.DECK], action.seed) });
      return { ...next, mulliganDone: true };
    }

    case PLAYER_ACTION.REVEAL_CHECK: {
      // Drive / damage check: reveal the top card in the trigger zone and tag
      // it with where it goes once resolved (see RESOLVE_CHECK).
      const deck = state.zones[ZONE.DECK];
      if (!deck.length) return state;
      const { uid } = deck[deck.length - 1];
      const next = moveCard(state, uid, ZONE.TRIGGER);
      return updateCard(next, uid, () => ({ check: { kind: action.kind, to: action.to } }));
    }

    case PLAYER_ACTION.RESOLVE_CHECK: {
      const found = findCard(state, action.uid);
      if (!found || found.zone !== ZONE.TRIGGER || !found.instance.check) return state;
      return moveCard(state, action.uid, found.instance.check.to);
    }

    case PLAYER_ACTION.STAND_UP: {
      // "Stand up, Vanguard!" – flip the first vanguard face up.
      const vc = state.zones[ZONE.VC].map((c) => ({ ...c, faceDown: false }));
      return { ...withZones(state, { [ZONE.VC]: vc }), stoodUp: true, mulliganDone: true };
    }

    default:
      return state;
  }
}

