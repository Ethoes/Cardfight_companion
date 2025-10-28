import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUserDecks } from '../api';
import './UserDecks.css';

function UserDecks({ username }) {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
    has_prev: false,
    has_next: false
  });
  
  // Search and sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('deck_id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const navigate = useNavigate();

  // Fetch decks function
  const loadDecks = async (page = 1, search = searchTerm, sortField = 'deck_id', sortDirection = 'desc') => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchAllUserDecks(page, pagination.per_page, search, sortField, sortDirection);
      setDecks(result.decks || []);
      setPagination(result.pagination || {});
    } catch (error) {
      console.error('Error fetching decks:', error);
      setError('Failed to load decks. Please try again.');
      setDecks([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDecks(1, '', sortField, sortDirection);
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      loadDecks(1, searchTerm, sortField, sortDirection);
    }, 500); // Wait 500ms after user stops typing

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm]);

  // Handle sorting
  const handleSort = (field) => {
    let newDirection = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      newDirection = 'desc';
    }
    
    setSortField(field);
    setSortDirection(newDirection);
    loadDecks(1, searchTerm, field, newDirection);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadDecks(newPage, searchTerm, sortField, sortDirection);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleDeckClick = (deck) => {
    navigate('/deck-details', { state: { deck } });
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="user-decks">
        <div className="user-decks-header">
          <h1>All User Decks</h1>
          <p>Loading decks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-decks">
      <div className="user-decks-header">
        <h1>All User Decks</h1>
        <p>Browse decks created by all users in the community</p>
      </div>

      <div className="user-decks-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search decks by name, username, type, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="results-info">
          {pagination.total > 0 ? (
            <>
              Showing {((pagination.page - 1) * pagination.per_page) + 1}-{Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} decks
            </>
          ) : (
            'No decks found'
          )}
        </div>
      </div>

      <div className="user-decks-content">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => loadDecks(pagination.page, searchTerm, sortField, sortDirection)}>
              Try Again
            </button>
          </div>
        )}

        {!error && decks.length === 0 && !loading ? (
          <div className="no-results">
            <h3>No decks found</h3>
            <p>Try adjusting your search terms or check back later for new decks.</p>
          </div>
        ) : (
          <>
            <div className="decks-table-container">
              <table className="decks-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('deck_name')} className="sortable">
                      Deck Name {getSortIcon('deck_name')}
                    </th>
                    <th onClick={() => handleSort('username')} className="sortable">
                      Creator {getSortIcon('username')}
                    </th>
                    <th onClick={() => handleSort('deck_type')} className="sortable">
                      Format {getSortIcon('deck_type')}
                    </th>
                    <th onClick={() => handleSort('description')} className="sortable">
                      Description {getSortIcon('description')}
                    </th>
                    <th onClick={() => handleSort('deck_id')} className="sortable">
                      ID {getSortIcon('deck_id')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {decks.map(deck => (
                    <tr key={deck.id} className={deck.username === username ? 'own-deck' : ''}>
                      <td className="deck-name">{deck.deck_name}</td>
                      <td className="username">{deck.username}</td>
                      <td className="deck-type">
                        <span className={`format-badge ${deck.deck_type.toLowerCase()}`}>
                          {deck.deck_type}
                        </span>
                      </td>
                      <td className="description">{deck.description || 'No description'}</td>
                      <td className="deck-id">#{deck.id}</td>
                      <td className="actions">
                        <button className="view-btn" onClick={() => handleDeckClick(deck)}>
                          View
                        </button>
                        {deck.username === username && (
                          <button className="edit-btn" onClick={() => console.log('Edit deck', deck.id)}>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.has_prev || loading}
                  className="pagination-btn"
                >
                  Previous
                </button>
                
                {[...Array(Math.min(pagination.pages, 10))].map((_, index) => {
                  // Show first few, current area, and last few pages
                  let pageNumber;
                  if (pagination.pages <= 10) {
                    pageNumber = index + 1;
                  } else {
                    // Complex pagination logic for many pages
                    if (index < 3) {
                      pageNumber = index + 1;
                    } else if (index >= pagination.pages - 3) {
                      pageNumber = pagination.pages - (pagination.pages - index - 1);
                    } else {
                      pageNumber = pagination.page - 1 + (index - 4);
                    }
                  }
                  
                  if (pageNumber < 1 || pageNumber > pagination.pages) return null;
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={loading}
                      className={`pagination-btn ${pagination.page === pageNumber ? 'active' : ''}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.has_next || loading}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}

            {loading && (
              <div className="loading-overlay">
                <p>Loading...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UserDecks;