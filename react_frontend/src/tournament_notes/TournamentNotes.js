import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TournamentNotes.css';
import { fetchUserDecks, createTournament, fetchUserTournaments } from '../api';

function TournamentNotes({ username }) {
  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDescription, setTournamentDescription] = useState('');
  const [selectedDeck, setSelectedDeck] = useState('');
  const [decks, setDecks] = useState([]);
  const [tournaments, setTournaments] = useState([]); // State for tournaments

  const navigate = useNavigate();

  useEffect(() => {
    const loadDecks = async () => {
      try {
        const data = await fetchUserDecks(username);
        setDecks(data);
      } catch (error) {
        console.error('Error fetching decks:', error);
      }
    };

    const loadTournaments = async () => {
      try {
        const data = await fetchUserTournaments(username);
        setTournaments(data);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      }
    };

    loadDecks();
    loadTournaments();
  }, [username]);

  const handleTournamentClick = (tournament) => {
  const selectedDeck = decks.find((deck) => deck.id === tournament.deck_id);
  navigate('/tournament-details', { state: { tournament, deck: selectedDeck } });
};


  const handleCreateTournament = async () => {
    try {
      const selectedDeckId = decks.find((deck) => deck.name === selectedDeck)?.id;

      const tournamentData = {
        name: tournamentName,
        description: tournamentDescription,
        deck_id: selectedDeckId,
        username,
      };

      await createTournament(tournamentData);

      alert(`Tournament "${tournamentName}" created successfully!`);
      setTournamentName('');
      setTournamentDescription('');
      setSelectedDeck('');
      setShowModal(false);

      // Reload tournaments after creating a new one
      const updatedTournaments = await fetchUserTournaments(username);
      setTournaments(updatedTournaments);
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Failed to create tournament. Please try again.');
    }
  };

  return (
    <div className="TournamentNotes-container">
      <h2>Your Tournaments</h2>
      <div className="TournamentNotes-list">
          {tournaments.length > 0 ? (
            tournaments.map((tournament) => {
              const deck = decks.find((deck) => deck.id === tournament.deck_id); // Find the deck by ID
              return (
                <div
                  key={tournament.id}
                  className="TournamentNotes-item"
                  onClick={() => handleTournamentClick(tournament)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="TournamentNotes-field"><strong>Name:</strong> {tournament.name}</span>
                  <span className="TournamentNotes-field"><strong>Description:</strong> {tournament.description}</span>
                  <span className="TournamentNotes-field"><strong>Deck Name:</strong> {deck ? deck.name : 'Unknown Deck'}</span>
                </div>
              );
            })
          ) : (
            <p>No tournaments found.</p>
          )}
        </div>

      <button onClick={() => setShowModal(true)} className="TournamentNotes-save-button">
        Create new tournament +
      </button>

      {showModal && (
        <div className="TournamentNotes-modal">
          <div className="TournamentNotes-modal-content">
            <h3>Create New Tournament</h3>
            <label>
              Tournament Name:
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
            </label>
            <label>
              Tournament Description:
              <textarea
                value={tournamentDescription}
                onChange={(e) => setTournamentDescription(e.target.value)}
              />
            </label>
            <label>
              Select Deck:
              <select
                value={selectedDeck}
                onChange={(e) => setSelectedDeck(e.target.value)}
              >
                <option value="" disabled>
                  Select a deck
                </option>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.name}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={handleCreateTournament}
              disabled={!tournamentName || !selectedDeck || !tournamentDescription}
            >
              Create Tournament
            </button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TournamentNotes;