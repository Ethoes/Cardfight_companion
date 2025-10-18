import os
import sqlite3

# Define DB_PATH constant
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(current_dir, '..', 'database', 'second db', 'scraped_data_2.db')

def get_database_connection():
    """Get SQLite database connection"""
    return sqlite3.connect(DB_PATH)

def get_db_type():
    """Return database type"""
    return 'sqlite'