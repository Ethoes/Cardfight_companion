import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUserDecks } from '../api';
import { createRoom, getRoom, joinRoom, leaveRoom, listRooms, rememberSeat, forgetSeat } from './fightApi';
import '../game/components/game.css';
import './Cardfight.css';

const DECK_KEY = 'cardfight-deck';

function readSavedDeck() {
  try { return localStorage.getItem(DECK_KEY) || ''; } catch { return ''; }
}

/**
 * Cardfight lobby: create a room, or join one that is waiting for an
 * opponent. As soon as a room has two players both are taken to the field.
 */
export default function CardfightLobby({ username }) {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [decksLoading, setDecksLoading] = useState(true);
  const [deckId, setDeckId] = useState(readSavedDeck);
  const [roomName, setRoomName] = useState(username ? `${username}'s room` : '');
  const [rooms, setRooms] = useState([]);
  const [roomsError, setRoomsError] = useState(null);
  const [waiting, setWaiting] = useState(null); // { room, token }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // ---- decks ---------------------------------------------------------------
  useEffect(() => {
    let alive = true;
    fetchAllUserDecks(1, 200, '', 'deck_id', 'desc')
      .then((result) => {
        if (!alive) return;
        const list = result?.decks || [];
        // Your own decks first.
        list.sort((a, b) => Number(b.username === username) - Number(a.username === username));
        setDecks(list);
        setDeckId((current) => (list.some((d) => String(d.id) === String(current))
          ? current
          : String(list.find((d) => d.username === username)?.id ?? list[0]?.id ?? '')));
      })
      .catch(() => alive && setError('Could not load decks.'))
      .finally(() => alive && setDecksLoading(false));
    return () => { alive = false; };
  }, [username]);

  useEffect(() => {
    try { if (deckId) localStorage.setItem(DECK_KEY, deckId); } catch { /* ignore */ }
  }, [deckId]);

  const deck = useMemo(() => decks.find((d) => String(d.id) === String(deckId)), [decks, deckId]);
  const ownDecks = decks.filter((d) => d.username === username);
  const otherDecks = decks.filter((d) => d.username !== username);

  // ---- open rooms ----------------------------------------------------------
  const refreshRooms = useCallback(async () => {
    try {
      setRooms(await listRooms());
      setRoomsError(null);
    } catch {
      setRoomsError('Could not reach the server.');
    }
  }, []);

  useEffect(() => {
    if (waiting) return undefined;
    refreshRooms();
    const id = setInterval(refreshRooms, 3000);
    return () => clearInterval(id);
  }, [refreshRooms, waiting]);

  // ---- waiting for an opponent ---------------------------------------------
  useEffect(() => {
    if (!waiting) return undefined;
    let alive = true;
    const check = async () => {
      try {
        const room = await getRoom(waiting.room.id, waiting.token);
        if (!alive) return;
        if (room.status === 'playing') navigate(`/cardfight/${room.id}`);
      } catch (err) {
        if (!alive) return;
        if (err.status === 404 || err.status === 403) {
          setWaiting(null);
          setError('Your room expired. Create a new one.');
        }
      }
    };
    check();
    const id = setInterval(check, 1500); // also keeps the room alive
    return () => { alive = false; clearInterval(id); };
  }, [waiting, navigate]);

  // Leaving the page while waiting closes the room.
  useEffect(() => {
    if (!waiting) return undefined;
    const { room, token } = waiting;
    const onUnload = () => leaveRoom(room.id, token);
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [waiting]);

  // ---- actions -------------------------------------------------------------
  const seat = { username, deckId: deck ? deck.id : null, deckName: deck?.deck_name };

  const onCreate = async (e) => {
    e.preventDefault();
    setError(null);
    if (!deck) { setError('Choose a deck first.'); return; }
    setBusy(true);
    try {
      const { room, token } = await createRoom({ name: roomName, ...seat });
      rememberSeat(room.id, token);
      setWaiting({ room, token });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async (room) => {
    setError(null);
    if (!deck) { setError('Choose a deck first.'); return; }
    setBusy(true);
    try {
      const { token } = await joinRoom(room.id, seat);
      rememberSeat(room.id, token);
      navigate(`/cardfight/${room.id}`);
    } catch (err) {
      setError(err.status === 409 ? 'Someone else got there first: that room is full.' : err.message);
      refreshRooms();
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    const { room, token } = waiting;
    setWaiting(null);
    forgetSeat(room.id);
    await leaveRoom(room.id, token);
  };

  // ---- render --------------------------------------------------------------
  return (
    <div className="vg-root Cardfight Cardfight--lobby">
      <div className="CfLobby">
        <header className="CfLobby-header">
          <span className="Cf-eyebrow">Cardfight</span>
          <h1 className="Cf-title">Find an opponent</h1>
          <p className="Cf-sub">Create a room and share its name, or join a room that is waiting. A room starts as soon as two fighters are in.</p>
        </header>

        {error && <p className="Cf-error" role="alert">{error}</p>}

        {waiting ? (
          <section className="Cf-panel CfLobby-waiting" aria-live="polite">
            <div className="Cf-spinner" aria-hidden="true" />
            <h2>Waiting for an opponent…</h2>
            <p>
              Your room <strong>{waiting.room.name}</strong> is open. You’ll go to the field automatically
              when someone joins.
            </p>
            <p className="Cf-muted">Playing with {deck?.deck_name || 'your deck'}</p>
            <button type="button" className="vg-btn" onClick={onCancel}>Cancel room</button>
          </section>
        ) : (
          <div className="CfLobby-grid">
            <section className="Cf-panel">
              <h2 className="Cf-panel-title">Your deck</h2>
              <label className="Cf-field">
                <span>Deck you will play</span>
                <select
                  value={deckId}
                  onChange={(e) => setDeckId(e.target.value)}
                  disabled={decksLoading || !decks.length}
                >
                  {decksLoading && <option value="">Loading decks…</option>}
                  {!decksLoading && !decks.length && <option value="">No decks yet</option>}
                  {ownDecks.length > 0 && (
                    <optgroup label="Your decks">
                      {ownDecks.map((d) => <option key={d.id} value={d.id}>{d.deck_name} ({d.deck_type})</option>)}
                    </optgroup>
                  )}
                  {otherDecks.length > 0 && (
                    <optgroup label="Other players' decks">
                      {otherDecks.map((d) => (
                        <option key={d.id} value={d.id}>{d.deck_name} ({d.deck_type}) by {d.username}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>

              <form className="CfLobby-create" onSubmit={onCreate}>
                <h2 className="Cf-panel-title">Create a room</h2>
                <label className="Cf-field">
                  <span>Room name</span>
                  <input
                    value={roomName}
                    maxLength={60}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. Friday locals"
                  />
                </label>
                <button type="submit" className="vg-btn vg-btn--primary" disabled={busy || !roomName.trim() || !deck}>
                  Create room
                </button>
              </form>
            </section>

            <section className="Cf-panel">
              <div className="CfLobby-rooms-head">
                <h2 className="Cf-panel-title">Open rooms</h2>
                <button type="button" className="vg-btn vg-btn--ghost" onClick={refreshRooms}>Refresh</button>
              </div>
              {roomsError && <p className="Cf-muted">{roomsError}</p>}
              {!roomsError && rooms.length === 0 && (
                <p className="Cf-empty">No rooms are waiting right now. Create one and invite a friend.</p>
              )}
              <ul className="CfLobby-rooms">
                {rooms.map((room) => {
                  const host = room.players[0];
                  return (
                    <li key={room.id} className="CfLobby-room">
                      <div className="CfLobby-room-info">
                        <strong>{room.name}</strong>
                        <span className="Cf-muted">
                          {host?.username}{host?.deckName ? ` · ${host.deckName}` : ''}
                        </span>
                      </div>
                      <span className="CfLobby-room-count">1/2</span>
                      <button
                        type="button"
                        className="vg-btn vg-btn--primary"
                        disabled={busy || !deck}
                        onClick={() => onJoin(room)}
                      >
                        Join
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
