// Action creators for the player reducer. Randomness (seeds) is generated
// here so that the reducer itself stays deterministic.

import { CHECK_KIND, ZONE } from './constants';
import { PLAYER_ACTION } from './playerReducer';
import { newSeed } from './random';

export const moveCard = (uid, to, options = {}) => ({ type: PLAYER_ACTION.MOVE_CARD, uid, to, options });

export const moveTopCards = (from, to, count = 1, options = {}) => ({
  type: PLAYER_ACTION.MOVE_TOP_CARDS, from, to, count, options,
});

// Common Vanguard procedures built on moveTopCards ---------------------------
export const draw = (count = 1) => moveTopCards(ZONE.DECK, ZONE.HAND, count);
// Checks are revealed in the trigger zone first; resolveCheck moves the card
// on to its destination (the UI does this automatically after a short delay).
export const driveCheck = () => ({ type: PLAYER_ACTION.REVEAL_CHECK, kind: CHECK_KIND.DRIVE, to: ZONE.HAND });
export const damageCheck = () => ({ type: PLAYER_ACTION.REVEAL_CHECK, kind: CHECK_KIND.DAMAGE, to: ZONE.DAMAGE });
// mergeHistory: undoing after a check resolved goes straight back to before
// the check, instead of putting the card back in the trigger zone.
export const resolveCheck = (uid) => ({ type: PLAYER_ACTION.RESOLVE_CHECK, uid, meta: { mergeHistory: true } });
export const soulCharge = (count = 1) => moveTopCards(ZONE.DECK, ZONE.SOUL, count);
export const millTop = (count = 1) => moveTopCards(ZONE.DECK, ZONE.DROP, count);

export const rideFromRideDeck = () => ({ type: PLAYER_ACTION.RIDE_FROM_RIDE_DECK });
export const shuffleDeck = () => ({ type: PLAYER_ACTION.SHUFFLE_DECK, seed: newSeed() });
export const toggleRest = (uid) => ({ type: PLAYER_ACTION.TOGGLE_REST, uid });
export const toggleFaceDown = (uid) => ({ type: PLAYER_ACTION.TOGGLE_FACE_DOWN, uid });
export const standAll = () => ({ type: PLAYER_ACTION.STAND_ALL });
export const counterBlast = (count = 1) => ({ type: PLAYER_ACTION.COUNTER_BLAST, count });
export const counterCharge = (count = 1) => ({ type: PLAYER_ACTION.COUNTER_CHARGE, count });
export const clearZone = (zone, to) => ({ type: PLAYER_ACTION.CLEAR_ZONE, zone, to });
export const retireGuardians = () => clearZone(ZONE.GUARDIAN, ZONE.DROP);
export const resolveDriveChecks = () => clearZone(ZONE.TRIGGER, ZONE.HAND);
export const mulligan = (uids) => ({ type: PLAYER_ACTION.MULLIGAN, uids, seed: newSeed() });
export const standUp = () => ({ type: PLAYER_ACTION.STAND_UP });
