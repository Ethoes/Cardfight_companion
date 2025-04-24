import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchCard, postNewDeck } from './api'; // Import the HTTP request function
import './CreateNewDeck.css'; // Import the CSS file

function CreateNewDeck({ username }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [CardSearch, setCardSearch] = useState('');
  const [SearchResult, setSearchResult] = useState('');
  const [CurrentDeck, setCurrentDeck] = useState([]); ;
  const [DeckName, setDeckName] = useState('');
  const [DeckDescription, setDeckDescription] = useState('');

  const navigate = useNavigate();

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
  
    // Check if the deck already has 50 cards
    if (CurrentDeck.length >= 50) {
      alert('You can only add 50 cards to a deck!');
      return;
    }
  
    // Count occurrences of the card's ID in the deck
    const cardCount = CurrentDeck.filter((deckCard) => deckCard.id === card.id).length;
    if (cardCount >= 4) {
      alert('You can only add up to 4 of the same card to a deck!');
      return;
    }
  
    // Add the card to the deck
    setCurrentDeck((prevDeck) => [...prevDeck, card]);
  };

  const handleCardRemove = (card) => {
    console.log('Card removed:', card);
  
    // Remove one instance of the card from the deck
    setCurrentDeck((prevDeck) => {
      const cardIndex = prevDeck.findIndex((deckCard) => deckCard.id === card.id);
      if (cardIndex !== -1) {
        const updatedDeck = [...prevDeck];
        updatedDeck.splice(cardIndex, 1); // Remove the card at the found index
        return updatedDeck;
      }
      return prevDeck; // If the card is not found, return the original deck
    });
  };

  const createDeck = async (deckName) => {
    if (deckName.trim() === '') {
      alert('Please enter a valid deck name.');
      return;
    }
  
    if (CurrentDeck.length < 50) {
      alert('You need to add 50 cards to create a deck!');
      return;
    }
  
    // Create a duplicate array without the image field
    const deckWithoutImages = CurrentDeck.map(({ image, ...rest }) => rest);
  
    try {
      const result = await postNewDeck(deckName, deckWithoutImages, username, DeckDescription); // Pass description
      console.log(result.status);
      if (result.status === 200) { // Check for a successful response
        console.log('Deck created:', { name: deckName, description: DeckDescription, cards: deckWithoutImages });
        alert(`Deck "${deckName}" created successfully!`);
        navigate('/'); // Navigate to the home page
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
              onContextMenu={(e) => {
                e.preventDefault(); // Prevent the default context menu from appearing
                handleCardRemove(card); // Call the function to remove the card
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
            style={{ marginTop: '10px', width: '100%', height: '80px' }} // Optional styling
          />
          <button
            onClick={() => createDeck(DeckName)}
            className="CreateNewDeck-deckname-button"
          >
            Create Deck
          </button>
      </div>
    </div>
  );
}

export default CreateNewDeck;