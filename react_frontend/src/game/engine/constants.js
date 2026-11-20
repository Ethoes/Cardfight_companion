// Zone identifiers and Vanguard terminology shared by the whole game engine.
// Everything here is plain data so it can be reused by a solo "test hand"
// session as well as a future player-vs-player mode.

export const ZONE = Object.freeze({
  DECK: 'deck',
  HAND: 'hand',
  DROP: 'drop',
  DAMAGE: 'damage',
  SOUL: 'soul',
  RIDE_DECK: 'rideDeck',
  TRIGGER: 'trigger',
  GUARDIAN: 'guardian',
  ORDER: 'order',
  BIND: 'bind',
  G_ZONE: 'gZone',
  VC: 'vc',
  RC_FRONT_LEFT: 'rcFrontLeft',
  RC_FRONT_RIGHT: 'rcFrontRight',
  RC_BACK_LEFT: 'rcBackLeft',
  RC_BACK_CENTER: 'rcBackCenter',
  RC_BACK_RIGHT: 'rcBackRight',
});

export const REAR_GUARD_CIRCLES = [
  ZONE.RC_FRONT_LEFT,
  ZONE.RC_FRONT_RIGHT,
  ZONE.RC_BACK_LEFT,
  ZONE.RC_BACK_CENTER,
  ZONE.RC_BACK_RIGHT,
];

/** Back-row circle -> the circle in front of it that its boost goes to. */
export const BOOST_TARGET = Object.freeze({
  [ZONE.RC_BACK_LEFT]: ZONE.RC_FRONT_LEFT,
  [ZONE.RC_BACK_CENTER]: ZONE.VC,
  [ZONE.RC_BACK_RIGHT]: ZONE.RC_FRONT_RIGHT,
});

/** Power is almost always modified in steps of 5000. */
export const POWER_STEP = 5000;

/** Circles hold at most one unit. */
export const CIRCLES = [ZONE.VC, ...REAR_GUARD_CIRCLES];

export const ALL_ZONES = Object.values(ZONE);

/** Zones whose contents only the owner may look at. */
export const HIDDEN_ZONES = [ZONE.DECK, ZONE.HAND, ZONE.RIDE_DECK, ZONE.G_ZONE];

/** Zones whose card order/content is shown face down on the table. */
export const FACE_DOWN_PILES = [ZONE.DECK, ZONE.RIDE_DECK, ZONE.G_ZONE];

export const ZONE_INFO = Object.freeze({
  [ZONE.DECK]: { label: 'Deck', short: 'Deck' },
  [ZONE.HAND]: { label: 'Hand', short: 'Hand' },
  [ZONE.DROP]: { label: 'Drop Zone', short: 'Drop' },
  [ZONE.DAMAGE]: { label: 'Damage Zone', short: 'Damage' },
  [ZONE.SOUL]: { label: 'Soul', short: 'Soul' },
  [ZONE.RIDE_DECK]: { label: 'Ride Deck', short: 'Ride Deck' },
  [ZONE.TRIGGER]: { label: 'Trigger Zone', short: 'Trigger' },
  [ZONE.GUARDIAN]: { label: 'Guardian Circle', short: 'GC' },
  [ZONE.ORDER]: { label: 'Order Zone', short: 'Order' },
  [ZONE.BIND]: { label: 'Bind Zone', short: 'Bind' },
  [ZONE.G_ZONE]: { label: 'G Zone', short: 'G Zone' },
  [ZONE.VC]: { label: 'Vanguard Circle', short: 'VC' },
  [ZONE.RC_FRONT_LEFT]: { label: 'Rear-guard Circle (front left)', short: 'RC' },
  [ZONE.RC_FRONT_RIGHT]: { label: 'Rear-guard Circle (front right)', short: 'RC' },
  [ZONE.RC_BACK_LEFT]: { label: 'Rear-guard Circle (back left)', short: 'RC' },
  [ZONE.RC_BACK_CENTER]: { label: 'Rear-guard Circle (back center)', short: 'RC' },
  [ZONE.RC_BACK_RIGHT]: { label: 'Rear-guard Circle (back right)', short: 'RC' },
});

export const zoneLabel = (zone) => ZONE_INFO[zone]?.label ?? zone;
export const zoneShort = (zone) => ZONE_INFO[zone]?.short ?? zone;
export const isCircle = (zone) => CIRCLES.includes(zone);
export const isRearGuardCircle = (zone) => REAR_GUARD_CIRCLES.includes(zone);

/** Turn structure (Standard / D-series). */
export const PHASE = Object.freeze({
  STAND: 'stand',
  DRAW: 'draw',
  RIDE: 'ride',
  MAIN: 'main',
  BATTLE: 'battle',
  END: 'end',
});

export const PHASE_ORDER = [PHASE.STAND, PHASE.DRAW, PHASE.RIDE, PHASE.MAIN, PHASE.BATTLE, PHASE.END];

export const PHASE_LABEL = Object.freeze({
  [PHASE.STAND]: 'Stand',
  [PHASE.DRAW]: 'Draw',
  [PHASE.RIDE]: 'Ride',
  [PHASE.MAIN]: 'Main',
  [PHASE.BATTLE]: 'Battle',
  [PHASE.END]: 'End',
});

export const STARTING_HAND_SIZE = 5;
export const DAMAGE_TO_LOSE = 6;

/** Drive / damage checks are revealed in the trigger zone for this long. */
export const CHECK_REVEAL_MS = 2000;

export const CHECK_KIND = Object.freeze({
  DRIVE: 'drive',
  DAMAGE: 'damage',
});
