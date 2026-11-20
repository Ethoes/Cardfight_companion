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
