import {
  ZONE,
  actions,
  createGameState,
  gameReducer,
  nextPhase,
  playerAction,
  playerReducer,
  createPlayerState,
  PHASE,
  shuffle,
  withHistory,
  initHistory,
  undo,
  unitPower,
  createCardInstance,
} from './index';

const unit = (id, grade, extra = {}) => ({ id, name: `Card ${id}`, grade: `Grade ${grade}`, type: 'Normal Unit', ...extra });

const mainDeck = Array.from({ length: 50 }, (_, i) => unit(i + 1, i % 4, i % 5 === 0 ? { type: 'Trigger Unit', shield: '15000' } : {}));
const rideDeck = [3, 2, 1, 0].map((g) => ({ ...unit(100 + g, g), grade: g }));

const setup = () => createPlayerState({ mainDeck, rideDeck, seed: 42 });

describe('createPlayerState', () => {
  it('deals 5 cards and puts the grade 0 face down on the vanguard circle', () => {
    const p = setup();
    expect(p.zones[ZONE.HAND]).toHaveLength(5);
    expect(p.zones[ZONE.DECK]).toHaveLength(45);
    expect(p.zones[ZONE.VC]).toHaveLength(1);
    expect(p.zones[ZONE.VC][0].faceDown).toBe(true);
    expect(p.zones[ZONE.VC][0].card.id).toBe(100);
    // next ride is grade 1 (top = last element)
    const ride = p.zones[ZONE.RIDE_DECK];
    expect(ride[ride.length - 1].card.id).toBe(101);
  });

  it('is deterministic for the same seed', () => {
    expect(shuffle([1, 2, 3, 4, 5], 7)).toEqual(shuffle([1, 2, 3, 4, 5], 7));
  });
});

describe('playerReducer', () => {
  it('riding moves the old vanguard into the soul', () => {
    let p = playerReducer(setup(), actions.standUp());
    p = playerReducer(p, actions.rideFromRideDeck());
    expect(p.zones[ZONE.VC][0].card.id).toBe(101);
    expect(p.zones[ZONE.SOUL].map((c) => c.card.id)).toEqual([100]);
  });

  it('calling onto an occupied rear-guard circle retires the old unit', () => {
    let p = setup();
    const [a, b] = p.zones[ZONE.HAND];
    p = playerReducer(p, actions.moveCard(a.uid, ZONE.RC_FRONT_LEFT));
    p = playerReducer(p, actions.moveCard(b.uid, ZONE.RC_FRONT_LEFT));
    expect(p.zones[ZONE.RC_FRONT_LEFT][0].uid).toBe(b.uid);
    expect(p.zones[ZONE.DROP][0].uid).toBe(a.uid);
  });

  it('draw, damage check and counter blast', () => {
    let p = playerReducer(setup(), actions.draw(2));
    expect(p.zones[ZONE.HAND]).toHaveLength(7);
    for (let i = 0; i < 2; i += 1) {
      p = playerReducer(p, actions.damageCheck());
      const [revealed] = p.zones[ZONE.TRIGGER];
      expect(revealed.check).toMatchObject({ kind: 'damage', to: ZONE.DAMAGE });
      p = playerReducer(p, actions.resolveCheck(revealed.uid));
      expect(p.zones[ZONE.TRIGGER]).toHaveLength(0);
    }
    expect(p.zones[ZONE.DAMAGE]).toHaveLength(2);
    expect(p.zones[ZONE.DAMAGE][0].check).toBeNull();
    p = playerReducer(p, actions.counterBlast(1));
    expect(p.zones[ZONE.DAMAGE].filter((c) => c.faceDown)).toHaveLength(1);
  });

  it('mulligan keeps hand size and deck size', () => {
    const p0 = setup();
    const uids = p0.zones[ZONE.HAND].slice(0, 3).map((c) => c.uid);
    const p = playerReducer(p0, actions.mulligan(uids));
    expect(p.zones[ZONE.HAND]).toHaveLength(5);
    expect(p.zones[ZONE.DECK]).toHaveLength(45);
    expect(p.mulliganDone).toBe(true);
  });
});

describe('checks', () => {
  it('drive check reveals in the trigger zone, then goes to hand', () => {
    let p = playerReducer(setup(), actions.driveCheck());
    const [revealed] = p.zones[ZONE.TRIGGER];
    expect(p.zones[ZONE.HAND]).toHaveLength(5);
    p = playerReducer(p, actions.resolveCheck(revealed.uid));
    expect(p.zones[ZONE.HAND].map((c) => c.uid)).toContain(revealed.uid);
  });

  it('a check moved by hand is not resolved again', () => {
    let p = playerReducer(setup(), actions.driveCheck());
    const [revealed] = p.zones[ZONE.TRIGGER];
    p = playerReducer(p, actions.moveCard(revealed.uid, ZONE.DROP));
    expect(playerReducer(p, actions.resolveCheck(revealed.uid))).toBe(p);
  });

  it('undo after an automatic resolve returns to before the check', () => {
    const reducer = withHistory(gameReducer);
    let h = initHistory(createGameState([{ id: 'p1', mainDeck, rideDeck, seed: 3 }]));
    h = reducer(h, playerAction('p1', actions.driveCheck()));
    const uid = h.present.players.p1.zones[ZONE.TRIGGER][0].uid;
    h = reducer(h, playerAction('p1', actions.resolveCheck(uid)));
    h = reducer(h, undo());
    expect(h.present.players.p1.zones[ZONE.TRIGGER]).toHaveLength(0);
    expect(h.present.players.p1.zones[ZONE.DECK]).toHaveLength(45);
  });
});

describe('power and boost', () => {
  const units = [
    unit(900, 2, { power: '10000' }),
    unit(901, 1, { power: '8000' }),
  ];
  const powered = () => {
    let p = createPlayerState({ mainDeck: [...units, ...mainDeck], rideDeck, seed: 42, handSize: 0 });
    const front = p.zones[ZONE.DECK].find((c) => c.card.id === 900);
    const back = p.zones[ZONE.DECK].find((c) => c.card.id === 901);
    p = playerReducer(p, actions.moveCard(front.uid, ZONE.RC_FRONT_LEFT));
    p = playerReducer(p, actions.moveCard(back.uid, ZONE.RC_BACK_LEFT));
    return { p, front, back };
  };

  it('shows base power and applies modifiers', () => {
    let { p, front } = powered();
    expect(unitPower(p, ZONE.RC_FRONT_LEFT)).toMatchObject({ base: 10000, total: 10000 });
    p = playerReducer(p, actions.adjustPower(front.uid, 5000));
    p = playerReducer(p, actions.adjustPower(front.uid, 5000));
    p = playerReducer(p, actions.adjustPower(front.uid, -2000));
    expect(unitPower(p, ZONE.RC_FRONT_LEFT).total).toBe(18000);
    p = playerReducer(p, actions.resetPower(front.uid));
    expect(unitPower(p, ZONE.RC_FRONT_LEFT).total).toBe(10000);
  });

  it('boosting rests the back unit and adds its power (incl. modifiers) to the front', () => {
    let { p, back } = powered();
    p = playerReducer(p, actions.adjustPower(back.uid, 5000));
    p = playerReducer(p, actions.setBoost(back.uid));
    expect(p.zones[ZONE.RC_BACK_LEFT][0]).toMatchObject({ rested: true, boosting: true });
    expect(unitPower(p, ZONE.RC_FRONT_LEFT)).toMatchObject({ boost: 13000, total: 23000 });
    // standing the booster ends the boost
    p = playerReducer(p, actions.toggleRest(back.uid));
    expect(unitPower(p, ZONE.RC_FRONT_LEFT).total).toBe(10000);
  });

  it('cannot boost an empty circle, and the boost ends when the front unit leaves', () => {
    let { p, front, back } = powered();
    p = playerReducer(p, actions.setBoost(back.uid));
    p = playerReducer(p, actions.moveCard(front.uid, ZONE.DROP));
    expect(p.zones[ZONE.RC_BACK_LEFT][0].boosting).toBe(false);
    expect(playerReducer(p, actions.setBoost(back.uid))).toBe(p);
  });

  it('moving a unit resets its power', () => {
    let { p, front } = powered();
    p = playerReducer(p, actions.adjustPower(front.uid, 5000));
    p = playerReducer(p, actions.moveCard(front.uid, ZONE.RC_FRONT_RIGHT));
    expect(unitPower(p, ZONE.RC_FRONT_RIGHT).total).toBe(10000);
  });

  it('ending the turn resets power and boosts', () => {
    let g = createGameState([{ id: 'p1', mainDeck: [...units, ...mainDeck], rideDeck, seed: 5 }]);
    const deck = g.players.p1.zones[ZONE.DECK].concat(g.players.p1.zones[ZONE.HAND]);
    const front = deck.find((c) => c.card.id === 900);
    const back = deck.find((c) => c.card.id === 901);
    g = gameReducer(g, playerAction('p1', actions.moveCard(front.uid, ZONE.RC_FRONT_LEFT)));
    g = gameReducer(g, playerAction('p1', actions.moveCard(back.uid, ZONE.RC_BACK_LEFT)));
    g = gameReducer(g, playerAction('p1', actions.adjustPower(front.uid, 10000)));
    g = gameReducer(g, playerAction('p1', actions.setBoost(back.uid)));
    expect(unitPower(g.players.p1, ZONE.RC_FRONT_LEFT).total).toBe(28000);
    for (let i = 0; i < 5; i += 1) g = gameReducer(g, nextPhase());
    expect(unitPower(g.players.p1, ZONE.RC_FRONT_LEFT).total).toBe(28000); // still in end phase
    g = gameReducer(g, nextPhase());
    expect(g.turn.number).toBe(2);
    expect(unitPower(g.players.p1, ZONE.RC_FRONT_LEFT).total).toBe(10000);
  });

  it('face-down and empty circles have no power', () => {
    const p = setup();
    expect(unitPower(p, ZONE.VC)).toBeNull();
    expect(unitPower(p, ZONE.RC_FRONT_LEFT)).toBeNull();
  });
});

describe('online setup', () => {
  it('builds identical games on every client, whatever else was created before', () => {
    const players = [
      { id: 'p1', mainDeck, rideDeck, seed: 11 },
      { id: 'p2', mainDeck, rideDeck, seed: 22 },
    ];
    const a = createGameState(players, { firstPlayerId: 'p2' });
    createCardInstance(mainDeck[0]); // e.g. a test hand opened earlier in this tab
    const b = createGameState(players, { firstPlayerId: 'p2' });
    expect(b).toEqual(a);
    expect(a.turn.activePlayerId).toBe('p2');
    // replaying the same actions gives the same result
    const log = [
      playerAction('p1', actions.mulligan(a.players.p1.zones[ZONE.HAND].slice(0, 2).map((c) => c.uid))),
      playerAction('p2', actions.standUp()),
      nextPhase(),
      playerAction('p2', actions.driveCheck()),
    ];
    expect(log.reduce(gameReducer, b)).toEqual(log.reduce(gameReducer, a));
  });
});

describe('gameReducer', () => {
  it('routes player actions and auto-draws in the draw phase', () => {
    let g = createGameState([
      { id: 'p1', mainDeck, rideDeck, seed: 1 },
      { id: 'p2', mainDeck, rideDeck, seed: 2 },
    ]);
    g = gameReducer(g, playerAction('p2', actions.draw()));
    expect(g.players.p2.zones[ZONE.HAND]).toHaveLength(6);
    expect(g.players.p1.zones[ZONE.HAND]).toHaveLength(5);

    g = gameReducer(g, nextPhase());
    expect(g.turn.phase).toBe(PHASE.DRAW);
    expect(g.players.p1.zones[ZONE.HAND]).toHaveLength(6);

    for (let i = 0; i < 5; i += 1) g = gameReducer(g, nextPhase());
    expect(g.turn).toMatchObject({ number: 2, activePlayerId: 'p2', phase: PHASE.STAND });
  });
});
