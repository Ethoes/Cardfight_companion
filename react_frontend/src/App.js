import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import Login from './login/login.js';
import Register from './login/register.js';
import { fetchCardImage } from './database/databaseApi.js';
import Banner from './banner/banner.js';
import DeckBuilder from './deckbuilder/deckbuilder.js';
import CreateNewDeck from './create_new_deck/CreateNewDeck.js'
import ViewDecks from './view_deck/ViewDecks.js';
import DeckDetails from './deck_details/DeckDetails.js';
import TournamentNotes from './tournament_notes/TournamentNotes.js';
import TournamentDetails from './tournament_notes/tournament_details/TournamentDetails.js';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');

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
          <Route path="/tournament-notes" element={<TournamentNotes username={username}/>} />
          <Route path="/tournament-details" element={<TournamentDetails />} />
          <Route path="/" element={
            <div>
              <Link to="/deck-builder">
                <button>Go to Deck Builder</button>
              </Link>
              <Link to="/tournament-notes">
                <button>Go to Tournament Notes</button>
              </Link>
            </div>
          } />
          <Route path="/create-new-deck" element={<CreateNewDeck username={username} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;