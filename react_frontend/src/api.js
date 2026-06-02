// When served through Flask, API calls use relative URLs with /api prefix
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log(`[API] Using API_BASE_URL: "${API_BASE_URL}"`);
console.log(`[API] REACT_APP_API_URL environment variable: "${process.env.REACT_APP_API_URL}"`);

export async function SearchCard(CardSearch, selectedOption, selectedGrade, selectedUnitType, format, selectedClan, selectedSet) {
    try {
      console.log(`[API] SearchCard called with selectedSet: ${selectedSet}`);
      const url = `${API_BASE_URL}/api/search`;
      console.log(`[API] Making request to: ${url}`);
      
      const requestBody = { 
        name: CardSearch, 
        nation: selectedOption, 
        grade: selectedGrade, 
        unitType: selectedUnitType, 
        format: format, 
        clan: selectedClan, 
        selectedSet: selectedSet 
      };
      console.log(`[API] Request body:`, requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log(`[API] Response status: ${response.status}`);
      console.log(`[API] Response headers:`, response.headers);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] Error response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }
  
      const data = await response.json();
      console.log('[API] Searched successfully:', data);
      return data;
    } catch (error) {
      console.error('[API] Error searching:', error);
      throw error;
    }
  }

  export async function postNewDeck(Deckname, CurrentDeck, User, description, format, rideDeck = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/createDeck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: Deckname, deck: CurrentDeck, user: User, description: description, format: format, rideDeck: rideDeck }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Deck created successfully:', data);
      return { status: response.status, data }; // Return both status and data
    } catch (error) {
      console.error('Error creating deck:', error);
      throw error;
    }
  }  export async function fetchUserDecks(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching decks:', error);
      throw error;
    }
  }
  
  export async function createTournament(tournamentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/createTournament`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tournamentData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  export async function fetchUserTournaments(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }
  }

  export async function saveTournamentDetails(tournamentDetails) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/saveTournamentDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournamentDetails),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving tournament details:', error);
    throw error;
  }
}

export async function fetchTournamentDetails(tournamentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tournamentDetails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tournament_id: tournamentId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json(); // The response now includes deck information
  } catch (error) {
    console.error('Error fetching tournament details:', error);
    throw error;
  }
}

export async function fetchAllUserDecks(page = 1, perPage = 10, search = '', sortField = 'deck_id', sortDirection = 'desc') {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      search: search,
      sort_field: sortField,
      sort_direction: sortDirection
    });

    const response = await fetch(`${API_BASE_URL}/api/all-decks?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all user decks:', error);
    throw error;
  }
}