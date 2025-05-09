import React from 'react';
import { useLocation } from 'react-router-dom';
import './TournamentDetails.css';

function TournamentDetails() {
  const location = useLocation();
  const { tournament } = location.state || {};

  if (!tournament) {
    return <p>No tournament selected.</p>;
  }

  const handleAddMatch = () => {
    alert('Add Match functionality coming soon!');
  };

  return (
    <div className="TournamentDetails-container">
      <div className="TournamentDetails-header">
        <h1>{tournament.name}</h1>
        <p>{tournament.description}</p>
      </div>
      <div className="TournamentDetails-info">
        <p><strong>Deck ID:</strong> {tournament.deck_id}</p>
        <p><strong>Created By:</strong> {tournament.username}</p>
      </div>
      <button onClick={handleAddMatch} className="TournamentDetails-add-match-button">
        Add New Match +
      </button>
    </div>
  );
}

export default TournamentDetails;