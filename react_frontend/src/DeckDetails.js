import React from 'react';
import { useLocation } from 'react-router-dom';

function DeckDetails() {
  const location = useLocation();
  const { deck } = location.state || {};

  if (!deck) {
    return <p>No deck selected.</p>;
  }

  return (
    <div>
      <h2>{deck.name}</h2>
      <p>{deck.description || 'No description available'}</p>
      {/* Add more details about the deck here */}
    </div>
  );
}

export default DeckDetails;