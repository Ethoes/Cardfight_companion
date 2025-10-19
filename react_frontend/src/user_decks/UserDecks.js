import React, { useState, useEffect } from 'react';
import './UserDecks.css';

function UserDecks({ username }) {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Fetch user decks from API
    // For now, just set loading to false after a short delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [username]);

  if (loading) {
    return (
      <div className="user-decks">
        <div className="user-decks-header">
          <h1>My Decks</h1>
          <p>Loading your decks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-decks">
        <div className="user-decks-header">
          <h1>My Decks</h1>
          <p className="error">Error loading decks: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-decks">
      <div className="user-decks-header">
        <h1>My Decks</h1>
        <p>Welcome, {username}! Here are your saved decks.</p>
      </div>

      <div className="user-decks-content">
        <div className="decks-grid">
          {/* TODO: Map through actual decks */}
          <div className="deck-card placeholder">
            <h3>No decks found</h3>
            <p>You haven't created any decks yet.</p>
            <button className="create-deck-btn">Create Your First Deck</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDecks;