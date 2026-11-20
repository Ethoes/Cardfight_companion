// Helpers for card data coming from the API and the in-game card instances
// that wrap them. A card instance is one physical copy on the table:
//   { uid, card, rested, faceDown }

let uidCounter = 0;

export function createCardInstance(card, ownerId = 'p1') {
  uidCounter += 1;
  return {
    uid: `${ownerId}-${uidCounter}-${card?.id ?? 'x'}`,
    card,
    rested: false,
    faceDown: false,
    powerMod: 0,
    boosting: false,
  };
}

/** Reset per-zone flags (and power changes) when a card changes zone. */
export const freshInstance = (instance, flags = {}) => ({
  ...instance,
  rested: false,
  faceDown: false,
  check: null,
  powerMod: 0,
  boosting: false,
  ...flags,
});

export function gradeOf(card) {
  if (!card) return null;
  const raw = card.card_grade ?? card.grade;
  if (raw === null || raw === undefined) return null;
  const match = String(raw).match(/\d+/);
  return match ? Number(match[0]) : null;
}

export const isGUnit = (card) => card?.type === 'G Unit';
export const isRideDeckCrest = (card) => card?.type === 'Ride Deck Crest';
export const isTrigger = (card) => card?.type === 'Trigger Unit' || card?.type === 'Trigger Order';
export const isOrder = (card) => /order/i.test(card?.type ?? '');

export function numericStat(value) {
  if (value === null || value === undefined) return 0;
  const match = String(value).replace(/,/g, '').match(/-?\d+/);
  return match ? Number(match[0]) : 0;
}

export const shieldOf = (card) => numericStat(card?.shield);
export const powerOf = (card) => numericStat(card?.power);

export function cardImageSrc(card) {
  if (!card?.image) return null;
  if (String(card.image).startsWith('data:')) return card.image;
  return `data:image/jpeg;base64,${card.image}`;
}
