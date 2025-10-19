import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchCard, postNewDeck } from '../api';
import './CreateNewDeck.css';

function CreateNewDeck({ username }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedClan, setSelectedClan] = useState('');
  const [selectedSet, setSelectedSet] = useState(''); // State for selected set
  const [sets, setSets] = useState([]); // State for fetched sets
  const [CardSearch, setCardSearch] = useState('');
  const [SearchResult, setSearchResult] = useState([]);
  const [CurrentDeck, setCurrentDeck] = useState([]);
  const [DeckName, setDeckName] = useState('');
  const [DeckDescription, setDeckDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedUnitType, setSelectedUnitType] = useState('');
  const [modalCard, setModalCard] = useState(null);
  const [format, setFormat] = useState(null); // State for selected format
  const [showFormatModal, setShowFormatModal] = useState(true); // State to control format selection modal
  const [rideDeck, setRideDeck] = useState({ 0: null, 1: null, 2: null, 3: null }); // State for ride deck cards


  const navigate = useNavigate();

  const handleChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleGradeChange = (event) => {
    setSelectedGrade(event.target.value); // Update selected grade
  };

  const handleFormatSelection = (selectedFormat) => {
    setFormat(selectedFormat); // Set the selected format
    setShowFormatModal(false); // Close the format selection modal
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

  useEffect(() => {
    // Fetch the list of sets from the backend
    const fetchSets = async () => {
      try {
        const response = await fetch(`/api/sets?format=${format || ''}`);  // Changed from 'http://127.0.0.1:5000/sets?format=${format || ''}'
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSets(data); // Update the sets state with the fetched data
      } catch (error) {
        console.error('Error fetching sets:', error);
      }
    };
  
    fetchSets();
  }, [format]); 

  const handleSetChange = (event) => {
    setSelectedSet(event.target.value); // Update selected set
  };

  const handleKeyPress = async (event) => {
    if (event.key === 'Enter') {
      // Clear previous search results and show loading icon
      setSearchResult([]);
      setLoading(true);
  
      try {
        // Include the format in the request only if it's "Standard"
        const result = await SearchCard(
          CardSearch,
          selectedOption,
          selectedGrade,
          selectedUnitType,
          format === 'Standard' ? format : null,
          selectedClan,
          selectedSet
        );
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

  const handleMiddleClick = (event, card) => {
    event.preventDefault(); // Prevent default middle-click behavior
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

      <div className="CreateNewDeck-selectors-container">
        {/* Conditional rendering for Nation or Clan selector */}
        <div className="CreateNewDeck-selector">
        {format === 'Premium' ? (
          <>
            <label className="CreateNewDeck-label" htmlFor="clan-select">Clan</label>
            <select
              id="clan-select"
              value={selectedClan} // Use selectedClan for the clan selector
              onChange={(event) => setSelectedClan(event.target.value)} // Update selectedClan
              className="CreateNewDeck-dropdown"
              style={{ outline: `2px solid ${getOutlineColor()}` }}
            >
              <option value="">None</option> {/* Allow no selection */}
              <option value="Royal Paladin">Royal Paladin</option>
              <option value="Kagero">Kagero</option>
              <option value="Oracle Think Tank">Oracle Think Tank</option>
              <option value="Shadow Paladin">Shadow Paladin</option>
              <option value="Gold Paladin">Gold Paladin</option>
              <option value="Narukami">Narukami</option>
              <option value="Aqua Force">Aqua Force</option>
              <option value="Genesis">Genesis</option>
              <option value="Great Nature">Great Nature</option>
              <option value="Neo Nectar">Neo Nectar</option>
              <option value="Spike Brothers">Spike Brothers</option>
              <option value="Dark Irregulars">Dark Irregulars</option>
              <option value="Pale Moon">Pale Moon</option>
              <option value="Gear Chronicle">Gear Chronicle</option>
              <option value="Link Joker">Link Joker</option>
              <option value="Granblue">Granblue</option>
              <option value="Bermuda Triangle">Bermuda Triangle</option>
              <option value="Tachikaze">Tachikaze</option>
              <option value="Murakumo">Murakumo</option>
              <option value="Nubatama">Nubatama</option>
              <option value="Nova Grappler">Nova Grappler</option>
              <option value="Dimension Police">Dimension Police</option>
              <option value="Megacolony">Megacolony</option>
            </select>
          </>
        ) : (
          <>
            <label className="CreateNewDeck-label" htmlFor="nation-select">Nation</label>
            <select
              id="nation-select"
              value={selectedOption} // Use selectedOption for the nation selector
              onChange={(event) => setSelectedOption(event.target.value)} // Update selectedOption
              className="CreateNewDeck-dropdown"
              style={{ outline: `2px solid ${getOutlineColor()}` }}
            >
              <option value="">None</option> {/* Allow no selection */}
              <option value="Keter Sanctuary">Keter Sanctuary</option>
              <option value="Brandt Gate">Brandt Gate</option>
              <option value="Stoicheia">Stoicheia</option>
              <option value="Dark States">Dark States</option>
              <option value="Dragon Empire">Dragon Empire</option>
              <option value="Lyrical Monestario">Lyrical Monestario</option>
            </select>
          </>
        )}
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
              <label className="CreateNewDeck-label" htmlFor="set-select">Set</label>
              <select
                id="set-select"
                value={selectedSet}
                onChange={handleSetChange}
                className="CreateNewDeck-dropdown"
                style={{ outline: `2px solid ${getOutlineColor()}` }}
              >
                <option value="">None</option>
                {sets.map((set, index) => (
                  <option key={index} value={set}>{set}</option>
                ))}
              </select>
          </div>

        <div className="CreateNewDeck-selector">
          <label className="CreateNewDeck-label" htmlFor="unit-type-select">Card Type</label>
          <select
            id="unit-type-select"
            value={selectedUnitType}
            onChange={(e) => setSelectedUnitType(e.target.value)}
            className="CreateNewDeck-dropdown"
            style={{ outline: `2px solid ${getOutlineColor()}` }}
          >
              <option value="">None</option> {/* Allow no selection */}
              <option value="Normal Unit">Normal Unit</option>
              <option value="Trigger Unit">Trigger Unit</option>
              <option value="G Unit">G Unit</option>
              <option value="Others">Others</option>
              <option value="Normal Order">Normal Order</option>
              <option value="Set Order">Set Order</option>
              <option value="Blitz Order">Blitz Order</option>
              <option value="Trigger Order">Trigger Order</option>
              <option value="Ride Deck Crest">Ride Deck Crest</option>
          </select>
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
      </div>

      {loading && <div className="loading-spinner"></div>} {/* Show loading spinner */}

      <div className="CreateNewDeck-grid">
        {SearchResult && SearchResult.map((card, index) => {
          const cardCount = CurrentDeck.filter((deckCard) => deckCard.name === card.name).length;
          const gradeNum = card.grade && card.grade.startsWith('Grade ') ? Number(card.grade.replace('Grade ', '')) : null;
          const isRideDeckEligible = format === 'Standard' && [0, 1, 2, 3].includes(gradeNum);

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
              {/* Ride Deck Button (top-left) */}
              {isRideDeckEligible && (
                <button
                  className="CreateNewDeck-ride-button"
                  style={{
                    position: 'absolute',
                    top: 5,
                    left: 5,
                    zIndex: 2,
                    background: rideDeck[gradeNum]?.id === card.id ? '#1976d2' : '#fff',
                    color: rideDeck[gradeNum]?.id === card.id ? '#fff' : '#1976d2',
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
                  title={`Set as Grade ${gradeNum} Ride Deck card`}
                  onClick={e => {
                    e.stopPropagation();
                    handleSelectRideDeck(gradeNum, card);
                  }}
                  disabled={rideDeck[gradeNum]?.id === card.id}
                >
                  {rideDeck[gradeNum]?.id === card.id ? '✓' : '+'}
                </button>
              )}
              {/* Info Button (top-right) */}
              <button
                className="CreateNewDeck-info-button"
                onClick={e => {
                  e.stopPropagation();
                  handleMiddleClick(e, card);
                }}
              >
                ℹ️
              </button>
              <img
                src={`data:image/png;base64,${card.image}`}
                alt={card.name || 'Card Image'}
              />
              <p>{card.name}</p>
              <div className="CreateNewDeck-card-counter">
                {cardCount}
              </div>
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