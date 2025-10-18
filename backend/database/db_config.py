import os

# Use environment variable for production, local path for development
if os.environ.get('RAILWAY_ENVIRONMENT'):
    DB_PATH = '/app/database/second db/scraped_data_2.db'
else:
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DB_PATH = os.path.join(current_dir, '..', 'database', 'second db', 'scraped_data_2.db')