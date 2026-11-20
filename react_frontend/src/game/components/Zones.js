import React from 'react';
import { DAMAGE_TO_LOSE, ZONE, zoneLabel, zoneShort } from '../engine';
import DropTarget from './DropTarget';
import GameCard, { CardBack } from './GameCard';

const top = (cards) => (cards.length ? cards[cards.length - 1] : null);

export function CountBadge({ value, tone = 'default', title }) {
  return <span className={`vg-badge vg-badge--${tone}`} title={title}>{value}</span>;
}

/** Vanguard / rear-guard circle – holds a single unit. */
export function Circle({ playerId, zone, cards, soulCount, onOpenSoul, variant = 'rc' }) {
  const unit = top(cards);
  return (
    <DropTarget
      playerId={playerId}
      zone={zone}
      className={`vg-circle vg-circle--${variant}`}
      label={zoneLabel(zone)}
      title={zoneLabel(zone)}
    >
      <span className="vg-zone__label">{zoneShort(zone)}</span>
      {unit
        ? <GameCard instance={unit} zone={zone} playerId={playerId} />
        : <span className="vg-zone__placeholder" aria-hidden="true" />}
      {variant === 'vc' && soulCount > 0 && (
        <button
          type="button"
          className="vg-soul-chip"
          onClick={(e) => { e.stopPropagation(); onOpenSoul?.(); }}
          title="View soul"
        >
          Soul {soulCount}
        </button>
      )}
    </DropTarget>
  );
}

/**
 * A pile such as the deck, drop zone or ride deck. Shows the top card
 * (or a card back for hidden piles) and the number of cards.
 */
export function Pile({
  playerId,
  zone,
  cards,
  hidden = false,
  onActivate,
  onContextMenu,
  hint,
  tone = 'default',
  className = '',
  position = 'top',
}) {
  const card = top(cards);
  return (
    <DropTarget
      playerId={playerId}
      zone={zone}
      position={position}
      onActivate={onActivate}
      onContextMenu={onContextMenu}
      className={`vg-pile vg-pile--${tone} ${cards.length ? '' : 'is-empty'} ${className}`}
      label={zoneLabel(zone)}
      title={hint ? `${zoneLabel(zone)} – ${hint}` : zoneLabel(zone)}
    >
      <span className="vg-zone__label">{zoneShort(zone)}</span>
      <div className="vg-pile__stack">
        {card && cards.length > 1 && <div className="vg-pile__shadow" aria-hidden="true" />}
        {card && (hidden
          ? <CardBack />
          : <GameCard instance={{ ...card, rested: false }} zone={zone} playerId={playerId} showRest={false} />)}
        {!card && <span className="vg-zone__placeholder" aria-hidden="true" />}
      </div>
      <CountBadge value={cards.length} tone={tone} />
    </DropTarget>
  );
}

/** Damage zone: cards lie sideways, face-down cards are counter-blasted. */
export function DamageZone({ playerId, cards, onOpen }) {
  const faceUp = cards.filter((c) => !c.faceDown).length;
  const danger = cards.length >= DAMAGE_TO_LOSE - 1;
  return (
    <DropTarget
      playerId={playerId}
      zone={ZONE.DAMAGE}
      className={`vg-damage ${danger ? 'is-danger' : ''}`}
      label={zoneLabel(ZONE.DAMAGE)}
      title="Damage Zone – right-click a card to counter blast / counter charge it"
      onActivate={onOpen}
    >
      <div className="vg-damage__header">
        <span className="vg-zone__label">Damage</span>
        <CountBadge value={`${cards.length}/${DAMAGE_TO_LOSE}`} tone={danger ? 'danger' : 'default'} />
      </div>
      <div className="vg-damage__list">
        {cards.map((c) => (
          <div className="vg-damage__slot" key={c.uid}>
            <GameCard instance={c} zone={ZONE.DAMAGE} playerId={playerId} showRest={false} />
          </div>
        ))}
        {cards.length === 0 && <span className="vg-zone__empty">No damage</span>}
      </div>
      {cards.length > 0 && (
        <div className="vg-damage__footer" title="Face-up damage available for counter blast">
          CB available: <strong>{faceUp}</strong>
        </div>
      )}
    </DropTarget>
  );
}

/** A row of face-up cards (guardian circle, trigger zone, order zone…). */
export function CardRow({ playerId, zone, cards, footer, emptyText, className = '', onActivate }) {
  return (
    <DropTarget
      playerId={playerId}
      zone={zone}
      className={`vg-row ${className}`}
      label={zoneLabel(zone)}
      title={zoneLabel(zone)}
      onActivate={onActivate}
    >
      <span className="vg-zone__label">{zoneShort(zone)}</span>
      <div className="vg-row__cards">
        {cards.map((c) => (
          <GameCard key={c.uid} instance={c} zone={zone} playerId={playerId} />
        ))}
        {cards.length === 0 && emptyText && <span className="vg-zone__empty">{emptyText}</span>}
      </div>
      {footer}
    </DropTarget>
  );
}

/** The player's hand. Opponent hands render as card backs. */
export function Hand({ playerId, cards, hidden = false, children }) {
  return (
    <DropTarget playerId={playerId} zone={ZONE.HAND} className="vg-hand" label="Hand">
      <div className="vg-hand__header">
        <span className="vg-zone__label">Hand</span>
        <CountBadge value={cards.length} />
        {children}
      </div>
      <div className="vg-hand__cards" style={{ '--hand-count': cards.length }}>
        {cards.map((c) => (
          <GameCard key={c.uid} instance={c} zone={ZONE.HAND} playerId={playerId} hidden={hidden} />
        ))}
        {cards.length === 0 && <span className="vg-zone__empty">Your hand is empty</span>}
      </div>
    </DropTarget>
  );
}
