import React from 'react';
import { Link } from 'react-router-dom';
import './deckbuilder.css';

function DeckBuilder() {
  return (
    <div className="DeckBuilder-container">
      <div className="DeckBuilder-header">
        <h2>Deck Builder</h2>
      </div>
      <div className="DeckBuilder-buttons-container">
        <Link to="/create-new-deck">
          <button>Create New Deck</button>
        </Link>
        <Link to="/view-decks">
          <button>View All Decks</button>
        </Link>
      </div>
    </div>
  );
}

export default DeckBuilder;