import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import './TournamentDetails.css';
import { saveTournamentDetails, fetchTournamentDetails } from '../../api';

function TournamentDetails() {
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const { tournament, deck } = location.state || {};
  const [showModal, setShowModal] = useState(false);
  const [matchNumber, setMatchNumber] = useState('');
  const [opponentDeckName, setOpponentDeckName] = useState('');
  const [opponentDeckLog, setOpponentDeckLog] = useState('');
  const [matchResult, setMatchResult] = useState('');
  const [matchNotes, setMatchNotes] = useState('');
  const [tournamentDetails, setTournamentDetails] = useState([]);

  useEffect(() => {
    if (tournament) {
      const loadTournamentDetails = async () => {
        try {
          const details = await fetchTournamentDetails(tournament.id);
          setTournamentDetails(details);
        } catch (error) {
          console.error('Error fetching tournament details:', error);
        }
      };

      loadTournamentDetails();
    }
  }, [tournament]);

  if (!tournament || !deck) {
    return <p>No tournament selected.</p>;
  }

  const handleAddMatch = () => {
    setShowModal(true);
  };

  const handleSaveMatch = async () => {
    if (!matchNumber.trim() || !opponentDeckName.trim() || !matchResult.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    if (opponentDeckLog.trim().length !== 5) {
      alert('The decklog must be exactly 5 characters long.');
      return;
    }

    const tournamentDetailsData = {
      tournament_id: tournament.id,
      match_number: parseInt(matchNumber, 10),
      opponent_deck_name: opponentDeckName,
      opponent_deck_log: opponentDeckLog,
      match_result: matchResult,
      match_notes: matchNotes,
    };

    try {
      await saveTournamentDetails(tournamentDetailsData);
      alert(`Match ${matchNumber} added successfully!`);

      // Reload tournament details after saving
      const updatedDetails = await fetchTournamentDetails(tournament.id);
      setTournamentDetails(updatedDetails);

      // Reset the modal state
      setMatchNumber('');
      setOpponentDeckName('');
      setOpponentDeckLog('');
      setMatchResult('');
      setMatchNotes('');
      setShowModal(false);
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Failed to save match. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setMatchNumber('');
    setOpponentDeckName('');
    setOpponentDeckLog('');
    setMatchResult('');
    setMatchNotes('');
  };

  const handleViewDeckDetails = () => {
    navigate('/deck-details', { state: { deck } }); // Navigate to DeckDetails and pass the deck
  };

  return (
    <div className="TournamentDetails-container">
      <div className="TournamentDetails-header">
        <h1>{tournament.name}</h1>
        <p>{tournament.description}</p>
      </div>
      <div
        className="TournamentDetails-info clickable"
        onClick={handleViewDeckDetails} // Add the onClick handler to the div
      >
        <p><strong>Deck Name:</strong> {deck.name}</p>
        <p><strong>Deck Description:</strong> {deck.description || 'No description available'}</p>
        <p><strong>Deck Type:</strong> {deck.deck_type || 'No format found'}</p>
        <p><strong>Created By:</strong> {tournament.username}</p>
      </div>
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Match</h3>
            <label>
              <input
                type="number"
                value={matchNumber}
                onChange={(e) => setMatchNumber(e.target.value)}
                placeholder="Enter match number"
                className="match-number"
              />
            </label>
            <label>
              <input
                type="text"
                value={opponentDeckName}
                onChange={(e) => setOpponentDeckName(e.target.value)}
                placeholder="Enter opponent's deck name"
              />
            </label>
            <label>
              <input
                type="text"
                value={opponentDeckLog}
                onChange={(e) => {
                  if (e.target.value.length <= 5) {
                    setOpponentDeckLog(e.target.value);
                  }
                }}
                placeholder="Enter opponent's decklog (5 chars)"
                className="opponent-decklog"
                maxLength="5" // Restrict input to 5 characters
              />
            </label>
            <label>
              <select
                value={matchResult}
                onChange={(e) => setMatchResult(e.target.value)}
              >
                <option value="" disabled>Select result</option>
                <option value="Win">Win</option>
                <option value="Lose">Lose</option>
                <option value="Double Loss">Double Loss</option>
              </select>
            </label>
            <label>
              Notes:
              <textarea
                value={matchNotes}
                onChange={(e) => setMatchNotes(e.target.value)}
                placeholder="Enter notes about the match"
              />
            </label>
            <div className="modal-buttons">
              <button onClick={handleSaveMatch} className="save-button">
                Save
              </button>
              <button onClick={handleCloseModal} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="TournamentDetails-list">
        <h3>Match Details</h3>
        {tournamentDetails.length > 0 ? (
          <div className="TournamentDetails-table">
            <div className="TournamentDetails-row TournamentDetails-header-row">
              <div>Match Number</div>
              <div>Opponent's Deck Name</div>
              <div>Opponent Deck Log</div>
              <div>Result</div>
              <div>Notes</div>
            </div>
            {tournamentDetails.map((detail, index) => (
              <div key={index} className="TournamentDetails-row">
                <div>{detail.match_number}</div>
                <div>{detail.opponent_deck_name}</div>
                <div>
                  {detail.opponent_deck_log ? (
                    <a
                      href={`https://decklog-en.bushiroad.com/view/${detail.opponent_deck_log}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="decklog-link"
                    >
                      {detail.opponent_deck_log}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </div>
                <div>{detail.match_result}</div>
                <div>{detail.match_notes || 'N/A'}</div>
              </div>
            ))}
          </div>
        ) : (
          <p>No match details found.</p>
        )}
      </div>
      <button onClick={handleAddMatch} className="TournamentDetails-add-match-button">
        Add New Match +
      </button>
    </div>
  );
}

export default TournamentDetails;