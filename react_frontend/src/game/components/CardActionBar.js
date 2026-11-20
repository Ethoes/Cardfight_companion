import React from 'react';
import { ZONE, actions, findCard, isCircle, isOrder, zoneLabel } from '../engine';
import { useInteraction } from '../hooks/useBoardInteraction';

/**
 * Contextual actions for the selected card. This is what makes the board
 * fully usable on touch screens (no drag-and-drop or right-click needed).
 */
export default function CardActionBar({ players, dispatchFor, onShowInfo }) {
  const ctx = useInteraction();
  const selection = ctx?.selection;
  if (!selection) return null;

  const player = players[selection.playerId];
  const found = player && findCard(player, selection.uid);
  if (!found) return null;

  const { zone, instance } = found;
  const dispatch = dispatchFor(selection.playerId);
  const move = (to, options) => {
    dispatch(actions.moveCard(instance.uid, to, options));
    ctx.clearSelection();
  };

  const onField = isCircle(zone) || zone === ZONE.GUARDIAN;
  const card = instance.card;

  const destinations = [
    { to: ZONE.VC, label: 'Ride', hint: 'Ride onto the vanguard circle (old vanguard goes to soul)' },
    { to: ZONE.GUARDIAN, label: 'Guard', hint: 'Call to the guardian circle', only: [ZONE.HAND] },
    { to: ZONE.HAND, label: 'Hand' },
    { to: ZONE.DROP, label: onField ? 'Retire' : 'Drop', hint: 'Put into the drop zone' },
    { to: ZONE.SOUL, label: 'Soul' },
    { to: ZONE.DAMAGE, label: 'Damage' },
    { to: ZONE.ORDER, label: 'Order zone', show: isOrder(card) },
    { to: ZONE.BIND, label: 'Bind' },
    { to: ZONE.DECK, label: 'Deck top', options: { position: 'top' } },
    { to: ZONE.DECK, label: 'Deck bottom', options: { position: 'bottom' } },
  ].filter((d) => d.to !== zone || d.to === ZONE.DECK)
    .filter((d) => !d.only || d.only.includes(zone))
    .filter((d) => d.show !== false);

  return (
    <div className="vg-action-bar" role="toolbar" aria-label="Card actions">
      <div className="vg-action-bar__info">
        <strong className="vg-action-bar__name">{instance.faceDown && zone !== ZONE.DAMAGE ? 'Face-down card' : card?.name}</strong>
        <span className="vg-action-bar__zone">
          in {zoneLabel(zone)}
          {zone !== ZONE.VC && ' · tap a circle to call it there'}
        </span>
      </div>
      <div className="vg-action-bar__buttons">
        {onField && (
          <button type="button" className="vg-btn vg-btn--accent" onClick={() => dispatch(actions.toggleRest(instance.uid))}>
            {instance.rested ? 'Stand' : 'Rest'}
          </button>
        )}
        {zone === ZONE.DAMAGE && (
          <button type="button" className="vg-btn vg-btn--accent" onClick={() => dispatch(actions.toggleFaceDown(instance.uid))}>
            {instance.faceDown ? 'Counter charge' : 'Counter blast'}
          </button>
        )}
        {zone === ZONE.VC && instance.faceDown && (
          <button type="button" className="vg-btn vg-btn--accent" onClick={() => dispatch(actions.toggleFaceDown(instance.uid))}>
            Flip face up
          </button>
        )}
        {destinations.map((d) => (
          <button
            key={d.label}
            type="button"
            className="vg-btn"
            title={d.hint}
            onClick={() => move(d.to, d.options)}
          >
            {d.label}
          </button>
        ))}
        {onShowInfo && (
          <button type="button" className="vg-btn vg-btn--ghost vg-only-compact" onClick={() => onShowInfo(card)}>
            Info
          </button>
        )}
        <button type="button" className="vg-icon-btn" onClick={ctx.clearSelection} aria-label="Deselect card">✕</button>
      </div>
    </div>
  );
}
