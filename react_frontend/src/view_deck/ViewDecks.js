import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ViewDecks.css'; // Add a CSS file for styling

function ViewDecks({ username }) {
  const [decks, setDecks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the decks from the backend
    const fetchDecks = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/decks', {
          method: 'POST', // Use POST to send data in the body
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username }), // Send username in the body
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setDecks(data);
      } catch (error) {
        console.error('Error fetching decks:', error);
      }
    };

    fetchDecks();
  }, [username]);

  const handleDeckClick = (deck) => {
    navigate('/deck-details', { state: { deck } }); // Navigate to the next page with the deck object
  };

  return (
    <div className="view-decks">
      <h2>All Decks</h2>
      <div className="deck-list">
        {decks.map((deck) => (
          <div
            key={deck.id}
            className="deck-card"
            onClick={() => handleDeckClick(deck)}
          >
            <h3>{deck.name}</h3>
            <p>{deck.description || 'No description available'}</p>
            <p>{deck.deck_type || 'No format found'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ViewDecks;