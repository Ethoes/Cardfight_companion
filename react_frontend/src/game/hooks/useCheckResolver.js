import { useEffect, useRef } from 'react';
import { CHECK_REVEAL_MS, actions, pendingChecks } from '../engine';

/**
 * Resolves drive / damage checks automatically: a card revealed in the
 * trigger zone stays there for `delay` ms, then moves to its destination
 * (hand for drive checks, damage zone for damage checks).
 *
 * Each card gets its own timer, so a second check doesn't reset the first.
 * If the card is moved by hand before the timer fires, nothing happens.
 *
 * @param {object} players       game.players
 * @param {Function} dispatchFor (playerId) => dispatch
 * @param {string[]} playerIds   which players this client resolves for
 *                               (in an online match: only your own)
 */
export default function useCheckResolver(players, dispatchFor, playerIds, delay = CHECK_REVEAL_MS) {
  const timers = useRef(new Map()); // uid -> timeout id

  useEffect(() => {
    const pending = new Set();
    playerIds.forEach((playerId) => {
      const player = players[playerId];
      if (!player) return;
      pendingChecks(player).forEach((card) => {
        pending.add(card.uid);
        if (timers.current.has(card.uid)) return;
        const id = setTimeout(() => {
          timers.current.delete(card.uid);
          dispatchFor(playerId)(actions.resolveCheck(card.uid));
        }, delay);
        timers.current.set(card.uid, id);
      });
    });

    // Drop timers for cards that are no longer waiting (moved manually, undone…).
    timers.current.forEach((id, uid) => {
      if (!pending.has(uid)) {
        clearTimeout(id);
        timers.current.delete(uid);
      }
    });
  }, [players, dispatchFor, playerIds, delay]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((id) => clearTimeout(id));
      map.clear();
    };
  }, []);
}
