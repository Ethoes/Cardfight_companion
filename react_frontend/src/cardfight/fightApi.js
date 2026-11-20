// Cardfight rooms API (see backend/routes/fight_routes.py).

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const BASE = `${API_BASE_URL}/api/fight`;

async function request(path, { method = 'GET', body, token, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['X-Room-Token'] = token;
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const err = new Error(data?.error || `Request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }
  return data;
}

export const listRooms = () => request('/rooms').then((d) => d.rooms);

export const createRoom = ({ name, username, deckId, deckName }) =>
  request('/rooms', { method: 'POST', body: { name, username, deckId, deckName } });

export const joinRoom = (roomId, { username, deckId, deckName }) =>
  request(`/rooms/${roomId}/join`, { method: 'POST', body: { username, deckId, deckName } });

export const getRoom = (roomId, token) => request(`/rooms/${roomId}`, { token }).then((d) => d.room);

export const leaveRoom = (roomId, token) =>
  request(`/rooms/${roomId}/leave`, { method: 'POST', token }).catch(() => {});

/** Transport object for useRemoteGame. */
export function roomTransport(roomId, token) {
  return {
    postActions: (entries) =>
      request(`/rooms/${roomId}/actions`, { method: 'POST', body: { actions: entries }, token }),
    pollActions: (since, wait = 20) =>
      request(`/rooms/${roomId}/actions?since=${since}&wait=${wait}`, { token }),
  };
}

// ---- remembering which room this tab is in (survives a page refresh) --------
const SESSION_KEY = (roomId) => `cardfight-room-${roomId}`;

export function rememberSeat(roomId, token) {
  try { sessionStorage.setItem(SESSION_KEY(roomId), token); } catch { /* private mode */ }
}

export function seatToken(roomId) {
  try { return sessionStorage.getItem(SESSION_KEY(roomId)); } catch { return null; }
}

export function forgetSeat(roomId) {
  try { sessionStorage.removeItem(SESSION_KEY(roomId)); } catch { /* ignore */ }
}

// ---- decks -------------------------------------------------------------------
export async function fetchDeckCards(deckId) {
  const [cardsRes, rideRes] = await Promise.all([
    fetch(`${API_BASE_URL}/api/decks/${deckId}/cards`),
    fetch(`${API_BASE_URL}/api/decks/${deckId}/ride-deck`),
  ]);
  if (!cardsRes.ok) throw new Error('Could not load a deck for this cardfight.');
  const cards = await cardsRes.json();
  const rideDeck = rideRes.ok ? await rideRes.json() : [];
  return { cards: Array.isArray(cards) ? cards : [], rideDeck: Array.isArray(rideDeck) ? rideDeck : [] };
}
