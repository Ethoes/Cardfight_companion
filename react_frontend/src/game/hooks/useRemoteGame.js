import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GAME_ACTION, gameReducer, playerAction } from '../engine';

let clientCounter = 0;
const newClientId = () => {
  clientCounter += 1;
  return `${Date.now().toString(36)}-${clientCounter}-${Math.random().toString(36).slice(2, 7)}`;
};

/**
 * Online game state, kept in sync through the room's action log.
 *
 *  - Every client starts from the same `initialGame` (same decks + seeds) and
 *    applies the server's log in order, so all clients end up identical.
 *  - Your own actions are applied immediately ("pending") and sent to the
 *    server; when the server echoes them back they become confirmed.
 *
 * @param {object}   options
 * @param {object}   options.transport  { postActions(entries), pollActions(since, wait) } – see fightApi
 * @param {object}   options.initialGame  createGameState(...) result, or null while loading
 * @param {string}   options.myId       this client's player id
 * @param {Function} options.onRoom     called with the latest room info from each poll
 */
export default function useRemoteGame({ transport, initialGame, myId, onRoom }) {
  const [confirmed, setConfirmed] = useState({ game: initialGame, seq: 0 });
  const [pending, setPending] = useState([]); // [{ clientId, action }]
  const [connection, setConnection] = useState('connecting'); // connecting | online | offline | gone

  const confirmedRef = useRef(confirmed);
  const outbox = useRef([]);
  const sending = useRef(false);
  const onRoomRef = useRef(onRoom);
  onRoomRef.current = onRoom;

  // (Re)start from the initial state once it is available.
  useEffect(() => {
    const start = { game: initialGame, seq: 0 };
    confirmedRef.current = start;
    setConfirmed(start);
    setPending([]);
  }, [initialGame]);

  // ---- receive ---------------------------------------------------------------
  useEffect(() => {
    if (!initialGame) return undefined;
    let alive = true;
    let first = true; // answer straight away the first time, then long-poll

    const loop = async () => {
      while (alive) {
        try {
          const { entries, room } = await transport.pollActions(confirmedRef.current.seq, first ? 0 : 20);
          first = false;
          if (!alive) return;
          setConnection('online');
          onRoomRef.current?.(room);

          if (entries.length) {
            let { game, seq } = confirmedRef.current;
            const mine = new Set();
            entries.forEach((entry) => {
              if (entry.seq !== seq) return; // already applied / out of order
              seq += 1;
              const { action } = entry;
              // A player may only act on their own board.
              if (action.type === GAME_ACTION.PLAYER && action.playerId !== entry.playerId) return;
              game = gameReducer(game, action);
              if (entry.playerId === myId && entry.clientId) mine.add(entry.clientId);
            });
            confirmedRef.current = { game, seq };
            setConfirmed(confirmedRef.current);
            if (mine.size) setPending((list) => list.filter((p) => !mine.has(p.clientId)));
          }
          if (room?.status === 'closed') return;
        } catch (err) {
          if (!alive) return;
          if (err.status === 404 || err.status === 403) {
            setConnection('gone');
            return;
          }
          setConnection('offline');
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    };
    loop();
    return () => { alive = false; };
  }, [initialGame, transport, myId]);

  // ---- send ------------------------------------------------------------------
  const flush = useCallback(async () => {
    if (sending.current) return;
    sending.current = true;
    try {
      while (outbox.current.length) {
        const batch = outbox.current.slice(0, 50);
        try {
          await transport.postActions(batch);
          outbox.current = outbox.current.slice(batch.length);
        } catch (err) {
          if (err.status && err.status < 500) {
            // Rejected (game over, room gone…): drop these actions.
            const dropped = new Set(batch.map((b) => b.clientId));
            outbox.current = outbox.current.slice(batch.length);
            setPending((list) => list.filter((p) => !dropped.has(p.clientId)));
          } else {
            setConnection('offline');
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
      }
    } finally {
      sending.current = false;
    }
  }, [transport]);

  /** Dispatch a game-level action (e.g. nextPhase, or playerAction(myId, …)). */
  const dispatch = useCallback((action) => {
    const entry = { clientId: newClientId(), action };
    setPending((list) => [...list, entry]);
    outbox.current.push(entry);
    flush();
  }, [flush]);

  /** Same signature as useGame's dispatchFor; only your own board can be changed. */
  const dispatchFor = useCallback(
    (playerId) => (action) => {
      if (playerId !== myId) return;
      dispatch(playerAction(playerId, action));
    },
    [dispatch, myId],
  );

  const game = useMemo(() => {
    if (!confirmed.game) return null;
    return pending.reduce((g, p) => gameReducer(g, p.action), confirmed.game);
  }, [confirmed, pending]);

  return { game, dispatch, dispatchFor, connection, pendingCount: pending.length };
}
