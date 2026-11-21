import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './DeckDetails.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function DeckDetails() {
  const location = useLocation();
  const { deck } = location.state || {};
  const [cards, setCards] = useState([]);
  const [rideDeckCards, setRideDeckCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deckName, setDeckName] = useState(deck?.name || '');
  const [modalCard, setModalCard] = useState(null);

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    if (deck) {
      const fetchCards = async () => {
        setLoading(true);
        try {
          // Use API_BASE_URL instead of hardcoded /api
          const response = await fetch(`${API_BASE_URL}/api/decks/${deck.id}/cards`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setCards(data);

          // Fetch ride deck cards if it's a Standard deck
          if (deck.deck_type === 'Standard') {
            // Use API_BASE_URL here too
            const rideDeckResponse = await fetch(`${API_BASE_URL}/api/decks/${deck.id}/ride-deck`);
            if (rideDeckResponse.ok) {
              const rideDeckData = await rideDeckResponse.json();
              setRideDeckCards(rideDeckData);
            }
          }
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
    // Only pass the deck: TestHand fetches the cards itself. Card images are
    // too large to fit in browser history state for bigger decks.
    navigate('/test-hand', { state: { deck } });
  };

  const handleDeleteDeck = async () => {
    if (!deck) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete the deck "${deck.name}"? This action cannot be undone.`);
    
    if (confirmDelete) {
      try {
        // Use API_BASE_URL here too
        const response = await fetch(`${API_BASE_URL}/api/decks/${deck.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert(`Deck "${deck.name}" has been deleted successfully.`);
          navigate('/view-decks'); // Navigate back to the deck list
        } else {
          const errorData = await response.json();
          alert(`Failed to delete deck: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting deck:', error);
        alert('An error occurred while deleting the deck. Please try again.');
      }
    }
  };

  if (!deck) {
    return <p>No deck selected.</p>;
  }

  return (
    <div className="CreateNewDeck-container">
      <button className="delete-deck-button" onClick={handleDeleteDeck}>
        Delete Deck
      </button>
      <button
        className="test-hand-button"
        onClick={handleTestHand}
        disabled={loading}
        title={loading ? 'Loading the deck…' : undefined}
      >
        {loading ? 'Loading…' : 'Test Hand'}
      </button>

      {/* Title Section */}
      <div className="CreateNewDeck-title-box">
        <h2>{deck.name}</h2>
        <p>{deck.description || 'No description available'}</p>
      </div>

      {/* Main Content Container */}
      <div
        className="DeckDetails-content"
        style={{
          justifyContent: deck.deck_type === 'Standard' && rideDeckCards.length > 0 ? 'flex-start' : 'center'
        }}
      >
        
        {/* Main Deck Cards */}
        <div className="CreateNewDeck-grid-box" style={{ 
          flex: deck.deck_type === 'Standard' && rideDeckCards.length > 0 ? '1' : '0 0 auto'
        }}>
          <h3 className="DeckDetails-section-title">Main Deck</h3>
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
                >
                  <img
                    src={`data:image/png;base64,${card.image}`}
                    alt={card.name || 'Card Image'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ride Deck Section */}
        {deck.deck_type === 'Standard' && rideDeckCards.length > 0 && (
          <div className="DeckDetails-ride-box">
            <h3 className="DeckDetails-section-title">Ride Deck</h3>
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <div className="DeckDetails-ride-list">
                {rideDeckCards.map((card, index) => (
                  <div
                    key={index}
                    className="DeckDetails-ride-card"
                    onClick={() => openModal(card)}
                  >
                    <img
                      src={`data:image/png;base64,${card.image}`}
                      alt={card.name || 'Card Image'}
                    />
                    <div className="DeckDetails-ride-grade">
                      Grade {card.grade}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Section */}
      {modalCard && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
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