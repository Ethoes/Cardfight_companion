import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
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
import CardfightLobby from './cardfight/CardfightLobby.js';
import CardfightMatch from './cardfight/CardfightMatch.js';
import RulesQuery from './rules_query/RulesQuery.js';
import './styles/polish.css'; // Shared tokens, transitions and modal styles (imported last so it wins)
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
      <Register onRegister={() => setIsRegistering(false)} onCancel={() => setIsRegistering(false)} />
    ) : (
      <Login onLogin={handleLogin} onShowRegister={() => setIsRegistering(true)} />
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

  // Start each new page at the top so the enter animation is visible
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    // Keying on the location remounts the wrapper, which replays the CSS
    // enter animation. Only the incoming page is rendered, so there's no
    // overlap/jump between the old and new page.
    <div key={location.key} className="page-transition">
      <Routes location={location}>
        <Route path="/deck-builder" element={<DeckBuilder />} />
        <Route path="/view-decks" element={<ViewDecks username={username} />} />
        <Route path="/view-user-decks" element={<UserDecks username={username} />} />
        <Route path="/deck-details" element={<DeckDetails />} />
        <Route path="/tournament-notes" element={<TournamentNotes username={username} />} />
        <Route path="/tournament-details" element={<TournamentDetails />} />
        <Route path="/test-hand" element={<TestHand />} />
        <Route path="/cardfight" element={<CardfightLobby username={username} />} />
        <Route path="/cardfight/:roomId" element={<CardfightMatch />} />
        <Route path="/rules-query" element={<RulesQuery />} />
        <Route
          path="/"
          element={
            <div className="App-main">
              <div className="App-buttons-container">
                <Link to="/cardfight">
                  <button>Cardfight</button>
                </Link>
                <Link to="/deck-builder">
                  <button>Go to Deck Builder</button>
                </Link>
                <Link to="/view-user-decks">
                  <button>View all Decks</button>
                </Link>
                <Link to="/tournament-notes">
                  <button>Go to Tournament Notes</button>
                </Link>
                <Link to="/rules-query">
                  <button>Ask Rules Questions</button>
                </Link>
              </div>
            </div>
          }
        />
        <Route path="/create-new-deck" element={<CreateNewDeck username={username} />} />
      </Routes>
    </div>
  );
}

export default App;