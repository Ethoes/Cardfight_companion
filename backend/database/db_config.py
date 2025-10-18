import os
import sqlite3

def get_database_connection():
    """Get SQLite database connection"""
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(current_dir, '..', 'database', 'second db', 'scraped_data_2.db')
    return sqlite3.connect(db_path)

def get_db_type():
    """Return database type"""
    return 'sqlite'