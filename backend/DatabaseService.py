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

def create_user(username, password):
    try:
        conn = sqlite3.connect(r'C:\Users\Calvin\python filed\scraped_data.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(e)
        return False

def validate_user(username, password):
    conn = sqlite3.connect(r'C:\Users\Calvin\python filed\scraped_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    row = cursor.fetchone()
    conn.close()
    return row is not None

def search_card(name, nation):
    conn = sqlite3.connect(r'C:\Users\Calvin\python filed\scraped_data.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scraped_data WHERE name LIKE ? AND nation = ?", ('%' + name + '%', nation))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]