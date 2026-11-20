import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionToolbar,
  BoardInteractionContext,
  CardActionBar,
  CardPreview,
  DAMAGE_TO_LOSE,
  Hand,
  Modal,
  PileViewer,
  PlayerBoard,
  TurnTracker,
  ZONE,
  actions,
  createGameState,
  nextPhase,
  setPhase,
  useBoardInteraction,
  useCheckResolver,
  usePlayerTools,
  useRemoteGame,
  zoneLabel,
} from '../game';
import { fetchDeckCards, forgetSeat, getRoom, leaveRoom, roomTransport, seatToken } from './fightApi';
import '../deck_details/test_hand/TestHand.css';
import './Cardfight.css';

const EMPTY = [];
// Zones of the opponent anyone may look through.
const PUBLIC_ZONES = [ZONE.DROP, ZONE.DAMAGE, ZONE.SOUL, ZONE.BIND, ZONE.ORDER];

// Both clients must build identical boards, whatever order the API returns.
const byId = (cards) => [...cards].sort((a, b) => Number(a.id) - Number(b.id));

/** Loads the room and both decks, then hands over to the live match. */
export default function CardfightMatch() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const token = seatToken(roomId);
  const [room, setRoom] = useState(null);
  const [initialGame, setInitialGame] = useState(null);
  const [error, setError] = useState(token ? null : 'You are not seated in this room.');

  // Room info (and wait until it is full, e.g. after the host refreshed).
  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    let timer;
    const load = async () => {
      try {
        const info = await getRoom(roomId, token);
        if (!alive) return;
        setRoom(info);
        if (info.status === 'waiting') timer = setTimeout(load, 1500);
      } catch (err) {
        if (alive) setError(err.status === 404 ? 'This cardfight no longer exists.' : err.message);
      }
    };
    load();
    return () => { alive = false; clearTimeout(timer); };
  }, [roomId, token]);

  // Both decks -> the shared starting position.
  const ready = room && room.setup && room.players.length === 2;
  useEffect(() => {
    if (!ready || initialGame) return undefined;
    let alive = true;
    Promise.all(room.players.map((p) => fetchDeckCards(p.deckId)))
      .then((decks) => {
        if (!alive) return;
        const players = room.players.map((p, i) => ({
          id: p.id,
          name: p.username,
          mainDeck: byId(decks[i].cards),
          rideDeck: byId(decks[i].rideDeck),
          seed: room.setup.seeds[p.id],
        }));
        setInitialGame(createGameState(players, { firstPlayerId: room.setup.firstPlayerId }));
      })
      .catch((err) => alive && setError(err.message));
    return () => { alive = false; };
  }, [ready, room, initialGame]);

  if (error) {
    return (
      <div className="vg-root Cardfight Cardfight--center">
        <div className="Cf-panel Cf-notice">
          <h2>Can’t open this cardfight</h2>
          <p>{error}</p>
          <button type="button" className="vg-btn vg-btn--primary" onClick={() => navigate('/cardfight')}>Back to rooms</button>
        </div>
      </div>
    );
  }

  if (!room || !initialGame) {
    return (
      <div className="vg-root Cardfight Cardfight--center">
        <div className="Cf-panel Cf-notice" aria-live="polite">
          <div className="Cf-spinner" aria-hidden="true" />
          <h2>{room?.status === 'waiting' ? 'Waiting for an opponent…' : 'Shuffling up…'}</h2>
          {room && <p className="Cf-muted">{room.name}</p>}
        </div>
      </div>
    );
  }

  return <LiveMatch roomInfo={room} token={token} initialGame={initialGame} />;
}

function LiveMatch({ roomInfo, token, initialGame }) {
  const navigate = useNavigate();
  const [room, setRoom] = useState(roomInfo);
  const myId = roomInfo.you;
  const oppId = roomInfo.players.find((p) => p.id !== myId)?.id;

  const transport = useMemo(() => roomTransport(roomInfo.id, token), [roomInfo.id, token]);
  const { game, dispatch, dispatchFor, connection } = useRemoteGame({
    transport, initialGame, myId, onRoom: setRoom,
  });

  const me = game.players[myId];
  const opp = game.players[oppId];
  const act = dispatchFor(myId);
  const myIds = useMemo(() => [myId], [myId]);

  const tools = usePlayerTools({ player: me, playerId: myId, act });
  const [oppViewer, setOppViewer] = useState(null); // zone of the opponent being viewed
  const [infoCard, setInfoCard] = useState(null);
  const [mulliganMarks, setMulliganMarks] = useState([]);

  const preGame = !me.stoodUp;
  const bothReady = me.stoodUp && opp.stoodUp;
  const myTurn = game.turn.activePlayerId === myId;

  useCheckResolver(game.players, dispatchFor, myIds);

  const interceptCardClick = useCallback((playerId, instance, zone) => {
    if (!preGame || playerId !== myId || zone !== ZONE.HAND) return false;
    setMulliganMarks((marks) => (marks.includes(instance.uid)
      ? marks.filter((uid) => uid !== instance.uid)
      : [...marks, instance.uid]));
    return true;
  }, [preGame, myId]);

  const interaction = useBoardInteraction({
    dispatchFor,
    interactivePlayers: myIds,
    interceptCardClick,
    markedUids: preGame ? mulliganMarks : EMPTY,
  });

  const standUp = () => {
    if (mulliganMarks.length) act(actions.mulligan(mulliganMarks));
    act(actions.standUp());
    setMulliganMarks([]);
  };

  const leave = async () => {
    forgetSeat(room.id);
    await leaveRoom(room.id, token);
    navigate('/cardfight');
  };

  const players = Object.fromEntries(room.players.map((p) => [p.id, p]));
  const oppInfo = players[oppId];
  const closed = room.status === 'closed';
  const loser = [myId, oppId].find((id) => game.players[id].zones[ZONE.DAMAGE].length >= DAMAGE_TO_LOSE);

  const firstName = game.players[initialGame.turn.activePlayerId]?.name;
  const iGoFirst = initialGame.turn.activePlayerId === myId;

  let status;
  if (preGame) {
    status = (
      <div className="TestHand-mulligan">
        <p>
          <strong>Mulligan:</strong> tap the cards to return, then stand up.{' '}
          <span className="Cf-muted">{iGoFirst ? 'You go first.' : `${firstName} goes first.`}</span>
        </p>
        <button type="button" className="vg-btn vg-btn--primary" onClick={standUp}>
          {mulliganMarks.length ? `Redraw ${mulliganMarks.length} & Stand up, Vanguard!` : 'Keep hand & Stand up, Vanguard!'}
        </button>
      </div>
    );
  } else if (!bothReady) {
    status = <p className="Cf-status-note">Waiting for {opp.name} to finish their mulligan…</p>;
  } else {
    status = (
      <TurnTracker
        turn={game.turn}
        activePlayerName={myTurn ? 'Your turn' : `${opp.name}'s turn`}
        onNextPhase={() => dispatch(nextPhase())}
        onSetPhase={(phase) => dispatch(setPhase(phase))}
        disabled={!myTurn}
      />
    );
  }

  return (
    <BoardInteractionContext.Provider value={interaction}>
      <div className="vg-root TestHand Cardfight" onClick={() => interaction.clearSelection()}>
        <header className="TestHand-header" onClick={(e) => e.stopPropagation()}>
          <div className="TestHand-heading">
            <span className="TestHand-eyebrow">Cardfight · {room.name}</span>
            <h1 className="TestHand-title">{me.name} vs {opp.name}</h1>
          </div>
          <div className="TestHand-status">{status}</div>
          <div className="TestHand-controls">
            <span className={`Cf-conn Cf-conn--${closed ? 'gone' : connection}`} title="Connection to the server">
              {closed ? 'Ended'
                : connection === 'online' ? 'Connected'
                  : connection === 'offline' ? 'Reconnecting…'
                    : connection === 'gone' ? 'Room closed' : 'Connecting…'}
            </span>
            <button type="button" className="vg-btn vg-btn--ghost" onClick={leave}>Leave</button>
          </div>
        </header>

        {loser && !closed && (
          <p className={`Cf-banner ${loser === myId ? 'is-loss' : 'is-win'}`} role="status">
            {loser === myId ? `You have ${DAMAGE_TO_LOSE} damage. ${opp.name} wins!` : `${opp.name} has ${DAMAGE_TO_LOSE} damage. You win!`}
          </p>
        )}

        <div className="TestHand-main">
          <div className="TestHand-table">
            <div className="TestHand-table-inner Cf-table">
              <div className="Cf-opponent">
                <div className="Cf-opp-bar">
                  <strong>{opp.name}</strong>
                  {oppInfo && (
                    <span className={`Cf-dot ${oppInfo.connected ? 'is-on' : ''}`} title={oppInfo.connected ? 'Connected' : 'Not connected'} />
                  )}
                  <span className="Cf-muted">{oppInfo?.deckName}</span>
                  <span className="Cf-opp-hand" title={`${opp.name}'s hand`}>
                    Hand <strong>{opp.zones[ZONE.HAND].length}</strong>
                  </span>
                </div>
                <PlayerBoard
                  player={opp}
                  playerId={oppId}
                  perspective="opponent"
                  onOpenZone={(zone) => PUBLIC_ZONES.includes(zone) && setOppViewer(zone)}
                />
              </div>

              <PlayerBoard
                player={me}
                playerId={myId}
                onOpenZone={tools.openZone}
                onDeckActivate={() => act(actions.draw())}
                onDeckContextMenu={tools.openDeckMenu}
                onRideDeckActivate={() => act(actions.rideFromRideDeck())}
              />

              <div className="TestHand-action-slot" onClick={(e) => e.stopPropagation()}>
                {interaction.selection ? (
                  <CardActionBar players={game.players} dispatchFor={dispatchFor} onShowInfo={setInfoCard} />
                ) : (
                  <p className="TestHand-tip">
                    Drag cards between zones, or tap a card for its actions. Tap your opponent’s cards to read them.
                  </p>
                )}
              </div>

              <Hand playerId={myId} cards={me.zones[ZONE.HAND]}>
                {preGame && mulliganMarks.length > 0 && (
                  <span className="TestHand-hand-note">{mulliganMarks.length} marked for redraw</span>
                )}
              </Hand>
            </div>
          </div>

          <aside className="TestHand-side" onClick={(e) => e.stopPropagation()}>
            <ActionToolbar groups={tools.toolbarGroups} className="TestHand-toolbar" />
            <div className="TestHand-preview">
              <CardPreview card={interaction.previewCard} />
            </div>
          </aside>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          {tools.overlays}

          {oppViewer && (
            <PileViewer
              playerId={oppId}
              zone={oppViewer}
              cards={[...opp.zones[oppViewer]].reverse()}
              title={`${opp.name}'s ${zoneLabel(oppViewer)} (${opp.zones[oppViewer].length})`}
              subtitle="Your opponent's cards – tap one to read it."
              onClose={() => setOppViewer(null)}
            />
          )}

          {infoCard && (
            <Modal title={infoCard.name || 'Card'} onClose={() => setInfoCard(null)} size="md">
              <CardPreview card={infoCard} compact />
            </Modal>
          )}

          {closed && (
            <Modal title="Cardfight over" onClose={() => navigate('/cardfight')} size="md">
              <p className="Cf-modal-text">{room.closedReason || 'This cardfight has ended.'}</p>
              <div className="Cf-modal-actions">
                <button type="button" className="vg-btn vg-btn--primary" onClick={() => { forgetSeat(room.id); navigate('/cardfight'); }}>
                  Back to rooms
                </button>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </BoardInteractionContext.Provider>
  );
}
