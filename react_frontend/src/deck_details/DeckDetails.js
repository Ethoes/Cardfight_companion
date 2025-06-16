import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './DeckDetails.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function DeckDetails() {
  const location = useLocation();
  const { deck } = location.state || {};
  const [cards, setCards] = useState([]); // State to store the cards
  const [loading, setLoading] = useState(true); // State to track loading status
  const [deckName, setDeckName] = useState(deck?.name || ''); // State for deck name input
  const [modalCard, setModalCard] = useState(null); // State for the modal card

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    if (deck) {
      const fetchCards = async () => {
        setLoading(true);
        try {
          const response = await fetch(`http://127.0.0.1:5000/decks/${deck.id}/cards`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setCards(data); // Set the fetched cards
        } catch (error) {
          console.error('Error fetching cards:', error);
        } finally {
          setLoading(false);
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

  const handleTestHand = () => {
    console.log('Navigating to TestHand with:', { deck, cards }); // Debug log
    navigate('/test-hand', { state: { deck, cards } }); // Pass deck and cards
  };

  if (!deck) {
    return <p>No deck selected.</p>;
  }

  return (
    <div className="CreateNewDeck-container">
      <button className="test-hand-button" onClick={handleTestHand}>
        Test Hand
      </button>

        {/* Title Section */}
        <div className="CreateNewDeck-title-box">
          <h2>{deck.name}</h2>
          <p>{deck.description || 'No description available'}</p>
        </div>

        {/* Cards Grid Section */}
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <div className="CreateNewDeck-grid-box">
            <div className="CreateNewDeck-grid">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="CreateNewDeck-card"
                  onClick={() => openModal(card)} // Open the modal on click
                  onContextMenu={(e) => {
                    e.preventDefault(); // Prevent the default context menu from appearing
                  }}
                >
                  <img
                    src={`data:image/png;base64,${card.image}`}
                    alt={card.name || 'Card Image'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Section */}
        {modalCard && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>X</button>
              <div className="modal-scrollable-content">
                {modalCard.image && (
                  <img
                    src={`data:image/png;base64,${modalCard.image}`}
                    alt={modalCard.name || 'Card Image'}
                    className="modal-image"
                  />
                )}
                {modalCard.name && <h3>{modalCard.name}</h3>}
                {modalCard.effect && <p><strong>Effect:</strong> {modalCard.effect}</p>}
                {modalCard.type && <p><strong>Type:</strong> {modalCard.type}</p>}
                {modalCard.grade && <p><strong>Grade:</strong> {modalCard.grade}</p>}
                {modalCard.power && <p><strong>Power:</strong> {modalCard.power}</p>}
                {modalCard.critical && <p><strong>Critical:</strong> {modalCard.critical}</p>}
                {modalCard.shield && <p><strong>Shield:</strong> {modalCard.shield}</p>}
                {modalCard.nation && <p><strong>Nation:</strong> {modalCard.nation}</p>}
                {modalCard.race && <p><strong>Race:</strong> {modalCard.race}</p>}
                {modalCard.regulation && <p><strong>Format:</strong> {modalCard.regulation}</p>}
                {modalCard.illustrator && <p><strong>Illustrator:</strong> {modalCard.illustrator}</p>}
                {modalCard.clan && <p><strong>Clan:</strong> {modalCard.clan}</p>}
                {modalCard.flavor && <p><strong>Flavor:</strong> {modalCard.flavor}</p>}
                {modalCard.url && (
                  <p>
                    <strong>URL:</strong>{' '}
                    <a href={modalCard.url} target="_blank" rel="noopener noreferrer">
                      {modalCard.url}
                    </a>
                  </p>
                )}
                {modalCard.set_name && <p><strong>Set Name:</strong> {modalCard.set_name}</p>}
                {modalCard.rarity && <p><strong>Rarity:</strong> {modalCard.rarity}</p>}
                {modalCard.skill && <p><strong>Skill:</strong> {modalCard.skill}</p>}
                {modalCard.gift && <p><strong>Gift:</strong> {modalCard.gift}</p>}
                {modalCard.number && <p><strong>Card Number:</strong> {modalCard.number}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default DeckDetails;