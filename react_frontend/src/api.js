// Replace all instances of 'http://127.0.0.1:5000' with your Railway backend URL

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

export async function SearchCard(CardSearch, selectedOption, selectedGrade, selectedUnitType, format, selectedClan, selectedSet) {
    try {
      console.log(selectedSet)
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: CardSearch, nation: selectedOption, grade: selectedGrade, unitType: selectedUnitType, format: format, clan: selectedClan, selectedSet: selectedSet }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Searched succesfully:', data);
      return data;
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  }

  export async function postNewDeck(Deckname, CurrentDeck, User, description, format, rideDeck = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/createDeck`, {
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
      const response = await fetch(`${API_BASE_URL}/decks`, {
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
      const response = await fetch(`${API_BASE_URL}/createTournament`, {
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
      const response = await fetch(`${API_BASE_URL}/tournaments`, {
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
    const response = await fetch(`${API_BASE_URL}/saveTournamentDetails`, {
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
    const response = await fetch(`${API_BASE_URL}/tournamentDetails`, {
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