import React, { useState } from 'react';
import CardSearch from '../components/CardSearch';
import './RulesQuery.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

function RulesQuery() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showCardSearch, setShowCardSearch] = useState(false);
  const [modalCard, setModalCard] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleCardSelect = (card) => {
    if (!selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(prev => [...prev, card]);
    }
  };

  const handleCardRemove = (cardId) => {
    setSelectedCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleCardInfo = (card) => {
    setModalCard(card);
  };

  const closeModal = () => {
    setModalCard(null);
  };

  const buildQuestionWithContext = () => {
    if (selectedCards.length === 0) {
      return question.trim();
    }

    const cardContext = selectedCards.map(card => {
      return `Card: ${card.name}\n` +
             `Effect: ${card.effect || 'N/A'}\n` +
             `Type: ${card.type || 'N/A'}\n` +
             `Grade: ${card.grade || 'N/A'}\n` +
             `Power: ${card.power || 'N/A'}\n` +
             `Nation/Clan: ${card.nation || card.clan || 'N/A'}`;
    }).join('\n\n');

    return `Context Cards:\n${cardContext}\n\nQuestion: ${question.trim()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const questionWithContext = buildQuestionWithContext();
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);
    setFeedbackSubmitted(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: questionWithContext }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnswer(data);
      } else {
        setError(data.error || 'Failed to get answer');
      }
    } catch (error) {
      console.error('Error asking rules question:', error);
      setError('Failed to connect to rules service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (feedbackType, userComment = null) => {
    if (!answer) return;

    try {
      const feedbackData = {
        question: buildQuestionWithContext(),
        answer: answer.answer,
        feedback_type: feedbackType,
        context_cards: selectedCards.length > 0 ? selectedCards : null,
        context_sources: answer.context_sources || null,
        similarity_scores: answer.relevance_info?.similarity_scores || null,
        user_comment: userComment
      };

      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        console.log(`Feedback submitted: ${feedbackType}`);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleClear = () => {
    setQuestion('');
    setAnswer(null);
    setError(null);
    setSelectedCards([]);
    setShowCardSearch(false);
    setFeedbackSubmitted(false);
  };

  return (
    <div className="rules-query">
      <div className="rules-query-header">
        <h1>Vanguard Rules Assistant</h1>
        <p>Ask any Cardfight!! Vanguard rules question and get an AI-powered answer</p>
      </div>

      <div className="rules-query-content">
        {/* Selected Cards Display */}
        {selectedCards.length > 0 && (
          <div className="selected-cards-section">
            <h3>Selected Cards for Context ({selectedCards.length})</h3>
            <div className="selected-cards-grid">
              {selectedCards.map((card, index) => (
                <div key={index} className="selected-card">
                  <img 
                    src={`data:image/png;base64,${card.image}`} 
                    alt={card.name} 
                    className="selected-card-image"
                  />
                  <div className="selected-card-info">
                    <p className="selected-card-name">{card.name}</p>
                    <p className="selected-card-type">{card.type} - {card.grade}</p>
                  </div>
                  <button 
                    className="remove-card-button"
                    onClick={() => handleCardRemove(card.id)}
                    title="Remove card from context"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card Search Toggle */}
        <div className="card-search-section">
          <button 
            className="toggle-card-search"
            onClick={() => setShowCardSearch(!showCardSearch)}
          >
            {showCardSearch ? 'Hide Card Search' : 'Add Cards for Context'}
          </button>
          
          {showCardSearch && (
            <div className="card-search-wrapper">
              <p className="card-search-description">
                Search for cards to add context to your question. Selected cards' effects and details will be included with your question.
              </p>
              <CardSearch
                onCardSelect={handleCardSelect}
                onCardInfo={handleCardInfo}
                showCardCounts={false}
                showAddButton={true}
                compact={true}
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="question-form">
          <div className="question-input-container">
            <label htmlFor="question">Your Question:</label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your Cardfight!! Vanguard rules question here..."
              className="question-input"
              rows={4}
              maxLength={500}
            />
            <div className="character-count">
              {question.length}/500 characters
            </div>
          </div>

          <div className="form-buttons">
            <button 
              type="submit" 
              disabled={loading || !question.trim()}
              className="ask-button"
            >
              {loading ? 'Asking...' : 'Ask Question'}
            </button>
            <button 
              type="button" 
              onClick={handleClear}
              className="clear-button"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Thinking... this may take a moment</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={() => setError(null)} className="dismiss-button">
              Dismiss
            </button>
          </div>
        )}

        {/* Answer Display */}
        {answer && answer.success && (
          <div className={`answer-section ${answer.answer.toLowerCase().includes("don't have sufficient information") ? 'insufficient-info' : ''}`}>
            <h3>
              {answer.answer.toLowerCase().includes("don't have sufficient information") ? 'Insufficient Information' : 'Answer'}
            </h3>
            <div className="answer-content">
              <p>{answer.answer}</p>
              
              {answer.context_sources && answer.context_sources.length > 0 && (
                <div className="context-sources">
                  <h4>Sources Found:</h4>
                  <ul>
                    {answer.context_sources.map((source, index) => (
                      <li key={index}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {answer.relevance_info && (
                <div className="relevance-info">
                  <details>
                    <summary>Relevance Details</summary>
                    <ul>
                      <li>Rules chunks found: {answer.relevance_info.found_chunks}</li>
                      {answer.relevance_info.similarity_scores && (
                        <li>Similarity scores: {answer.relevance_info.similarity_scores.map(score => score.toFixed(3)).join(', ')}</li>
                      )}
                      {answer.relevance_info.ai_indicated_insufficient && (
                        <li>AI determined the found rules were not sufficient to answer the question</li>
                      )}
                    </ul>
                  </details>
                </div>
              )}
            </div>

            <div className="answer-footer">
              {/* Feedback Section */}
              {!feedbackSubmitted ? (
                <div className="feedback-section">
                  <p className="feedback-prompt">
                    <strong>Was this answer helpful?</strong>
                  </p>
                  <div className="feedback-buttons">
                    <button 
                      onClick={() => handleFeedback('good')} 
                      className="feedback-button good"
                      title="This answer was helpful and accurate"
                    >
                      👍 Yes, helpful
                    </button>
                    <button 
                      onClick={() => handleFeedback('bad')} 
                      className="feedback-button bad"
                      title="This answer was not helpful or inaccurate"
                    >
                      👎 No, not helpful
                    </button>
                  </div>
                </div>
              ) : (
                <div className="feedback-submitted">
                  <p>✅ Thank you for your feedback! This helps improve future answers.</p>
                </div>
              )}

              {answer.answer.toLowerCase().includes("don't have sufficient information") ? (
                <p className="disclaimer">
                  <strong>Suggestion:</strong> Try rephrasing your question more specifically, or consult the full Cardfight!! Vanguard comprehensive rules document or contact a certified judge for clarification.
                </p>
              ) : (
                <p className="disclaimer">
                  <strong>Note:</strong> This answer is AI-generated based on available rules. For official rulings, please consult the official Cardfight!! Vanguard comprehensive rules or contact a judge.
                </p>
              )}
              <button 
                onClick={() => setAnswer(null)} 
                className="ask-another-button"
              >
                Ask Another Question
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Info Modal */}
      {modalCard && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-scrollable-content">
              <img
                src={`data:image/png;base64,${modalCard.image}`}
                alt={modalCard.name || 'Card Image'}
                className="modal-image"
              />
              <h3>{modalCard.name}</h3>
              <p><strong>Effect:</strong> {modalCard.effect}</p>
              <p><strong>Type:</strong> {modalCard.type}</p>
              <p><strong>Grade:</strong> {modalCard.grade}</p>
              <p><strong>Power:</strong> {modalCard.power}</p>
              <p><strong>Critical:</strong> {modalCard.critical}</p>
              <p><strong>Shield:</strong> {modalCard.shield}</p>
              <p><strong>Nation:</strong> {modalCard.nation}</p>
              <p><strong>Race:</strong> {modalCard.race}</p>
              <p><strong>Format:</strong> {modalCard.regulation}</p>
              <p><strong>Illustrator:</strong> {modalCard.illustrator}</p>
              <p><strong>Clan:</strong> {modalCard.clan}</p>
              <p><strong>Flavor:</strong> {modalCard.flavor}</p>
              {modalCard.url && (
                <p><strong>URL:</strong> <a href={modalCard.url} target="_blank" rel="noopener noreferrer">{modalCard.url}</a></p>
              )}
              <p><strong>Set Name:</strong> {modalCard.set_name}</p>
              <p><strong>Rarity:</strong> {modalCard.rarity}</p>
              <p><strong>Skill:</strong> {modalCard.skill}</p>
              <p><strong>Gift:</strong> {modalCard.gift}</p>
              <p><strong>Card Number:</strong> {modalCard.number}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RulesQuery;