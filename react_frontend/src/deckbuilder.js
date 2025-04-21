import React from 'react';
import { Link } from 'react-router-dom';

function DeckBuilder() {
  return (
    <div>
      <h2>Deck Builder</h2>
      <Link to="/create-new-deck">
        <button>Create New Deck</button>
      </Link>
    </div>
  );
}

export default DeckBuilder;