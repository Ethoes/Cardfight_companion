import React from 'react';
import { ZONE, guardianShield } from '../engine';
import { CardRow, Circle, DamageZone, Pile } from './Zones';

/**
 * One player's side of the table (the play mat).
 *
 *   Damage | Order  GC  Trigger | Deck
 *   Damage | RC     VC  RC      | Drop
 *   Soul   | RC     RC  RC      | Ride deck
 *   Bind
 *
 * `perspective="opponent"` mirrors the layout so two boards can face each
 * other in a player-vs-player game. The hand is rendered separately so the
 * page decides where (and whether) to show it.
 */
export default function PlayerBoard({
  player,
  playerId,
  perspective = 'self',
  onOpenZone,
  onDeckActivate,
  onDeckContextMenu,
  onRideDeckActivate,
}) {
  const z = player.zones;
  const shield = guardianShield(player);
  const open = (zone) => () => onOpenZone?.(zone);

  return (
    <section className={`vg-board vg-board--${perspective}`} aria-label={`${player.name || playerId} field`}>
      <div className="vg-area vg-area--damage">
        <DamageZone playerId={playerId} cards={z[ZONE.DAMAGE]} onOpen={open(ZONE.DAMAGE)} />
      </div>

      <div className="vg-area vg-area--top">
        <CardRow
          playerId={playerId}
          zone={ZONE.ORDER}
          cards={z[ZONE.ORDER]}
          className="vg-row--side"
          onActivate={z[ZONE.ORDER].length ? open(ZONE.ORDER) : undefined}
        />
        <CardRow
          playerId={playerId}
          zone={ZONE.GUARDIAN}
          cards={z[ZONE.GUARDIAN]}
          className="vg-row--guardian"
          footer={z[ZONE.GUARDIAN].length > 0 && (
            <span className="vg-row__footer">+{shield.toLocaleString()} shield</span>
          )}
        />
        <CardRow
          playerId={playerId}
          zone={ZONE.TRIGGER}
          cards={z[ZONE.TRIGGER]}
          className="vg-row--side vg-row--trigger"
        />
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

      <div className="vg-area vg-area--fl">
        <Circle playerId={playerId} zone={ZONE.RC_FRONT_LEFT} cards={z[ZONE.RC_FRONT_LEFT]} />
      </div>
      <div className="vg-area vg-area--vc">
        <Circle
          playerId={playerId}
          zone={ZONE.VC}
          cards={z[ZONE.VC]}
          variant="vc"
          soulCount={z[ZONE.SOUL].length}
          onOpenSoul={open(ZONE.SOUL)}
        />
      </div>
      <div className="vg-area vg-area--fr">
        <Circle playerId={playerId} zone={ZONE.RC_FRONT_RIGHT} cards={z[ZONE.RC_FRONT_RIGHT]} />
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

      <div className="vg-area vg-area--extra">
        <Pile
          playerId={playerId}
          zone={ZONE.SOUL}
          cards={z[ZONE.SOUL]}
          tone="soul"
          className="vg-pile--mini"
          hint="click to view"
          onActivate={open(ZONE.SOUL)}
        />
        <Pile
          playerId={playerId}
          zone={ZONE.BIND}
          cards={z[ZONE.BIND]}
          tone="bind"
          className="vg-pile--mini"
          hint="click to view"
          onActivate={open(ZONE.BIND)}
        />
        {z[ZONE.G_ZONE].length > 0 && (
          <Pile
            playerId={playerId}
            zone={ZONE.G_ZONE}
            cards={z[ZONE.G_ZONE]}
            hidden
            tone="gzone"
            className="vg-pile--mini"
            hint="click to view"
            onActivate={open(ZONE.G_ZONE)}
          />
        )}
      </div>
      <div className="vg-area vg-area--bl">
        <Circle playerId={playerId} zone={ZONE.RC_BACK_LEFT} cards={z[ZONE.RC_BACK_LEFT]} />
      </div>
      <div className="vg-area vg-area--bc">
        <Circle playerId={playerId} zone={ZONE.RC_BACK_CENTER} cards={z[ZONE.RC_BACK_CENTER]} />
      </div>
      <div className="vg-area vg-area--br">
        <Circle playerId={playerId} zone={ZONE.RC_BACK_RIGHT} cards={z[ZONE.RC_BACK_RIGHT]} />
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
    </section>
  );
}
