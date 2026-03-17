import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postNewDeck } from '../api';
import CardSearch from '../components/CardSearch';
import './CreateNewDeck.css';

function CreateNewDeck({ username }) {
  const [CurrentDeck, setCurrentDeck] = useState([]);
  const [DeckName, setDeckName] = useState('');
  const [DeckDescription, setDeckDescription] = useState('');
  const [modalCard, setModalCard] = useState(null);
  const [format, setFormat] = useState(null); // State for selected format
  const [showFormatModal, setShowFormatModal] = useState(true); // State to control format selection modal
  const [rideDeck, setRideDeck] = useState({ 0: null, 1: null, 2: null, 3: null }); // State for ride deck cards


  const navigate = useNavigate();

  const handleFormatSelection = (selectedFormat) => {
    setFormat(selectedFormat); // Set the selected format
    setShowFormatModal(false); // Close the format selection modal
  };

  const handleCardClick = (card) => {
    console.log('Card clicked:', card);
  
    const cardCount = CurrentDeck.filter((deckCard) => deckCard.id === card.id).length;
    if (cardCount >= 4) {
      alert('You can only add up to 4 of the same card to a deck!');
      return;
    }
  
    const gUnits = CurrentDeck.filter((deckCard) => deckCard.type === 'G Unit');
    const regularCards = CurrentDeck.filter((deckCard) => deckCard.type !== 'G Unit');
  
    if (card.type === 'G Unit') {
      if (gUnits.length >= 16) {
        alert('You can only add up to 16 G units to a deck!');
        return;
      }
    } else {
      if (regularCards.length >= 50) {
        alert('You can only add up to 50 regular cards to a deck!');
        return;
      }
    }
  
    setCurrentDeck((prevDeck) => [...prevDeck, card]);
  };

  const handleCardRemove = (card) => {
    console.log('Card removed:', card);

    setCurrentDeck((prevDeck) => {
      const cardIndex = prevDeck.findIndex((deckCard) => deckCard.id === card.id);
      if (cardIndex !== -1) {
        const updatedDeck = [...prevDeck];
        updatedDeck.splice(cardIndex, 1);
        return updatedDeck;
      }
      return prevDeck;
    });
  };

  const handleCardInfo = (card) => {
    setModalCard(card); // Set the selected card for the modal
  };

  const closeModal = () => {
    setModalCard(null); // Close the modal
  };

  // Helper to select a card for the ride deck
  const handleSelectRideDeck = (grade, card) => {
    setRideDeck(prev => ({ ...prev, [grade]: card }));
  };

  // Validation before creating a Standard deck
  const validateRideDeck = () => {
    if (format === 'Standard') {
      for (let grade = 0; grade <= 3; grade++) {
        if (!rideDeck[grade]) {
          alert(`Please select a Grade ${grade} card for your ride deck.`);
          return false;
        }
      }
    }
    return true;
  };

  const createDeck = async (deckName) => {
    if (deckName.trim() === '') {
      alert('Please enter a valid deck name.');
      return;
    }
    if (!validateRideDeck()) return;
  
    const gUnits = CurrentDeck.filter((deckCard) => deckCard.type === 'G Unit');
    const regularCards = CurrentDeck.filter((deckCard) => deckCard.type !== 'G Unit');
  
    if (regularCards.length !== 50) {
      alert('You need exactly 50 cards to create a deck!');
      return;
    }
  
    if (gUnits.length > 16) {
      alert('You can only have up to 16 G units in a deck!');
      return;
    }
  
    const deckWithoutImages = CurrentDeck.map(({ image, ...rest }) => rest);
    const rideDeckWithoutImages = format === 'Standard' ? 
      Object.fromEntries(
        Object.entries(rideDeck).map(([grade, card]) => [
          grade, 
          card ? { ...card, image: undefined } : null
        ])
      ) : null;
      console.log(rideDeckWithoutImages)
  
    try {
      const result = await postNewDeck(deckName, deckWithoutImages, username, DeckDescription, format, rideDeckWithoutImages);
      // Check for successful status codes (200 or 201)
      if (result.status === 200 || result.status === 201) {
        alert(`Deck "${deckName}" created successfully!`);
        navigate('/');
      } else {
        alert('Failed to create the deck. Please try again.');
      }
    } catch (error) {
      console.error('Error creating deck:', error);
      alert('An error occurred while creating the deck.');
    }
  };

  return (
    <div className="CreateNewDeck-container">
      {/* Format Selection Modal */}
      {showFormatModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Select Deck Format</h2>
            <button
              className="format-button"
              onClick={() => handleFormatSelection('Standard')}
            >
              Standard
            </button>
            <button
              className="format-button"
              onClick={() => handleFormatSelection('Premium')}
            >
              Premium
            </button>
          </div>
        </div>
      )}

      {!showFormatModal && (
        <div className="CreateNewDeck-middle-box">
      <h2 className="CreateNewDeck-title">Create New Deck</h2>
      <p>Create a deck</p>

      <div className="CreateNewDeck-format">
          <p><strong>Format:</strong> {format}</p>
      </div>

      <CardSearch
        format={format}
        onCardSelect={handleCardClick}
        onCardInfo={handleCardInfo}
        showCardCounts={true}
        currentDeck={CurrentDeck}
        showAddButton={false}
        compact={false}
      />

      <div className="CreateNewDeck-deckname-container" style={{ marginTop: '20px', textAlign: 'center' }}>
        <input
          type="text"
          value={DeckName}
          onChange={(e) => setDeckName(e.target.value)}
          placeholder="Enter deck name"
          className="CreateNewDeck-deckname-input"
        />
        <textarea
          value={DeckDescription}
          onChange={(e) => setDeckDescription(e.target.value)}
          placeholder="Enter deck description"
          className="CreateNewDeck-description-input"
          style={{ marginTop: '10px', width: '100%', height: '80px' }}
        />
        <button
          onClick={() => createDeck(DeckName)}
          className="CreateNewDeck-deckname-button"
        >
          Create Deck
        </button>
      </div>

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
              <h3>{modalCard.name }</h3>
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

      {format === 'Standard' && (
        <div className="ride-deck-section">
          <h3>Ride Deck (Standard Only)</h3>
          {[0, 1, 2, 3].map(grade => (
            <div key={grade}>
              <span>Grade {grade}: </span>
              {rideDeck[grade]
                ? <span>{rideDeck[grade].name}</span>
                : <span style={{ color: 'red' }}>Not selected</span>}
              <button
                onClick={() => {
                  // Show a modal or dropdown to select a card of this grade from CurrentDeck
                  // For simplicity, just select the first matching card:
                  const card = CurrentDeck.find(c => c.grade === `Grade ${grade}`);
                  if (card) handleSelectRideDeck(grade, card);
                  else alert(`No Grade ${grade} card in deck!`);
                }}
              >
                Select
              </button>
            </div>
          ))}
        </div>
      )}

      {CurrentDeck.map((card, idx) => (
        <div key={idx} className="deck-card-container" style={{ position: 'relative', display: 'inline-block', margin: 8 }}>
          {/* Add to Ride Deck button (top-left) */}
          {format === 'Standard' && card.grade && [0,1,2,3].includes(Number(card.grade.replace('Grade ',''))) && (
            <button
              style={{
                position: 'absolute',
                top: 2,
                left: 2,
                zIndex: 2,
                background: rideDeck[Number(card.grade.replace('Grade ',''))]?.id === card.id ? '#1976d2' : '#fff',
                color: rideDeck[Number(card.grade.replace('Grade ',''))]?.id === card.id ? '#fff' : '#1976d2',
                border: '1px solid #1976d2',
                borderRadius: '50%',
                width: 24,
                height: 24,
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: '20px',
                padding: 0,
              }}
              title={`Set as Grade ${card.grade.replace('Grade ', '')} Ride Deck card`}
              onClick={() => handleSelectRideDeck(Number(card.grade.replace('Grade ','')), card)}
              disabled={rideDeck[Number(card.grade.replace('Grade ',''))]?.id === card.id}
            >
              {rideDeck[Number(card.grade.replace('Grade ',''))]?.id === card.id ? '✓' : '+'}
            </button>
          )}
          {/* Card image and info */}
          <img src={card.image} alt={card.name} style={{ width: 100, borderRadius: 8 }} />
          <div>{card.name}</div>
          <div>{card.grade}</div>
          {/* ...other card info... */}
        </div>
      ))}
      </div>
      )}
    </div>
  );
}

export default CreateNewDeck;