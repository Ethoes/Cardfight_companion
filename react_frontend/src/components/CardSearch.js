import React, { useState, useEffect } from 'react';
import { SearchCard } from '../api';
import './CardSearch.css';

// Import API base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CardSearch({ 
  onCardSelect, 
  onCardInfo, 
  showCardCounts = false, 
  currentDeck = [], 
  format = null,
  initialFilters = {},
  showAddButton = false,
  compact = false 
}) {
  const [selectedOption, setSelectedOption] = useState(initialFilters.nation || '');
  const [selectedClan, setSelectedClan] = useState(initialFilters.clan || '');
  const [selectedSet, setSelectedSet] = useState(initialFilters.set || '');
  const [sets, setSets] = useState([]);
  const [cardSearch, setCardSearch] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(initialFilters.grade || '');
  const [selectedUnitType, setSelectedUnitType] = useState(initialFilters.unitType || '');

  const getOutlineColor = () => {
    switch (selectedOption) {
      case 'Keter Sanctuary': return 'gold';
      case 'Brandt Gate': return 'white';
      case 'Stoicheia': return 'green';
      case 'Dark States': return 'blue';
      case 'Dragon Empire': return 'red';
      case 'Lyrical monestario': return 'pink';
      default: return 'purple';
    }
  };

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/sets?format=${format || ''}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSets(data);
      } catch (error) {
        console.error('Error fetching sets:', error);
      }
    };

    fetchSets();
  }, [format]);

  const handleSearch = async () => {
    setSearchResult([]);
    setLoading(true);

    try {
      const result = await SearchCard(
        cardSearch,
        selectedOption,
        selectedGrade,
        selectedUnitType,
        format === 'Standard' ? format : null,
        selectedClan,
        selectedSet
      );
      setSearchResult(result);
    } catch (error) {
      console.error('Failed to search', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCardClick = (card) => {
    if (onCardSelect) {
      onCardSelect(card);
    }
  };

  const handleCardInfo = (card) => {
    if (onCardInfo) {
      onCardInfo(card);
    }
  };

  const getCardCount = (card) => {
    if (!showCardCounts || !currentDeck) return 0;
    return currentDeck.filter((deckCard) => deckCard.id === card.id).length;
  };

  return (
    <div className={`card-search-container ${compact ? 'compact' : ''}`}>
      <div className="card-search-selectors">
        {/* Nation/Clan Selector */}
        <div className="card-search-selector">
          {format === 'Premium' ? (
            <>
              <label htmlFor="clan-select">Clan</label>
              <select
                id="clan-select"
                value={selectedClan}
                onChange={(e) => setSelectedClan(e.target.value)}
                className="card-search-dropdown"
                style={{ outline: `2px solid ${getOutlineColor()}` }}
              >
                <option value="">None</option>
                <option value="Royal Paladin">Royal Paladin</option>
                <option value="Kagero">Kagero</option>
                <option value="Oracle Think Tank">Oracle Think Tank</option>
                <option value="Shadow Paladin">Shadow Paladin</option>
                <option value="Gold Paladin">Gold Paladin</option>
                <option value="Narukami">Narukami</option>
                <option value="Aqua Force">Aqua Force</option>
                <option value="Genesis">Genesis</option>
                <option value="Great Nature">Great Nature</option>
                <option value="Neo Nectar">Neo Nectar</option>
                <option value="Spike Brothers">Spike Brothers</option>
                <option value="Dark Irregulars">Dark Irregulars</option>
                <option value="Pale Moon">Pale Moon</option>
                <option value="Gear Chronicle">Gear Chronicle</option>
                <option value="Link Joker">Link Joker</option>
                <option value="Granblue">Granblue</option>
                <option value="Bermuda Triangle">Bermuda Triangle</option>
                <option value="Tachikaze">Tachikaze</option>
                <option value="Murakumo">Murakumo</option>
                <option value="Nubatama">Nubatama</option>
                <option value="Nova Grappler">Nova Grappler</option>
                <option value="Dimension Police">Dimension Police</option>
                <option value="Megacolony">Megacolony</option>
              </select>
            </>
          ) : (
            <>
              <label htmlFor="nation-select">Nation</label>
              <select
                id="nation-select"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="card-search-dropdown"
                style={{ outline: `2px solid ${getOutlineColor()}` }}
              >
                <option value="">None</option>
                <option value="Keter Sanctuary">Keter Sanctuary</option>
                <option value="Brandt Gate">Brandt Gate</option>
                <option value="Stoicheia">Stoicheia</option>
                <option value="Dark States">Dark States</option>
                <option value="Dragon Empire">Dragon Empire</option>
                <option value="Lyrical Monestario">Lyrical Monestario</option>
              </select>
            </>
          )}
        </div>

        {/* Grade Selector */}
        <div className="card-search-selector">
          <label htmlFor="grade-select">Grade</label>
          <select
            id="grade-select"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="card-search-dropdown"
            style={{ outline: `2px solid ${getOutlineColor()}` }}
          >
            <option value="">None</option>
            <option value="Grade 0">Grade 0</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
          </select>
        </div>

        {/* Set Selector */}
        <div className="card-search-selector">
          <label htmlFor="set-select">Set</label>
          <select
            id="set-select"
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            className="card-search-dropdown"
            style={{ outline: `2px solid ${getOutlineColor()}` }}
          >
            <option value="">None</option>
            {sets.map((set, index) => (
              <option key={index} value={set}>{set}</option>
            ))}
          </select>
        </div>

        {/* Unit Type Selector */}
        <div className="card-search-selector">
          <label htmlFor="unit-type-select">Card Type</label>
          <select
            id="unit-type-select"
            value={selectedUnitType}
            onChange={(e) => setSelectedUnitType(e.target.value)}
            className="card-search-dropdown"
            style={{ outline: `2px solid ${getOutlineColor()}` }}
          >
            <option value="">None</option>
            <option value="Normal Unit">Normal Unit</option>
            <option value="Trigger Unit">Trigger Unit</option>
            <option value="G Unit">G Unit</option>
            <option value="Others">Others</option>
            <option value="Normal Order">Normal Order</option>
            <option value="Set Order">Set Order</option>
            <option value="Blitz Order">Blitz Order</option>
            <option value="Trigger Order">Trigger Order</option>
            <option value="Ride Deck Crest">Ride Deck Crest</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="card-search-input-container">
        <input
          type="text"
          value={cardSearch}
          onChange={(e) => setCardSearch(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Search for a card and press Enter"
          className="card-search-input"
        />
        <button
          onClick={handleSearch}
          className="card-search-button"
          style={{ backgroundColor: getOutlineColor() }}
        >
          Search
        </button>
      </div>

      {loading && <div className="loading-spinner"></div>}

      {/* Search Results */}
      <div className="card-search-grid">
        {searchResult.map((card, index) => {
          const cardCount = getCardCount(card);

          return (
            <div
              key={index}
              className="card-search-card"
              onClick={() => handleCardClick(card)}
              style={{
                position: 'relative',
                cursor: 'pointer',
                display: 'inline-block',
              }}
            >
              {/* Info Button */}
              <button
                className="card-search-info-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardInfo(card);
                }}
              >
                ℹ️
              </button>
              
              {/* Add Button (if enabled) */}
              {showAddButton && (
                <button
                  className="card-search-add-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(card);
                  }}
                >
                  +
                </button>
              )}

              <img
                src={`data:image/png;base64,${card.image}`}
                alt={card.name || 'Card Image'}
              />
              <p>{card.name}</p>
              
              {/* Card Counter */}
              {showCardCounts && (
                <div className="card-search-card-counter">
                  {cardCount}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CardSearch;