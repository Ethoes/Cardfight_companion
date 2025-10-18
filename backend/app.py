from flask import Flask
from flask_cors import CORS

# Import route blueprints
from routes.auth_routes import auth_bp
from routes.deck_routes import deck_bp
from routes.card_routes import card_bp
from routes.tournament_routes import tournament_bp
from routes.misc_routes import misc_bp

def create_app():
    app = Flask(__name__)
    CORS(app)  # Basic CORS is fine since ngrok handles the tunneling
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(deck_bp)
    app.register_blueprint(card_bp)
    app.register_blueprint(tournament_bp)
    app.register_blueprint(misc_bp)
    
    return app

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app = create_app()
    app.run(host='127.0.0.1', port=port, debug=False)  # localhost only
