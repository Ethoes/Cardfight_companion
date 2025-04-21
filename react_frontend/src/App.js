import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import Login from './login/login.js';
import Register from './login/register.js';
import { fetchCardImage } from './database/databaseApi.js';
import Banner from './banner.js';
import DeckBuilder from './deckbuilder';
import CreateNewDeck from './CreateNewDeck.js'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [cardId, setCardId] = useState('');
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // Only allow numbers
      setCardId(value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearch = async () => {
    if (cardId) {
      const { imageUrl, error } = await fetchCardImage(cardId);
      setImageSrc(imageUrl);
      setError(error);
    }
  };

  const handleLogin = (username) => {
    setIsLoggedIn(true);
    setUsername(username);
  };

  if (!isLoggedIn) {
    return isRegistering ? (
      <Register onRegister={() => setIsRegistering(false)} />
    ) : (
      <div>
        <Login onLogin={handleLogin} />
        <button onClick={() => setIsRegistering(true)}>Register</button>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Banner username={username} />
        <Routes>
          <Route path="/deck-builder" element={<DeckBuilder />} />
          <Route path="/" element={
            <div>
              <input
                type="text"
                value={cardId}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter card ID"
              />
              <button onClick={handleSearch}>Search</button>
              {error && <p>{error}</p>}
              {imageSrc && <img src={imageSrc} alt="Card" />}
              <Link to="/deck-builder">
                <button>Go to Deck Builder</button>
              </Link>
            </div>
          } />
          <Route path="/create-new-deck" element={<CreateNewDeck />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;