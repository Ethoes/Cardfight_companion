export const fetchCardImage = async (cardId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/card/${cardId}/image`);
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        return { imageUrl, error: null };
      } else {
        return { imageUrl: null, error: 'Image not found' };
      }
    } catch (error) {
      return { imageUrl: null, error: 'Error fetching image' };
    }
  };