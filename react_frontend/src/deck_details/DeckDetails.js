import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './DeckDetails.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

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
          // Fetch regular deck cards
          const response = await fetch(`/api/decks/${deck.id}/cards`);  // Changed from 'http://127.0.0.1:5000/decks/${deck.id}/cards'
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setCards(data);

          // Fetch ride deck cards if it's a Standard deck
          if (deck.deck_type === 'Standard') {
            const rideDeckResponse = await fetch(`/api/decks/${deck.id}/ride-deck`);  // Changed from 'http://127.0.0.1:5000/decks/${deck.id}/ride-deck'
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
    console.log('Navigating to TestHand with:', { deck, cards, rideDeckCards }); // Debug log
    navigate('/test-hand', { state: { deck, cards, rideDeckCards } }); // Pass deck, cards, and rideDeckCards
  };

  const handleDeleteDeck = async () => {
    if (!deck) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete the deck "${deck.name}"? This action cannot be undone.`);
    
    if (confirmDelete) {
      try {
        const response = await fetch(`/api/decks/${deck.id}`, {  // Changed from 'http://127.0.0.1:5000/decks/${deck.id}'
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
      <button className="test-hand-button" onClick={handleTestHand}>
        Test Hand
      </button>

      {/* Title Section */}
      <div className="CreateNewDeck-title-box">
        <h2>{deck.name}</h2>
        <p>{deck.description || 'No description available'}</p>
      </div>

      {/* Main Content Container */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        width: '100%', 
        maxWidth: '1400px',
        justifyContent: deck.deck_type === 'Standard' && rideDeckCards.length > 0 ? 'flex-start' : 'center'
      }}>
        
        {/* Main Deck Cards */}
        <div className="CreateNewDeck-grid-box" style={{ 
          flex: deck.deck_type === 'Standard' && rideDeckCards.length > 0 ? '1' : '0 0 auto'
        }}>
          <h3 style={{ textAlign: 'center', margin: '0 0 20px 0', color: 'white' }}>Main Deck</h3>
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
          <div style={{ 
            background: 'linear-gradient(135deg, #699fd0, #a2c4c9)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            flex: '0 0 280px', 
            height: 'calc(60vh)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            <h3 style={{ textAlign: 'center', margin: '0 0 20px 0', color: 'white' }}>Ride Deck</h3>
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px',
                alignItems: 'center',
                paddingBottom: '20px'
              }}>
                {rideDeckCards.map((card, index) => (
                  <div
                    key={index}
                    onClick={() => openModal(card)}
                    style={{ 
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      width: '140px',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-5px)';
                      e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <img
                      src={`data:image/png;base64,${card.image}`}
                      alt={card.name || 'Card Image'}
                      style={{ 
                        width: '100%', 
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                    <div style={{ 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      color: '#333',
                      padding: '8px 5px',
                      backgroundColor: '#f5f5f5',
                      borderTop: '1px solid #ddd'
                    }}>
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