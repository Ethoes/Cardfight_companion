from flask import Flask, send_from_directory, request, g
from flask_cors import CORS
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('backend.log')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Import route blueprints
from routes.auth_routes import auth_bp
from routes.deck_routes import deck_bp
from routes.card_routes import card_bp
from routes.tournament_routes import tournament_bp
from routes.misc_routes import misc_bp
from routes.rules_routes import rules_bp

def create_app():
    # Point Flask to the React build directory
    static_folder = os.path.join(os.path.dirname(__file__), '..', 'react_frontend', 'build')
    print(f"Static folder path: {static_folder}")
    print(f"Static folder exists: {os.path.exists(static_folder)}")
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    CORS(app)
    
    # Request logging middleware
    @app.before_request
    def log_request_info():
        logger.info('=== NEW REQUEST ===')
        logger.info(f'Request URL: {request.url}')
        logger.info(f'Request Path: {request.path}')
        logger.info(f'Request Method: {request.method}')
        logger.info(f'Request Headers: {dict(request.headers)}')
        logger.info(f'Request Args: {dict(request.args)}')
        if request.is_json:
            logger.info(f'Request JSON: {request.get_json()}')
        elif request.form:
            logger.info(f'Request Form: {dict(request.form)}')
        g.start_time = datetime.utcnow()
    
    @app.after_request
    def log_response_info(response):
        if hasattr(g, 'start_time'):
            duration = datetime.utcnow() - g.start_time
            logger.info(f'Response Status: {response.status_code}')
            logger.info(f'Response Duration: {duration.total_seconds():.3f}s')
        logger.info('=== REQUEST COMPLETE ===')
        return response
    
    # Error handler
    @app.errorhandler(404)
    def not_found_error(error):
        logger.error(f'404 Error - Path not found: {request.path}')
        logger.error(f'Available routes:')
        for rule in app.url_map.iter_rules():
            logger.error(f'  {rule.rule} -> {rule.endpoint} {list(rule.methods)}')
        return {'error': 'Endpoint not found', 'path': request.path}, 404
    
    @app.errorhandler(405)
    def method_not_allowed_error(error):
        logger.error(f'405 Error - Method not allowed: {request.method} {request.path}')
        # Find matching routes for this path
        matching_routes = []
        for rule in app.url_map.iter_rules():
            if rule.rule == request.path or (hasattr(rule, 'match') and rule.match(request.path)):
                matching_routes.append(f'{rule.rule} -> {list(rule.methods)}')
        logger.error(f'Matching routes for {request.path}: {matching_routes}')
        return {'error': 'Method not allowed', 'path': request.path, 'method': request.method, 'matching_routes': matching_routes}, 405
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f'500 Error - Internal server error: {str(error)}')
        return {'error': 'Internal server error', 'details': str(error)}, 500
    
    # Register API blueprints with /api prefix
    logger.info("Registering blueprints...")
    app.register_blueprint(auth_bp, url_prefix='/api')
    logger.info("Auth blueprint registered")
    app.register_blueprint(deck_bp, url_prefix='/api')
    logger.info("Deck blueprint registered")
    app.register_blueprint(card_bp, url_prefix='/api')
    logger.info("Card blueprint registered")
    app.register_blueprint(tournament_bp, url_prefix='/api')
    logger.info("Tournament blueprint registered")
    app.register_blueprint(misc_bp, url_prefix='/api')
    logger.info("Misc blueprint registered")
    app.register_blueprint(rules_bp, url_prefix='/api')
    logger.info("Rules blueprint registered")
    logger.info("All blueprints registered successfully")
    
    # Debug route to see all registered routes
    @app.route('/api/debug/routes')
    def list_routes():
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'rule': rule.rule
            })
        return {'routes': routes}
    
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
    
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.rule} -> {rule.endpoint} {list(rule.methods)}")
    
    app.run(host='0.0.0.0', port=port, debug=False)
