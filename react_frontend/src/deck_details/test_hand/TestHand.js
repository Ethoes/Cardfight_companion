import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ActionToolbar,
  BoardInteractionContext,
  CardActionBar,
  CardPreview,
  Hand,
  Modal,
  PlayerBoard,
  TurnTracker,
  ZONE,
  actions,
  newSeed,
  nextPhase,
  setAutoPhaseActions,
  setPhase,
  useBoardInteraction,
  useCheckResolver,
  useGame,
  usePlayerTools,
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
  const tools = usePlayerTools({ player, playerId: PLAYER_ID, act });
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
    tools.closeAll();
    setMulliganMarks([]);
    interaction.clearSelection();
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
            <ActionToolbar groups={tools.toolbarGroups} className="TestHand-toolbar" />
            <div className="TestHand-preview">
              <CardPreview card={interaction.previewCard} />
            </div>
          </aside>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          {tools.overlays}

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
