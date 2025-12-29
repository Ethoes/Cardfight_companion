import React, { useState } from 'react';
import './RulesQuery.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

function RulesQuery() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const response = await fetch(`${API_BASE_URL}/rules/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
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

  const handleClear = () => {
    setQuestion('');
    setAnswer(null);
    setError(null);
  };

  return (
    <div className="rules-query">
      <div className="rules-query-header">
        <h1>Vanguard Rules Assistant</h1>
        <p>Ask any Cardfight!! Vanguard rules question and get an AI-powered answer</p>
      </div>

      <div className="rules-query-content">
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
    </div>
  );
}

export default RulesQuery;