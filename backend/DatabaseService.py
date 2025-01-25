import sqlite3

def get_data_from_db(query):
    conn = sqlite3.connect(r'C:\Users\Calvin\python filed\scraped_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scraped_data WHERE name LIKE ?", ('%' + query + '%',))
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_image_path_by_id(card_id):
    conn = sqlite3.connect(r'C:\Users\Calvin\python filed\scraped_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT image_path FROM scraped_data WHERE id = ?", (card_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None