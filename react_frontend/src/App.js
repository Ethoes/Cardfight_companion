import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import Login from './login/login.js';
import Register from './login/register.js';
import Banner from './banner/banner.js';
import DeckBuilder from './deckbuilder/deckbuilder.js';
import CreateNewDeck from './create_new_deck/CreateNewDeck.js';
import ViewDecks from './view_deck/ViewDecks.js';
import DeckDetails from './deck_details/DeckDetails.js';
import TournamentNotes from './tournament_notes/TournamentNotes.js';
import TournamentDetails from './tournament_notes/tournament_details/TournamentDetails.js';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Adjust sensitivity by increasing the divisor
      const offsetX = (clientX - centerX) / 50; // Slower reaction
      const offsetY = (clientY - centerY) / 50;

      const root = document.documentElement;

      root.style.setProperty('--mouse-x', `${offsetX}px`);
      root.style.setProperty('--mouse-y', `${offsetY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

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
          <Route path="/view-decks" element={<ViewDecks username={username} />} />
          <Route path="/deck-details" element={<DeckDetails />} />
          <Route path="/tournament-notes" element={<TournamentNotes username={username} />} />
          <Route path="/tournament-details" element={<TournamentDetails />} />
          <Route
            path="/"
            element={
              <div className="App-main">
                <div className="App-buttons-container">
                  <Link to="/deck-builder">
                    <button>Go to Deck Builder</button>
                  </Link>
                  <Link to="/tournament-notes">
                    <button>Go to Tournament Notes</button>
                  </Link>
                </div>
              </div>
            }
          />
          <Route path="/create-new-deck" element={<CreateNewDeck username={username} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;