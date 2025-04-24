import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './DeckDetails.css';

function DeckDetails() {
  const location = useLocation();
  const { deck } = location.state || {};
  const [cards, setCards] = useState([]); // State to store the cards
  const [loading, setLoading] = useState(true); // State to track loading status
  const [deckName, setDeckName] = useState(deck?.name || ''); // State for deck name input

  useEffect(() => {
    if (deck) {
      // Fetch cards associated with the deck
      const fetchCards = async () => {
        setLoading(true); // Set loading to true before making the request
        try {
          const response = await fetch(`http://127.0.0.1:5000/decks/${deck.id}/cards`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setCards(data); // Set the fetched cards in state
        } catch (error) {
          console.error('Error fetching cards:', error);
        } finally {
          setLoading(false); // Set loading to false after the request is complete
        }
      };

      fetchCards();
    }
  }, [deck]);

  if (!deck) {
    return <p>No deck selected.</p>;
  }

  return (
    <div className="CreateNewDeck-container">
      <h2>{deck.name}</h2>
      <p>{deck.description || 'No description available'}</p>

      {/* Show loading symbol while fetching cards */}
      {loading ? (
        <div className="loading-spinner"></div>
      ) : (
        <div className="CreateNewDeck-grid">
          {cards.map((card, index) => (
            <div
              key={index}
              className="CreateNewDeck-card"
              onContextMenu={(e) => {
                e.preventDefault(); // Prevent the default context menu from appearing
              }}
              style={{
                position: 'relative', // Ensure relative positioning for the counter
                cursor: 'pointer',
                display: 'inline-block', // Ensure the card wraps tightly around the image
              }}
            >
              <img
                src={`data:image/png;base64,${card.image}`}
                alt={card.name || 'Card Image'}
              />
              {/* <p>{card.name}</p> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DeckDetails;