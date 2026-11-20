// Building a player's starting board from a deck list.
//
// Pile convention used everywhere in the engine:
//   the LAST element of a zone array is the TOP card of that pile.

import { ALL_ZONES, ZONE, STARTING_HAND_SIZE } from './constants';
import { createCardInstance, gradeOf, isGUnit, isRideDeckCrest, isTrigger } from './cards';
import { shuffle } from './random';

export function emptyZones() {
  return ALL_ZONES.reduce((zones, zone) => ({ ...zones, [zone]: [] }), {});
}

/**
 * @param {object}   options
 * @param {object[]} options.mainDeck   cards from /api/decks/:id/cards
 * @param {object[]} options.rideDeck   cards from /api/decks/:id/ride-deck
 * @param {number}   options.seed       seed for the opening shuffle
 * @param {string}   options.playerId
 * @param {number}   options.handSize
 */
export function createPlayerState({
  mainDeck = [],
  rideDeck = [],
  seed,
  playerId = 'p1',
  handSize = STARTING_HAND_SIZE,
}) {
  const zones = emptyZones();
  let index = 0;
  const make = (card) => {
    index += 1;
    return createCardInstance(card, playerId, index);
  };

  // G units live in the G zone, Ride Deck Crests start in the order zone.
  const mainInstances = [];
  mainDeck.forEach((card) => {
    if (isGUnit(card)) zones[ZONE.G_ZONE].push(make(card));
    else if (isRideDeckCrest(card)) zones[ZONE.ORDER].push(make(card));
    else mainInstances.push(make(card));
  });

  // Ride deck: lowest grade ends on top (= last element).
  const rideUnits = [];
  rideDeck.forEach((card) => {
    if (isRideDeckCrest(card)) zones[ZONE.ORDER].push(make(card));
    else rideUnits.push(make(card));
  });
  rideUnits.sort((a, b) => (gradeOf(b.card) ?? 99) - (gradeOf(a.card) ?? 99));

  // First vanguard: the grade 0 from the ride deck (Standard), otherwise the
  // first non-trigger grade 0 from the main deck (Premium). It is placed face
  // down until "Stand up, Vanguard!".
  let starter = null;
  const topRide = rideUnits[rideUnits.length - 1];
  if (topRide && gradeOf(topRide.card) === 0) {
    starter = rideUnits.pop();
  } else {
    const index = mainInstances.findIndex((i) => gradeOf(i.card) === 0 && !isTrigger(i.card));
    if (index >= 0) [starter] = mainInstances.splice(index, 1);
  }
  if (starter) zones[ZONE.VC].push({ ...starter, faceDown: true });

  zones[ZONE.RIDE_DECK] = rideUnits;

  const shuffled = shuffle(mainInstances, seed);
  const hand = shuffled.splice(shuffled.length - handSize, handSize).reverse();
  zones[ZONE.DECK] = shuffled;
  zones[ZONE.HAND] = hand;

  return {
    id: playerId,
    zones,
    stoodUp: false,
    mulliganDone: false,
  };
}
