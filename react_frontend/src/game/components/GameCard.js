import React from 'react';
import { CHECK_KIND, CHECK_REVEAL_MS, cardImageSrc } from '../engine';
import { useInteraction } from '../hooks/useBoardInteraction';

export function CardBack({ className = '', label }) {
  return (
    <div className={`vg-card-back ${className}`} aria-label={label || 'Face-down card'}>
      <span className="vg-card-back__emblem">V</span>
    </div>
  );
}

export function CardFace({ card }) {
  const src = cardImageSrc(card);
  if (!src) {
    return <div className="vg-card-face vg-card-face--text">{card?.name || 'Unknown card'}</div>;
  }
  return <img className="vg-card-face" src={src} alt={card?.name || 'Card'} draggable={false} />;
}

/** Label + shrinking bar on a drive / damage check waiting to resolve. */
function CheckCountdown({ check }) {
  const toDamage = check.kind === CHECK_KIND.DAMAGE;
  return (
    <div
      className={`vg-check-countdown vg-check-countdown--${check.kind}`}
      style={{ '--check-ms': `${CHECK_REVEAL_MS}ms` }}
      aria-live="polite"
    >
      <span>{toDamage ? 'To damage' : 'To hand'}</span>
      <i className="vg-check-countdown__bar" aria-hidden="true" />
    </div>
  );
}

/**
 * One card instance on the table.
 * Interaction (select, drag, rest/flip on right-click) comes from context so
 * the card can be dropped into any zone component.
 */
export default function GameCard({
  instance,
  zone,
  playerId,
  hidden = false,     // force the back to show (deck, opponent hand…)
  showRest = true,    // rotate when rested
  interactive = true,
  className = '',
  style,
}) {
  const ctx = useInteraction();
  if (!instance) return null;

  const faceDown = hidden || instance.faceDown;
  const canInteract = interactive && ctx;
  const selected = ctx?.selection?.uid === instance.uid;
  const marked = ctx?.markedUids?.has(instance.uid);
  const dragging = ctx?.dragging?.uid === instance.uid;

  const classes = [
    'vg-card',
    showRest && instance.rested ? 'is-rested' : '',
    selected ? 'is-selected' : '',
    marked ? 'is-marked' : '',
    dragging ? 'is-dragging' : '',
    canInteract ? 'is-interactive' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={style}
      draggable={Boolean(canInteract && ctx.isInteractive(playerId))}
      onDragStart={canInteract ? (e) => ctx.onCardDragStart(playerId, instance, zone, e) : undefined}
      onDragEnd={canInteract ? ctx.onDragEnd : undefined}
      onClick={canInteract ? (e) => ctx.onCardClick(playerId, instance, zone, e) : undefined}
      onContextMenu={canInteract ? (e) => ctx.onCardContextMenu(playerId, instance, zone, e) : undefined}
      onMouseEnter={canInteract && !hidden ? () => ctx.onCardHover(instance) : undefined}
      title={faceDown ? undefined : instance.card?.name}
      role={canInteract ? 'button' : undefined}
      tabIndex={canInteract ? 0 : undefined}
      onKeyDown={canInteract ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') ctx.onCardClick(playerId, instance, zone, e);
      } : undefined}
    >
      <div className="vg-card__inner">
        {faceDown ? <CardBack /> : <CardFace card={instance.card} />}
      </div>
      {instance.check && <CheckCountdown check={instance.check} />}
    </div>
  );
}
