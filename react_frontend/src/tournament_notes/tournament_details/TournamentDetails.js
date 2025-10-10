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
        // Calculate the next match number
        const allMatchNumbers = tournamentDetails.map((detail) => detail.match_number || 0);
        const highestMatchNumber = Math.max(0, ...allMatchNumbers);
        setMatchNumber(highestMatchNumber + 1); // Set the next match number

        setShowModal(true); // Open the modal
    };


    const handleSaveMatch = async () => {
    if (!matchNumber || isNaN(matchNumber) || matchNumber <= 0) {
      alert('Please enter a valid match number.');
      return;
    }

    if (!opponentDeckName.trim() || !matchResult.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    if (opponentDeckLog.trim().length !== 5) {
      alert('The decklog must be exactly 5 characters long.');
      return;
    }

    const tournamentDetailsData = {
      tournament_id: tournament.id,
      match_number: parseInt(matchNumber, 10), // Ensure matchNumber is an integer
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

  const handleDeleteTournament = async () => {
    if (!tournament) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete the tournament "${tournament.name}"? This action cannot be undone.`);
    
    if (confirmDelete) {
      try {
        const response = await fetch(`http://127.0.0.1:5000/tournaments/${tournament.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert(`Tournament "${tournament.name}" has been deleted successfully.`);
          navigate('/tournament-notes'); // Navigate back to the tournament list
        } else {
          const errorData = await response.json();
          alert(`Failed to delete tournament: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting tournament:', error);
        alert('An error occurred while deleting the tournament. Please try again.');
      }
    }
  };

  return (
    <div className="TournamentDetails-container">
      <button className="delete-tournament-button" onClick={handleDeleteTournament}>
        Delete Tournament
      </button>
      
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
              Match Number:
              <input
                type="number"
                value={matchNumber}
                onChange={(e) => setMatchNumber(e.target.value)}
                placeholder="Enter match number"
                className="match-number"
              />
            </label>
            <label>
              Opponent's Deck Name:
              <input
                type="text"
                value={opponentDeckName}
                onChange={(e) => setOpponentDeckName(e.target.value)}
                placeholder="Enter opponent's deck name"
              />
            </label>
            <label>
              Opponent's Deck Log:
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
              Match Result:
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