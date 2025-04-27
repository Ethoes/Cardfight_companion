import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './DeckDetails.css';

function DeckDetails() {
  const location = useLocation();
  const { deck } = location.state || {};
  const [cards, setCards] = useState([]); // State to store the cards
  const [loading, setLoading] = useState(true); // State to track loading status
  const [deckName, setDeckName] = useState(deck?.name || ''); // State for deck name input
  const [modalCard, setModalCard] = useState(null); // State for the modal card

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

  const openModal = (card) => {
    setModalCard(card); // Set the selected card for the modal
  };
  
  const closeModal = () => {
    setModalCard(null); // Close the modal
  };

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
              onClick={() => openModal(card)} // Open the modal on click
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
            </div>
          ))}
        </div>
      )}

      {modalCard && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>X</button>
            <div className="modal-scrollable-content">
              <img
                src={`data:image/png;base64,${modalCard.image}`}
                alt={modalCard.name || 'Card Image'}
                className="modal-image"
              />
              <h3>{modalCard.name}</h3>
              <p><strong>Effect:</strong> {modalCard.effect}</p>
              <p><strong>Type:</strong> {modalCard.type}</p>
              <p><strong>Grade:</strong> {modalCard.grade}</p>
              <p><strong>Power:</strong> {modalCard.power}</p>
              <p><strong>Critical:</strong> {modalCard.critical}</p>
              <p><strong>Shield:</strong> {modalCard.shield}</p>
              <p><strong>Nation:</strong> {modalCard.nation}</p>
              <p><strong>Race:</strong> {modalCard.race}</p>
              <p><strong>Format:</strong> {modalCard.regulation}</p>
              <p><strong>Illustrator:</strong> {modalCard.illustrator}</p>
              <p><strong>Clan:</strong> {modalCard.clan}</p>
              <p><strong>Flavor:</strong> {modalCard.flavor}</p>
              <p><strong>URL:</strong> <a href={modalCard.url} target="_blank" rel="noopener noreferrer">{modalCard.url}</a></p>
              <p><strong>Set Name:</strong> {modalCard.set_name}</p>
              <p><strong>Rarity:</strong> {modalCard.rarity}</p>
              <p><strong>Skill:</strong> {modalCard.skill}</p>
              <p><strong>Gift:</strong> {modalCard.gift}</p>
              <p><strong>Regulation:</strong> {modalCard.regulation}</p>
              <p><strong>Card Number:</strong> {modalCard.number}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DeckDetails;