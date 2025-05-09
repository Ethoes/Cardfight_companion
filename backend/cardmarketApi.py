import requests
from requests_oauthlib import OAuth1

# Cardmarket API credentials
API_BASE_URL = "https://api.cardmarket.com/ws/v2.0/output.json"
APP_TOKEN = "your_app_token"
APP_SECRET = "your_app_secret"
ACCESS_TOKEN = "your_access_token"
ACCESS_TOKEN_SECRET = "your_access_token_secret"

def get_card_price(card_name, card_rarity):
    try:
        # Set up OAuth1 authentication
        auth = OAuth1(APP_TOKEN, APP_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET)

        # Make a request to the Cardmarket API to search for the card
        response = requests.get(f"{API_BASE_URL}/products/{card_name}", auth=auth)
        response.raise_for_status()

        # Parse the response
        data = response.json()
        if "product" in data:
            # Filter the results to match the correct rarity
            for product in data["product"]:
                if product["rarity"] == card_rarity:
                    # Extract the 30-day average price for the correct rarity
                    avg_price = product["priceGuide"]["AVG30"]
                    return avg_price

            print(f"No price data found for card: {card_name} with rarity: {card_rarity}")
            return 0.0
        else:
            print(f"No price data found for card: {card_name}")
            return 0.0
    except Exception as e:
        print(f"Error fetching price for card {card_name}: {e}")
        return 0.0
    
def calculate_deck_cost(deck_cards):
    total_cost = 0.0
    for card in deck_cards:
        card_name = card["name"]
        card_rarity = card["rarity"]  # Include the rarity of the card
        avg_price = get_card_price(card_name, card_rarity)
        total_cost += avg_price
    return total_cost