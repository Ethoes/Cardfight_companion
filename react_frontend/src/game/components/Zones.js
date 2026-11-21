import React, { useState } from 'react';
import { DAMAGE_TO_LOSE, POWER_STEP, ZONE, actions, zoneLabel, zoneShort } from '../engine';
import { useInteraction } from '../hooks/useBoardInteraction';
import DropTarget from './DropTarget';
import GameCard, { CardBack } from './GameCard';

const top = (cards) => (cards.length ? cards[cards.length - 1] : null);

export function CountBadge({ value, tone = 'default', title }) {
  return <span className={`vg-badge vg-badge--${tone}`} title={title}>{value}</span>;
}

const fmt = (n) => n.toLocaleString('en-US');
const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${fmt(Math.abs(n))}`;

/**
 * Parse the custom power field: "+3000" / "-3000" adjust the power,
 * a plain number ("23000") sets the total to that value.
 */
function parsePowerInput(text, total) {
  const clean = text.replace(/[\s,.]/g, '').replace(/[−–]/g, '-');
  const match = clean.match(/^([+-]?)(\d+)(k?)$/i);
  if (!match) return null;
  const value = Number(match[2]) * (match[3] ? 1000 : 1);
  if (match[1] === '+') return value;
  if (match[1] === '-') return -value;
  return value - total;
}

/**
 * Power shown at the bottom of a circle, with quick ±5000 buttons
 * (shift-click for ±10000) and a custom amount when the number is clicked.
 */
export function PowerBadge({ playerId, unit, power }) {
  const ctx = useInteraction();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const editable = Boolean(ctx?.isInteractive(playerId));
  const { base, mod, boost, total } = power;
  const change = mod + boost;
  const tone = mod > 0 || (mod === 0 && boost > 0) ? 'up' : mod < 0 ? 'down' : 'base';

  const adjust = (delta) => ctx.act(playerId, actions.adjustPower(unit.uid, delta));
  const step = (sign) => (e) => {
    e.stopPropagation();
    adjust(sign * POWER_STEP * (e.shiftKey ? 2 : 1));
  };
  const commit = () => {
    const delta = parsePowerInput(text, total);
    if (delta) adjust(delta);
    setEditing(false);
    setText('');
  };

  const breakdown = [
    `Base ${fmt(base)}`,
    mod ? `${signed(mod)} power` : null,
    boost ? `${signed(boost)} boost` : null,
  ].filter(Boolean).join(' · ');

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className={`vg-power vg-power--${tone} ${boost ? 'is-boosted' : ''}`} onClick={(e) => e.stopPropagation()}>
      {editable && !editing && (
        <button type="button" className="vg-power__btn" onClick={step(-1)} title="−5,000 power (shift: −10,000)" aria-label="Decrease power by 5000">−</button>
      )}
      {editing ? (
        <input
          className="vg-power__input"
          autoFocus
          inputMode="numeric"
          value={text}
          placeholder={fmt(total)}
          aria-label="Custom power: +3000 / -3000 to adjust, or a number to set the total"
          title="+3000 / -3000 to adjust, or type the new total"
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setEditing(false); setText(''); }
          }}
        />
      ) : (
        <button
          type="button"
          className="vg-power__value"
          disabled={!editable}
          onClick={() => setEditing(true)}
          title={`${breakdown}${change ? ` = ${fmt(total)}` : ''}${editable ? ' (click to enter a custom amount)' : ''}`}
        >
          {fmt(total)}
        </button>
      )}
      {editable && !editing && (
        <button type="button" className="vg-power__btn" onClick={step(1)} title="+5,000 power (shift: +10,000)" aria-label="Increase power by 5000">+</button>
      )}
    </div>
  );
}

/** Vanguard / rear-guard circle – holds a single unit. */
export function Circle({ playerId, zone, cards, soulCount, onOpenSoul, variant = 'rc', power, canBoost }) {
  const ctx = useInteraction();
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
      {variant === 'vc' && (
        <DropTarget
          playerId={playerId}
          zone={ZONE.SOUL}
          className={`vg-soul-chip ${soulCount ? '' : 'is-empty'}`}
          label={`Soul, ${soulCount} cards`}
          title="Soul: click to view, or drop a card here to put it into the soul"
          onActivate={() => onOpenSoul?.()}
        >
          Soul {soulCount}
        </DropTarget>
      )}
      {canBoost && ctx?.isInteractive(playerId) && (
        <button
          type="button"
          className="vg-boost-chip"
          onClick={(e) => { e.stopPropagation(); ctx.act(playerId, actions.setBoost(unit.uid)); }}
          title="Boost: rest this unit and add its power to the unit in front of it"
        >
          Boost ▲
        </button>
      )}
      {unit?.boosting && <span className="vg-boost-flag" aria-label="Boosting">▲ Boosting</span>}
      {unit && power && <PowerBadge playerId={playerId} unit={unit} power={power} />}
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
