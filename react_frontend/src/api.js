export async function SearchCard(CardSearch, selectedOption, selectedGrade, selectedUnitType, format, selectedClan) {
    try {
      const response = await fetch('http://127.0.0.1:5000/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: CardSearch, nation: selectedOption, grade: selectedGrade, unitType: selectedUnitType, format: format, clan: selectedClan }),
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

  export async function postNewDeck(Deckname, CurrentDeck, User, description, format) {
    try {
      const response = await fetch('http://127.0.0.1:5000/createDeck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: Deckname, deck: CurrentDeck, user: User, description: description, format: format }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Deck created succesfully:', data);
      return response;
    } catch (error) {
      console.error('Error creating deck:', error);
      throw error;
    }
  }