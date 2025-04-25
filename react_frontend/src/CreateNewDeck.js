import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchCard, postNewDeck } from './api';
import './CreateNewDeck.css';

function CreateNewDeck({ username }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [CardSearch, setCardSearch] = useState('');
  const [SearchResult, setSearchResult] = useState([]);
  const [CurrentDeck, setCurrentDeck] = useState([]);
  const [DeckName, setDeckName] = useState('');
  const [DeckDescription, setDeckDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedUnitType, setSelectedUnitType] = useState('');
  const [modalCard, setModalCard] = useState(null);

  const navigate = useNavigate();

  const handleChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleGradeChange = (event) => {
    setSelectedGrade(event.target.value); // Update selected grade
  };

  const getOutlineColor = () => {
    switch (selectedOption) {
      case 'Keter Sanctuary': return 'gold';
      case 'Brandt Gate': return 'white';
      case 'Stoicheia': return 'green';
      case 'Dark States': return 'blue';
      case 'Dragon Empire': return 'red';
      case 'Lyrical monestario': return 'pink';
      default: return 'purple';
    }
  };

  const handleKeyPress = async (event) => {
    if (event.key === 'Enter') {
      // Clear previous search results and show loading icon
      setSearchResult([]);
      setLoading(true);

      try {
        const result = await SearchCard(CardSearch, selectedOption, selectedGrade, selectedUnitType); // Call the HTTP request function
        setSearchResult(result); // Update with new search results
      } catch (error) {
        console.error('Failed to search', error);
      } finally {
        setLoading(false); // Hide loading icon after search completes
      }
    }
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

    if (card.card_type === 'G Unit') {
      if (gUnits.length >= 16) {
        alert('You can only add up to 16 G units to a deck!');
        return;
      }
    } else {
      if (regularCards.length >= 50) {
        alert('You can only add 50 regular cards to a deck!');
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

  const handleMiddleClick = (event, card) => {
    event.preventDefault(); // Prevent default middle-click behavior
    setModalCard(card); // Set the selected card for the modal
  };

  const closeModal = () => {
    setModalCard(null); // Close the modal
  };

  const createDeck = async (deckName) => {
    if (deckName.trim() === '') {
      alert('Please enter a valid deck name.');
      return;
    }

    const gUnits = CurrentDeck.filter((deckCard) => deckCard.card_type === 'G Unit');
    const regularCards = CurrentDeck.filter((deckCard) => deckCard.card_type !== 'G Unit');

    if (regularCards.length !== 50) {
      alert('You need exactly 50 regular cards to create a deck!');
      return;
    }
    if (gUnits.length > 16) {
      alert('You can only have up to 16 G units in a deck!');
      return;
    }

    const deckWithoutImages = CurrentDeck.map(({ image, ...rest }) => rest);

    try {
      const result = await postNewDeck(deckName, deckWithoutImages, username, DeckDescription);
      if (result.status === 200) {
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
      <h2 className="CreateNewDeck-title">Create New Deck</h2>
      <p>Create a deck, you wont pussy.</p>

      <div className="CreateNewDeck-selectors-container">
        <div className="CreateNewDeck-selector">
          <label className="CreateNewDeck-label" htmlFor="nation-select">Nation</label>
          <select
            id="nation-select"
            value={selectedOption}
            onChange={handleChange}
            className="CreateNewDeck-dropdown"
            style={{ outline: `2px solid ${getOutlineColor()}` }}
          >
            <option value="">None</option> {/* Allow no selection */}
            <option value="Keter Sanctuary">Keter Sanctuary</option>
            <option value="Brandt Gate">Brandt Gate</option>
            <option value="Stoicheia">Stoicheia</option>
            <option value="Dark States">Dark States</option>
            <option value="Dragon Empire">Dragon Empire</option>
            <option value="Lyrical monestario">Lyrical monestario</option>
          </select>
        </div>

        <div className="CreateNewDeck-selector">
          <label className="CreateNewDeck-label" htmlFor="grade-select">Grade</label>
          <select
            id="grade-select"
            value={selectedGrade}
            onChange={handleGradeChange}
            className="CreateNewDeck-dropdown"
            style={{ outline: `2px solid ${getOutlineColor()}` }}
          >
            <option value="">None</option> {/* Allow no selection */}
            <option value="Grade 0">Grade 0</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
          </select>
        </div>

        <div className="CreateNewDeck-selector">
          <label className="CreateNewDeck-label" htmlFor="unit-type-select">Unit Type</label>
          <select
            id="unit-type-select"
            value={selectedUnitType}
            onChange={(e) => setSelectedUnitType(e.target.value)}
            className="CreateNewDeck-dropdown"
            style={{ outline: `2px solid ${getOutlineColor()}` }}
          >
            <option value="">None</option> {/* Allow no selection */}
            <option value="Trigger Unit">Trigger Unit</option>
            <option value="G Unit">G Unit</option>
            <option value="Normal Order">Normal Order</option>
            <option value="Set Order">Set Order</option>
            <option value="Blitz Order">Blitz Order</option>
          </select>
        </div>
      </div>

      <div className="CreateNewDeck-input-container">
        <input
          type="text"
          value={CardSearch}
          onChange={(e) => setCardSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleKeyPress(e);
            }
          }}
          placeholder="Search for a card and press Enter"
          className="CreateNewDeck-input"
        />
        <button
          onClick={() => handleKeyPress({ key: 'Enter' })}
          className="CreateNewDeck-button"
          style={{ backgroundColor: `${getOutlineColor()}` }}
        >
          Search
        </button>
      </div>

      {loading && <div className="loading-spinner"></div>} {/* Show loading spinner */}

      <div className="CreateNewDeck-grid">
        {SearchResult && SearchResult.map((card, index) => {
          const cardCount = CurrentDeck.filter((deckCard) => deckCard.name === card.name).length;

          return (
            <div
              key={index}
              className="CreateNewDeck-card"
              onClick={() => handleCardClick(card)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleCardRemove(card);
              }}
              style={{
                position: 'relative',
                cursor: 'pointer',
                display: 'inline-block',
              }}
            >
              <img
                src={`data:image/png;base64,${card.image}`}
                alt={card.name || 'Card Image'}
              />
              <p>{card.name}</p>
              <div className="CreateNewDeck-card-counter">
                {cardCount}
              </div>
              <button
                className="CreateNewDeck-info-button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the card click event
                  handleMiddleClick(e, card); // Open the modal
                }}
              >
                ℹ️
              </button>
            </div>
          );
        })}
      </div>

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
            <img
              src={`data:image/png;base64,${modalCard.image}`}
              alt={modalCard.name || 'Card Image'}
              className="modal-image"
            />
            <h3>{modalCard.name}</h3>
            <p><strong>Effect:</strong> {modalCard.effect}</p>
            <p><strong>Type:</strong> {modalCard.card_type}</p>
            <p><strong>Grade/Skill:</strong> {modalCard.grade_skill}</p>
            <p><strong>Power:</strong> {modalCard.power}</p>
            <p><strong>Critical:</strong> {modalCard.critical}</p>
            <p><strong>Shield:</strong> {modalCard.shield}</p>
            <p><strong>Nation:</strong> {modalCard.nation}</p>
            <p><strong>Race:</strong> {modalCard.race}</p>
            <p><strong>Trigger Effect:</strong> {modalCard.trigger_effect}</p>
            <p><strong>Format:</strong> {modalCard.format}</p>
            <p><strong>Illustrator:</strong> {modalCard.illustrator}</p>
            <p><strong>Clan:</strong> {modalCard.clan}</p>
            <p><strong>Flavor:</strong> {modalCard.flavor}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateNewDeck;