import React from 'react';
import { BOOST_TARGET, ZONE, guardianShield, topCard, unitPower } from '../engine';
import { CardRow, Circle, DamageZone, Pile } from './Zones';

/**
 * One player's side of the table, laid out like the official play mat.
 *
 *   Order  | GC  GC  GC | Trigger | (G zone)
 *   Damage | RC  VC  RC | Deck    | Ride deck
 *   Damage | RC  RC  RC | Drop    | Bind
 *
 * The soul has no zone of its own: it is the chip on the vanguard circle.
 *
 * `perspective="opponent"` mirrors the layout so two boards can face each
 * other in a player-vs-player game. The hand is rendered separately so the
 * page decides where (and whether) to show it.
 */
export default function PlayerBoard({
  player,
  playerId,
  perspective = 'self',
  centerOnVanguard = true,
  onOpenZone,
  onDeckActivate,
  onDeckContextMenu,
  onRideDeckActivate,
}) {
  const z = player.zones;
  const shield = guardianShield(player);
  const open = (zone) => () => onOpenZone?.(zone);

  // Common props for a VC / RC: its unit's power, and whether it can boost.
  const circle = (zone) => {
    const unit = topCard(player, zone);
    const front = BOOST_TARGET[zone];
    return {
      playerId,
      zone,
      cards: z[zone],
      power: unitPower(player, zone),
      canBoost: Boolean(front && unit && !unit.faceDown && !unit.rested && !unit.boosting && z[front].length),
    };
  };

  return (
    <section className={`vg-board vg-board--${perspective} ${centerOnVanguard ? 'vg-board--centered' : ''}`} aria-label={`${player.name || playerId} field`}>
      <div className="vg-area vg-area--order">
        <CardRow
          playerId={playerId}
          zone={ZONE.ORDER}
          cards={z[ZONE.ORDER]}
          className="vg-row--side vg-row--order"
          onActivate={z[ZONE.ORDER].length ? open(ZONE.ORDER) : undefined}
        />
      </div>
      <div className="vg-area vg-area--gc">
        <CardRow
          playerId={playerId}
          zone={ZONE.GUARDIAN}
          cards={z[ZONE.GUARDIAN]}
          className="vg-row--guardian"
          footer={z[ZONE.GUARDIAN].length > 0 && (
            <span className="vg-row__footer">+{shield.toLocaleString()} shield</span>
          )}
        />
      </div>
      <div className="vg-area vg-area--trigger">
        <CardRow
          playerId={playerId}
          zone={ZONE.TRIGGER}
          cards={z[ZONE.TRIGGER]}
          className="vg-row--side vg-row--trigger"
        />
      </div>
      <div className="vg-area vg-area--gzone">
        {z[ZONE.G_ZONE].length > 0 && (
          <Pile
            playerId={playerId}
            zone={ZONE.G_ZONE}
            cards={z[ZONE.G_ZONE]}
            hidden
            tone="gzone"
            hint="click to view"
            onActivate={open(ZONE.G_ZONE)}
          />
        )}
      </div>

      <div className="vg-area vg-area--damage">
        <DamageZone playerId={playerId} cards={z[ZONE.DAMAGE]} onOpen={open(ZONE.DAMAGE)} />
      </div>
      <div className="vg-area vg-area--fl">
        <Circle {...circle(ZONE.RC_FRONT_LEFT)} />
      </div>
      <div className="vg-area vg-area--vc">
        <Circle
          {...circle(ZONE.VC)}
          variant="vc"
          soulCount={z[ZONE.SOUL].length}
          onOpenSoul={open(ZONE.SOUL)}
        />
      </div>
      <div className="vg-area vg-area--fr">
        <Circle {...circle(ZONE.RC_FRONT_RIGHT)} />
      </div>
      <div className="vg-area vg-area--deck">
        <Pile
          playerId={playerId}
          zone={ZONE.DECK}
          cards={z[ZONE.DECK]}
          hidden
          tone="deck"
          hint="click to draw, right-click for more"
          onActivate={onDeckActivate}
          onContextMenu={onDeckContextMenu}
        />
      </div>
      <div className="vg-area vg-area--ride">
        <Pile
          playerId={playerId}
          zone={ZONE.RIDE_DECK}
          cards={z[ZONE.RIDE_DECK]}
          hidden
          tone="ride"
          hint="click to ride the next card"
          onActivate={onRideDeckActivate}
        />
      </div>

      <div className="vg-area vg-area--bl">
        <Circle {...circle(ZONE.RC_BACK_LEFT)} />
      </div>
      <div className="vg-area vg-area--bc">
        <Circle {...circle(ZONE.RC_BACK_CENTER)} />
      </div>
      <div className="vg-area vg-area--br">
        <Circle {...circle(ZONE.RC_BACK_RIGHT)} />
      </div>
      <div className="vg-area vg-area--drop">
        <Pile
          playerId={playerId}
          zone={ZONE.DROP}
          cards={z[ZONE.DROP]}
          tone="drop"
          hint="click to view"
          onActivate={open(ZONE.DROP)}
        />
      </div>
      <div className="vg-area vg-area--bind">
        <Pile
          playerId={playerId}
          zone={ZONE.BIND}
          cards={z[ZONE.BIND]}
          tone="bind"
          hint="click to view"
          onActivate={open(ZONE.BIND)}
        />
      </div>
    </section>
  );
}
