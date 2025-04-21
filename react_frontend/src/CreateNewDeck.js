import React, { useState } from 'react';
import { SearchCard } from './api'; // Import the HTTP request function

function CreateNewDeck() {
  const [selectedOption, setSelectedOption] = useState('');
  const [CardSearch, setDeckName] = useState('');
  const [SearchResult, setSearchResult] = useState('');

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
        console.log('Deck created:', result);
      } catch (error) {
        console.error('Failed to create deck:', error);
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100vh', // Make the container take the full viewport height
      }}
    >
      <h2>Create New Deck</h2>
      <p>Create a deck of a nation of your choosing.</p>
  
      {/* Dropdown menu */}
      <select
        value={selectedOption}
        onChange={handleChange}
        style={{
          outline: `2px solid ${getOutlineColor()}`,
          padding: '5px',
          borderRadius: '4px',
          display: 'block',
          marginBottom: '10px',
          width: '50%',
        }}
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '50%',
          marginTop: '10px',
        }}
      >
        <input
          type="text"
          value={CardSearch}
          onChange={(e) => setDeckName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleKeyPress(e);
            }
          }}
          placeholder="Search for a card and press Enter"
          style={{
            flex: 1,
            padding: '5px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
        <button
          onClick={() => handleKeyPress({ key: 'Enter' })}
          style={{
            marginLeft: '10px',
            padding: '5px 10px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: `${getOutlineColor()}`,
            color: 'black',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </div>
  
      {/* Grid container */}
      <div
        style={{
          flexGrow: 1, // Allow the grid to grow and take up remaining space
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px',
          marginTop: '20px',
          width: '80%',
          maxHeight: '70%', // Adjust the height as needed
          overflowY: 'auto', // Enable vertical scrolling
          border: '1px solid #ccc', // Optional: Add a border for better visibility
          padding: '10px', // Optional: Add padding inside the container
        }}
      >
        {SearchResult && SearchResult.map((card, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            <img
              src={`data:image/png;base64,${card.image}`} // Assuming the image is base64 encoded
              alt={card.name || 'Card Image'}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              }}
            />
            <p>{card.name}</p> {/* Display card name */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CreateNewDeck;