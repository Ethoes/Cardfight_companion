import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group'; // Import transition components
import './App.css';
import Login from './login/login.js';
import Register from './login/register.js';
import Banner from './banner/banner.js';
import DeckBuilder from './deckbuilder/deckbuilder.js';
import CreateNewDeck from './create_new_deck/CreateNewDeck.js';
import ViewDecks from './view_deck/ViewDecks.js';
import UserDecks from './user_decks/UserDecks.js'; // Add this import
import DeckDetails from './deck_details/DeckDetails.js';
import TournamentNotes from './tournament_notes/TournamentNotes.js';
import TournamentDetails from './tournament_notes/tournament_details/TournamentDetails.js';
import TestHand from './deck_details/test_hand/TestHand.js';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');

  // Load the username from localStorage when the app loads
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  const handleLogin = (username) => {
    setIsLoggedIn(true);
    setUsername(username);
    localStorage.setItem('username', username); // Save the username to localStorage
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    localStorage.removeItem('username'); // Remove the username from localStorage
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
        <Banner username={username} onLogout={handleLogout} />
        <AnimatedRoutes username={username} />
      </div>
    </Router>
  );
}

function AnimatedRoutes({ username }) {
  const location = useLocation(); // Get the current location
  const nodeRef = useRef(null); // Create a ref for the transition node

  return (
    <TransitionGroup component={null}> {/* Avoid wrapping in an extra div */}
      <CSSTransition
        key={location.key}
        classNames="page-transition"
        timeout={300}
        nodeRef={nodeRef} // Pass the ref to CSSTransition
      >
        <div ref={nodeRef}>
          <Routes location={location}>
            <Route path="/deck-builder" element={<DeckBuilder />} />
            <Route path="/view-decks" element={<ViewDecks username={username} />} />
            <Route path="/view-user-decks" element={<UserDecks username={username} />} />
            <Route path="/deck-details" element={<DeckDetails />} />
            <Route path="/tournament-notes" element={<TournamentNotes username={username} />} />
            <Route path="/tournament-details" element={<TournamentDetails />} />
            <Route path="/test-hand" element={<TestHand />} />
            <Route
              path="/"
              element={
                <div className="App-main">
                  <div className="App-buttons-container">
                    <Link to="/deck-builder">
                      <button>Go to Deck Builder</button>
                    </Link>
                    <Link to="/view-user-decks">
                      <button>View My Decks</button>
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
      </CSSTransition>
    </TransitionGroup>
  );
}

export default App;