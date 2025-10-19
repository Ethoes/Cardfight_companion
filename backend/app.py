from flask import Flask, send_from_directory
from flask_cors import CORS
import os

# Import route blueprints
from routes.auth_routes import auth_bp
from routes.deck_routes import deck_bp
from routes.card_routes import card_bp
from routes.tournament_routes import tournament_bp
from routes.misc_routes import misc_bp

def create_app():
    # Point Flask to the React build directory
    static_folder = os.path.join(os.path.dirname(__file__), '..', 'react_frontend', 'build')
    print(f"Static folder path: {static_folder}")
    print(f"Static folder exists: {os.path.exists(static_folder)}")
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    CORS(app)
    
    # Register API blueprints with /api prefix
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(deck_bp, url_prefix='/api')
    app.register_blueprint(card_bp, url_prefix='/api')
    app.register_blueprint(tournament_bp, url_prefix='/api')
    app.register_blueprint(misc_bp, url_prefix='/api')
    
    # Serve React frontend
    @app.route('/')
    def serve_frontend():
        print(f"Serving frontend from: {app.static_folder}")
        return send_from_directory(app.static_folder, 'index.html')
    
    # Serve static assets and handle client-side routing
    @app.route('/<path:path>')
    def serve_static_files(path):
        full_path = os.path.join(app.static_folder, path)
        if os.path.exists(full_path):
            return send_from_directory(app.static_folder, path)
        else:
            # For client-side routing, return index.html
            return send_from_directory(app.static_folder, 'index.html')
    
    return app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app = create_app()
    app.run(host='0.0.0.0', port=port, debug=False)
