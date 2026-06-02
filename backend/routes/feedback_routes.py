from flask import Blueprint, request, jsonify
from database.feedback_service import save_feedback, get_feedback_stats, get_good_feedback_examples

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    """Submit feedback for a rules answer"""
    try:
        data = request.get_json()
        
        required_fields = ['question', 'answer', 'feedback_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        feedback_type = data['feedback_type']
        if feedback_type not in ['good', 'bad']:
            return jsonify({
                'success': False,
                'error': 'Invalid feedback type. Must be "good" or "bad"'
            }), 400
        
        feedback_id = save_feedback(
            question=data['question'],
            answer=data['answer'],
            feedback_type=feedback_type,
            context_cards=data.get('context_cards'),
            context_sources=data.get('context_sources'),
            similarity_scores=data.get('similarity_scores'),
            user_comment=data.get('user_comment')
        )
        
        if feedback_id:
            return jsonify({
                'success': True,
                'message': 'Feedback saved successfully',
                'feedback_id': feedback_id
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save feedback'
            }), 500
            
    except Exception as e:
        print(f"Error in submit_feedback: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@feedback_bp.route('/feedback/stats', methods=['GET'])
def get_stats():
    """Get feedback statistics"""
    try:
        stats = get_feedback_stats()
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        print(f"Error in get_stats: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@feedback_bp.route('/feedback/examples', methods=['GET'])
def get_examples():
    """Get good feedback examples"""
    try:
        limit = request.args.get('limit', 10, type=int)
        examples = get_good_feedback_examples(limit=limit)
        
        return jsonify({
            'success': True,
            'examples': examples
        })
    except Exception as e:
        print(f"Error in get_examples: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500