import os

# Get the directory of the current script (backend folder)
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Navigate to the database folder relative to the backend folder
DB_PATH = os.path.join(current_dir, '..', 'database', 'second db', 'scraped_data_2.db')