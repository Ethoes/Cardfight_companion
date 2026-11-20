import React, { useState } from 'react';
import { ZONE, actions, topCards, zoneLabel } from '../engine';
import PileViewer from '../components/PileViewer';
import { ContextMenu } from '../components/Overlays';

/**
 * The controls one player uses on their own board: the deck / field / cost
 * toolbar, the pile viewers (zone, look at top N, search deck) and the deck's
 * right-click menu. Shared by the solo test hand and online cardfights.
 *
 * @param {object}   player    the player's state
 * @param {string}   playerId
 * @param {Function} act       dispatches a player action for this player
 */
export default function usePlayerTools({ player, playerId, act }) {
  const [viewer, setViewer] = useState(null); // { type: 'zone', zone } | { type: 'top' } | { type: 'search' }
  const [topCount, setTopCount] = useState(3);
  const [deckMenu, setDeckMenu] = useState(null); // { x, y }

  const z = player.zones;
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

  const openZone = (zone) => setViewer({ type: 'zone', zone });

  const openDeckMenu = (e) => {
    e.preventDefault();
    setDeckMenu({ x: e.clientX, y: e.clientY });
  };

  const closeAll = () => {
    setViewer(null);
    setDeckMenu(null);
  };

  const renderViewer = () => {
    if (!viewer) return null;
    const close = () => setViewer(null);

    if (viewer.type === 'top') {
      const count = Math.max(1, Math.min(topCount, z[ZONE.DECK].length || 1));
      return (
        <PileViewer
          playerId={playerId}
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
          playerId={playerId}
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
        playerId={playerId}
        zone={viewer.zone}
        cards={zoneCards}
        title={`${zoneLabel(viewer.zone)} (${zoneCards.length})`}
        onClose={close}
      />
    );
  };

  const overlays = (
    <>
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
    </>
  );

  return { toolbarGroups, openZone, openDeckMenu, closeAll, overlays };
}
