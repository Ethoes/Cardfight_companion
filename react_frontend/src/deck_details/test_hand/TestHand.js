import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ActionToolbar,
  BoardInteractionContext,
  CardActionBar,
  CardPreview,
  ContextMenu,
  Hand,
  Modal,
  PileViewer,
  PlayerBoard,
  TurnTracker,
  ZONE,
  actions,
  newSeed,
  nextPhase,
  setAutoPhaseActions,
  setPhase,
  topCards,
  useBoardInteraction,
  useCheckResolver,
  useGame,
  zoneLabel,
} from '../../game';
import './TestHand.css';

const PLAYER_ID = 'p1';
const PLAYER_IDS = [PLAYER_ID];
const EMPTY = [];

/**
 * Solo "goldfish" table for trying out a deck: one player, local state.
 * All game logic lives in src/game so a player-vs-player mode can reuse it.
 */
function TestHand() {
  const location = useLocation();
  const navigate = useNavigate();
  const { deck, cards, rideDeckCards } = location.state || {};
  const mainDeck = cards || EMPTY;
  const rideDeck = rideDeckCards || EMPTY;

  const buildPlayers = useCallback(() => [{
    id: PLAYER_ID,
    name: 'You',
    mainDeck,
    rideDeck,
    seed: newSeed(),
  }], [mainDeck, rideDeck]);

  const { game, dispatch, dispatchFor, undo, redo, reset, canUndo, canRedo } = useGame(buildPlayers);
  const player = game.players[PLAYER_ID];
  const act = dispatchFor(PLAYER_ID);
  const z = player.zones;

  // ---- local UI state ------------------------------------------------------
  const [viewer, setViewer] = useState(null); // { type: 'zone', zone } | { type: 'top' } | { type: 'search' }
  const [topCount, setTopCount] = useState(3);
  const [deckMenu, setDeckMenu] = useState(null); // { x, y }
  const [infoCard, setInfoCard] = useState(null);
  const [mulliganMarks, setMulliganMarks] = useState([]);

  const preGame = !player.stoodUp;

  // Drive / damage checks sit in the trigger zone for 2s, then move on.
  useCheckResolver(game.players, dispatchFor, PLAYER_IDS);

  const interceptCardClick = useCallback((playerId, instance, zone) => {
    if (!preGame || zone !== ZONE.HAND) return false;
    setMulliganMarks((marks) => (marks.includes(instance.uid)
      ? marks.filter((uid) => uid !== instance.uid)
      : [...marks, instance.uid]));
    return true;
  }, [preGame]);

  const interaction = useBoardInteraction({
    dispatchFor,
    interactivePlayers: PLAYER_IDS,
    interceptCardClick,
    markedUids: preGame ? mulliganMarks : EMPTY,
  });

  // ---- game actions --------------------------------------------------------
  const startGame = () => {
    if (mulliganMarks.length) act(actions.mulligan(mulliganMarks));
    act(actions.standUp());
    setMulliganMarks([]);
  };

  const newGame = () => {
    reset();
    setViewer(null);
    setMulliganMarks([]);
    interaction.clearSelection();
  };

  const openDeckMenu = (e) => {
    e.preventDefault();
    setDeckMenu({ x: e.clientX, y: e.clientY });
  };

  const deckEmpty = z[ZONE.DECK].length === 0;
  const deckActions = [
    { label: 'Draw', onClick: () => act(actions.draw()), disabled: deckEmpty, title: 'Draw the top card of your deck' },
    { label: 'Drive check', onClick: () => act(actions.driveCheck()), disabled: deckEmpty, title: 'Reveal the top card in the trigger zone, then add it to your hand' },
    { label: 'Damage check', onClick: () => act(actions.damageCheck()), disabled: deckEmpty, title: 'Reveal the top card in the trigger zone, then put it into your damage zone' },
    { label: 'Soul charge', onClick: () => act(actions.soulCharge()), disabled: deckEmpty, title: 'Put the top card of your deck into your soul' },
    { label: 'Look at top…', onClick: () => setViewer({ type: 'top' }), disabled: deckEmpty },
    { label: 'Search deck', onClick: () => setViewer({ type: 'search' }), disabled: deckEmpty },
    { label: 'Shuffle', onClick: () => act(actions.shuffleDeck()), disabled: deckEmpty },
  ];

  const faceUpDamage = z[ZONE.DAMAGE].filter((c) => !c.faceDown).length;
  const faceDownDamage = z[ZONE.DAMAGE].length - faceUpDamage;

  const toolbarGroups = [
    { label: 'Deck', actions: deckActions },
    {
      label: 'Field',
      actions: [
        {
          label: `Ride${z[ZONE.RIDE_DECK].length ? ` (${z[ZONE.RIDE_DECK].length})` : ''}`,
          onClick: () => act(actions.rideFromRideDeck()),
          disabled: !z[ZONE.RIDE_DECK].length,
          tone: 'accent',
          title: 'Ride the next card of your ride deck (discard a card from hand as the cost)',
        },
        { label: 'Stand all', onClick: () => act(actions.standAll()), title: 'Stand all your units' },
        {
          label: 'Drive checks → hand',
          onClick: () => act(actions.resolveDriveChecks()),
          disabled: !z[ZONE.TRIGGER].length,
        },
        {
          label: 'Retire guardians',
          onClick: () => act(actions.retireGuardians()),
          disabled: !z[ZONE.GUARDIAN].length,
          title: 'Put all cards on the guardian circle into the drop zone',
        },
      ],
    },
    {
      label: 'Cost',
      actions: [
        { label: 'Counter blast 1', onClick: () => act(actions.counterBlast(1)), disabled: !faceUpDamage },
        { label: 'Counter charge 1', onClick: () => act(actions.counterCharge(1)), disabled: !faceDownDamage },
        { label: 'Soul blast 1', onClick: () => act(actions.moveTopCards(ZONE.SOUL, ZONE.DROP, 1)), disabled: !z[ZONE.SOUL].length },
      ],
    },
  ];

  // ---- viewer --------------------------------------------------------------
  const renderViewer = () => {
    if (!viewer) return null;
    const close = () => setViewer(null);

    if (viewer.type === 'top') {
      const count = Math.max(1, Math.min(topCount, z[ZONE.DECK].length || 1));
      return (
        <PileViewer
          playerId={PLAYER_ID}
          zone={ZONE.DECK}
          cards={topCards(player, ZONE.DECK, count)}
          title={`Top ${count} of your deck`}
          onClose={close}
          headerControls={(
            <label>
              Look at the top{' '}
              <input
                type="number"
                min={1}
                max={z[ZONE.DECK].length}
                value={topCount}
                onChange={(e) => setTopCount(Number(e.target.value) || 1)}
              />{' '}
              cards
            </label>
          )}
          actions={(
            <>
              <button type="button" className="vg-btn" onClick={() => { act(actions.shuffleDeck()); close(); }}>Shuffle deck</button>
              <button type="button" className="vg-btn vg-btn--primary" onClick={close}>Done</button>
            </>
          )}
        />
      );
    }

    if (viewer.type === 'search') {
      return (
        <PileViewer
          playerId={PLAYER_ID}
          zone={ZONE.DECK}
          cards={[...z[ZONE.DECK]].reverse()}
          title={`Search deck (${z[ZONE.DECK].length})`}
          onClose={close}
          actions={(
            <>
              <button type="button" className="vg-btn" onClick={close}>Close without shuffling</button>
              <button type="button" className="vg-btn vg-btn--primary" onClick={() => { act(actions.shuffleDeck()); close(); }}>
                Shuffle &amp; close
              </button>
            </>
          )}
        />
      );
    }

    const zoneCards = [...z[viewer.zone]].reverse();
    return (
      <PileViewer
        playerId={PLAYER_ID}
        zone={viewer.zone}
        cards={zoneCards}
        title={`${zoneLabel(viewer.zone)} (${zoneCards.length})`}
        onClose={close}
      />
    );
  };

  // ---- render --------------------------------------------------------------
  if (!deck || !cards) {
    return (
      <div className="vg-root TestHand TestHand--empty">
        <div className="TestHand-empty">
          <h2>No deck selected</h2>
          <p>Open one of your decks and press <strong>Test Hand</strong> to try it out here.</p>
          <button type="button" className="vg-btn vg-btn--primary" onClick={() => navigate('/view-user-decks')}>
            Go to my decks
          </button>
        </div>
      </div>
    );
  }

  return (
    <BoardInteractionContext.Provider value={interaction}>
      <div className="vg-root TestHand" onClick={() => interaction.clearSelection()}>
        <header className="TestHand-header" onClick={(e) => e.stopPropagation()}>
          <div className="TestHand-heading">
            <span className="TestHand-eyebrow">Test hand</span>
            <h1 className="TestHand-title">{deck.name || deck.deck_name || 'Untitled deck'}</h1>
          </div>

          <div className="TestHand-status">
            {preGame ? (
              <div className="TestHand-mulligan">
                <p>
                  <strong>Mulligan:</strong> tap the cards you want to return to your deck, then stand up.
                </p>
                <button type="button" className="vg-btn vg-btn--primary" onClick={startGame}>
                  {mulliganMarks.length
                    ? `Redraw ${mulliganMarks.length} & Stand up, Vanguard!`
                    : 'Keep hand & Stand up, Vanguard!'}
                </button>
              </div>
            ) : (
              <TurnTracker
                turn={game.turn}
                onNextPhase={() => dispatch(nextPhase())}
                onSetPhase={(phase) => dispatch(setPhase(phase))}
                autoPhase={game.settings.autoPhaseActions}
                onToggleAuto={(enabled) => dispatch(setAutoPhaseActions(enabled))}
              />
            )}
          </div>

          <div className="TestHand-controls">
            <button type="button" className="vg-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">Undo</button>
            <button type="button" className="vg-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">Redo</button>
            <button type="button" className="vg-btn" onClick={newGame} title="Shuffle and deal a new opening hand">New game</button>
            <button
              type="button"
              className="vg-btn vg-btn--ghost"
              onClick={() => navigate('/deck-details', { state: { deck } })}
            >
              Back to deck
            </button>
          </div>
        </header>

        <div className="TestHand-main">
          <div className="TestHand-table">
            <div className="TestHand-table-inner">
              <PlayerBoard
                player={player}
                playerId={PLAYER_ID}
                onOpenZone={(zone) => setViewer({ type: 'zone', zone })}
                onDeckActivate={() => act(actions.draw())}
                onDeckContextMenu={openDeckMenu}
                onRideDeckActivate={() => act(actions.rideFromRideDeck())}
              />

              <div className="TestHand-action-slot" onClick={(e) => e.stopPropagation()}>
                {interaction.selection ? (
                  <CardActionBar players={game.players} dispatchFor={dispatchFor} onShowInfo={setInfoCard} />
                ) : (
                  <p className="TestHand-tip">
                    Drag cards between zones, or tap a card for its actions.
                    Shortcut: right-click a unit to rest / stand it, or a damage card to counter blast it.
                  </p>
                )}
              </div>

              <Hand playerId={PLAYER_ID} cards={z[ZONE.HAND]}>
                {preGame && mulliganMarks.length > 0 && (
                  <span className="TestHand-hand-note">{mulliganMarks.length} marked for redraw</span>
                )}
              </Hand>
            </div>
          </div>

          <aside className="TestHand-side" onClick={(e) => e.stopPropagation()}>
            <ActionToolbar groups={toolbarGroups} className="TestHand-toolbar" />
            <div className="TestHand-preview">
              <CardPreview card={interaction.previewCard} />
            </div>
          </aside>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          {renderViewer()}

          {deckMenu && (
            <ContextMenu
              x={deckMenu.x}
              y={deckMenu.y}
              title={`Deck · ${z[ZONE.DECK].length} cards`}
              onClose={() => setDeckMenu(null)}
              items={[
                ...deckActions.map((a) => ({ label: a.label, onSelect: a.onClick, disabled: a.disabled })),
                { divider: true, key: 'd1' },
                { label: 'Top card → drop zone', onSelect: () => act(actions.millTop()), disabled: deckEmpty },
                { label: 'Top card → bind zone', onSelect: () => act(actions.moveTopCards(ZONE.DECK, ZONE.BIND)), disabled: deckEmpty },
              ]}
            />
          )}

          {infoCard && (
            <Modal title={infoCard.name || 'Card'} onClose={() => setInfoCard(null)} size="md">
              <CardPreview card={infoCard} compact />
            </Modal>
          )}
        </div>
      </div>
    </BoardInteractionContext.Provider>
  );
}

export default TestHand;
