import React, { useEffect } from 'react';
import { BOOST_TARGET, POWER_STEP, ZONE, actions, findCard, isCircle, isOrder, zoneLabel } from '../engine';
import { useInteraction } from '../hooks/useBoardInteraction';

const POWER_BUTTONS = [-2, -1, 1, 2].map((n) => n * POWER_STEP);
const short = (n) => `${n > 0 ? '+' : '−'}${Math.abs(n) / 1000}k`;

/** + / - keys change the selected unit's power by 5000 (shift: 10000). */
function usePowerShortcuts(ctx, players) {
  const selection = ctx?.selection;
  useEffect(() => {
    if (!selection || !isCircle(selection.zone)) return undefined;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      let sign = 0;
      if (['+', '='].includes(e.key) || e.code === 'NumpadAdd') sign = 1;
      if (['-', '_'].includes(e.key) || e.code === 'NumpadSubtract') sign = -1;
      if (!sign) return;
      e.preventDefault();
      ctx.act(selection.playerId, actions.adjustPower(selection.uid, sign * POWER_STEP * (e.shiftKey ? 2 : 1)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ctx, selection, players]);
}

/**
 * Contextual actions for the selected card. This is what makes the board
 * fully usable on touch screens (no drag-and-drop or right-click needed).
 */
export default function CardActionBar({ players, dispatchFor, onShowInfo }) {
  const ctx = useInteraction();
  usePowerShortcuts(ctx, players);
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
        {isCircle(zone) && !instance.faceDown && (
          <div className="vg-action-bar__power" role="group" aria-label="Power" title="Power (keys: + / −, shift for 10k)">
            {POWER_BUTTONS.map((delta) => (
              <button
                key={delta}
                type="button"
                className={`vg-btn vg-btn--power ${delta > 0 ? 'is-up' : 'is-down'}`}
                onClick={() => dispatch(actions.adjustPower(instance.uid, delta))}
                aria-label={`${delta > 0 ? 'Increase' : 'Decrease'} power by ${Math.abs(delta)}`}
              >
                {short(delta)}
              </button>
            ))}
            {instance.powerMod !== 0 && (
              <button type="button" className="vg-btn vg-btn--ghost" onClick={() => dispatch(actions.resetPower(instance.uid))}>
                Reset power
              </button>
            )}
          </div>
        )}
        {BOOST_TARGET[zone] && !instance.faceDown && (instance.boosting || player.zones[BOOST_TARGET[zone]].length > 0) && (
          <button
            type="button"
            className="vg-btn vg-btn--accent"
            onClick={() => dispatch(actions.setBoost(instance.uid, !instance.boosting))}
            title="Rest this unit and add its power to the unit in front of it"
          >
            {instance.boosting ? 'Stop boost' : 'Boost'}
          </button>
        )}
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
