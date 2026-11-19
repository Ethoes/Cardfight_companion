import sqlite3
import json
from datetime import datetime
from .db_config import get_database_connection

def create_feedback_table():
    """Create feedback table if it doesn't exist"""
    conn = get_database_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rules_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            context_cards TEXT,
            feedback_type TEXT NOT NULL CHECK(feedback_type IN ('good', 'bad')),
            context_sources TEXT,
            similarity_scores TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_comment TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

def save_feedback(question, answer, feedback_type, context_cards=None, context_sources=None, similarity_scores=None, user_comment=None):
    """Save user feedback for a rules answer"""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Convert complex data to JSON strings
        context_cards_json = json.dumps(context_cards) if context_cards else None
        context_sources_json = json.dumps(context_sources) if context_sources else None
        similarity_scores_json = json.dumps(similarity_scores) if similarity_scores else None
        
        cursor.execute('''
            INSERT INTO rules_feedback 
            (question, answer, context_cards, feedback_type, context_sources, similarity_scores, user_comment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (question, answer, context_cards_json, feedback_type, context_sources_json, similarity_scores_json, user_comment))
        
        conn.commit()
        feedback_id = cursor.lastrowid
        conn.close()
        
        return feedback_id
    except Exception as e:
        print(f"Error saving feedback: {e}")
        return None

def get_good_feedback_examples(limit=10):
    """Get examples of good Q&A pairs for context enhancement"""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT question, answer, context_cards, context_sources, timestamp
            FROM rules_feedback 
            WHERE feedback_type = 'good'
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        examples = []
        for row in rows:
            examples.append({
                'question': row[0],
                'answer': row[1],
                'context_cards': json.loads(row[2]) if row[2] else None,
                'context_sources': json.loads(row[3]) if row[3] else None,
                'timestamp': row[4]
            })
        
        return examples
    except Exception as e:
        print(f"Error getting good feedback examples: {e}")
        return []

def get_feedback_stats():
    """Get basic feedback statistics"""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT feedback_type, COUNT(*) FROM rules_feedback GROUP BY feedback_type')
        stats = dict(cursor.fetchall())
        conn.close()
        
        return {
            'good': stats.get('good', 0),
            'bad': stats.get('bad', 0),
            'total': sum(stats.values())
        }
    except Exception as e:
        print(f"Error getting feedback stats: {e}")
        return {'good': 0, 'bad': 0, 'total': 0}

def search_similar_good_feedback(question, limit=5):
    """Search for similar good feedback based on question keywords"""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Simple keyword search - could be enhanced with vector similarity
        question_lower = question.lower()
        search_terms = question_lower.split()
        
        # Create a LIKE query for each term
        like_conditions = []
        params = []
        for term in search_terms:
            if len(term) > 3:  # Only search for meaningful terms
                like_conditions.append("LOWER(question) LIKE ?")
                params.append(f"%{term}%")
        
        if not like_conditions:
            return []
        
        where_clause = " OR ".join(like_conditions)
        params.append(limit)
        
        cursor.execute(f'''
            SELECT question, answer, context_cards, context_sources, timestamp
            FROM rules_feedback 
            WHERE feedback_type = 'good' AND ({where_clause})
            ORDER BY timestamp DESC
            LIMIT ?
        ''', params)
        
        rows = cursor.fetchall()
        conn.close()
        
        similar_examples = []
        for row in rows:
            similar_examples.append({
                'question': row[0],
                'answer': row[1],
                'context_cards': json.loads(row[2]) if row[2] else None,
                'context_sources': json.loads(row[3]) if row[3] else None,
                'timestamp': row[4]
            })
        
        return similar_examples
    except Exception as e:
        print(f"Error searching similar feedback: {e}")
        return []

# Initialize feedback table when module is imported
create_feedback_table()