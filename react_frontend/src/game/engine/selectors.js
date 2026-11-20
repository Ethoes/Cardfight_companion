import { ALL_ZONES, CIRCLES, ZONE } from './constants';
import { shieldOf } from './cards';

/** Locate a card instance anywhere on a player's board. */
export function findCard(player, uid) {
  for (const zone of ALL_ZONES) {
    const cards = player.zones[zone];
    const index = cards.findIndex((c) => c.uid === uid);
    if (index >= 0) return { zone, index, instance: cards[index] };
  }
  return null;
}

export const topCard = (player, zone) => {
  const cards = player.zones[zone];
  return cards.length ? cards[cards.length - 1] : null;
};

/** Returns the top `count` cards, top card first. */
export const topCards = (player, zone, count) =>
  player.zones[zone].slice(-count).reverse();

export const zoneCount = (player, zone) => player.zones[zone].length;

export const vanguard = (player) => topCard(player, ZONE.VC);

export const faceUpDamage = (player) => player.zones[ZONE.DAMAGE].filter((c) => !c.faceDown).length;
export const faceDownDamage = (player) => player.zones[ZONE.DAMAGE].filter((c) => c.faceDown).length;

export const guardianShield = (player) =>
  player.zones[ZONE.GUARDIAN].reduce((sum, c) => sum + shieldOf(c.card), 0);

export const unitsOnField = (player) =>
  CIRCLES.map((zone) => topCard(player, zone)).filter(Boolean);

/** Cards in the trigger zone that are waiting to be resolved, oldest first. */
export const pendingChecks = (player) => player.zones[ZONE.TRIGGER].filter((c) => c.check);
