import React, { useState } from 'react';
import { SearchCard } from './api'; // Import the HTTP request function
import './CreateNewDeck.css'; // Import the CSS file

function CreateNewDeck() {
  const [selectedOption, setSelectedOption] = useState('');
  const [CardSearch, setCardSearch] = useState('');
  const [SearchResult, setSearchResult] = useState('');
  const [CurrentDeck, setCurrentDeck] = useState([]); ;
  const [DeckName, setDeckName] = useState('');

  const handleChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const getOutlineColor = () => {
    switch (selectedOption) {
      case 'Keter Sanctuary': return 'gold';
      case 'Brandt Gate': return 'white';
      case 'Stocheia': return 'green';
      case 'Dark States': return 'blue';
      case 'Dragon Empire': return 'red';
      case 'Lyrical monestario': return 'pink';
      default: return 'black';
    }
  };

  const handleKeyPress = async (event) => {
    if (event.key === 'Enter') {
      try {
        const result = await SearchCard(CardSearch, selectedOption); // Call the HTTP request function
        setSearchResult(result);
      } catch (error) {
        console.error('failed to search', error);
      }
    }
  };

  const handleCardClick = (card) => {
    console.log('Card clicked:', card);
    if (CurrentDeck.length >= 50) {
      alert('You can only add 50 cards to a deck!'); // Alert if the deck exceeds 50 cards
      return;
    }
    setCurrentDeck((prevDeck) => [...prevDeck, card]); // Update the state with a new card
  };

  return (
    <div className="CreateNewDeck-container">
      <h2 className="CreateNewDeck-title">Create New Deck</h2>
      <p>Create a deck of a nation of your choosing.</p>
  
      {/* Dropdown menu */}
      <select
        value={selectedOption}
        onChange={handleChange}
        className="CreateNewDeck-dropdown"
        style={{ outline: `2px solid ${getOutlineColor()}` }} // Dynamic outline color
      >
        <option value="" disabled>Select an option</option>
        <option value="Keter Sanctuary">Keter Sanctuary</option>
        <option value="Brandt Gate">Brandt Gate</option>
        <option value="Stocheia">Stocheia</option>
        <option value="Dark States">Dark States</option>
        <option value="Dragon Empire">Dragon Empire</option>
        <option value="Lyrical monestario">Lyrical monestario</option>
      </select>
  
      {/* Text input field */}
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
          style={{ backgroundColor: `${getOutlineColor()}` }} // Dynamic background color
        >
          Search
        </button>
      </div>
  
      {/* Grid container */}
      <div className="CreateNewDeck-grid">
        {SearchResult && SearchResult.map((card, index) => {
          const cardCount = CurrentDeck.filter((deckCard) => deckCard.name === card.name).length; // Count occurrences of the card in CurrentDeck

          return (
            <div
              key={index}
              className="CreateNewDeck-card"
              onClick={() => handleCardClick(card)}
              style={{
                position: 'relative', // Ensure relative positioning for the counter
                cursor: 'pointer',
                display: 'inline-block', // Ensure the card wraps tightly around the image
              }}
            >
              <img
                src={`data:image/png;base64,${card.image}`}
                alt={card.name || 'Card Image'}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
              <p>{card.name}</p>
              <div
                className="CreateNewDeck-card-counter"
                style={{
                  position: 'absolute',
                  bottom: '40px', // Position the counter at the bottom
                  right: '5px', // Position the counter at the right
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                {cardCount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CreateNewDeck;