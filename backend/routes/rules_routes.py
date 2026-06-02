from flask import Blueprint, request, jsonify
from services.rules_service import get_rules_service

rules_bp = Blueprint('rules', __name__)

@rules_bp.route('/rules/ask', methods=['POST', 'GET'])
def ask_rules_question():
    """
    Ask a Cardfight!! Vanguard rules question
    
    Expected JSON payload:
    {
        "question": "What happens when I call a grade 3 unit?"
    }
    
    Returns:
    {
        "success": true,
        "answer": "AI response with rules explanation",
        "context_sources": ["Rule 7.1.2", "Rule 8.3.1"]
    }
    """
    try:
        # Handle GET requests for testing
        if request.method == 'GET':
            return jsonify({
                "message": "Rules endpoint is working. Use POST with JSON body containing 'question' field.",
                "example": {"question": "What happens when I ride a grade 3 unit?"}
            })
        
        # Validate request
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Content-Type must be application/json"
            }), 400
        
        data = request.get_json()
        question = data.get('question', '').strip()
        
        # Optional configuration parameters
        min_similarity = data.get('min_similarity_threshold', 0.2)  # Reduced from 0.3 to 0.2
        min_chunks = data.get('min_context_chunks', 1)
        
        if not question:
            return jsonify({
                "success": False,
                "error": "Question is required"
            }), 400
        
        # Get rules service and answer question
        service = get_rules_service()
        result = service.answer_question(
            question, 
            min_similarity_threshold=min_similarity,
            min_context_chunks=min_chunks
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}",
            "answer": None,
            "context_sources": []
        }), 500

@rules_bp.route('/rules/health', methods=['GET'])
def rules_health_check():
    """
    Check if the rules service is properly loaded and ready
    """
    try:
        service = get_rules_service()
        
        # Basic check to see if service is initialized
        if service.index is not None and service.metadata is not None:
            return jsonify({
                "status": "healthy",
                "message": "Rules service is ready",
                "index_size": service.index.ntotal,
                "metadata_entries": len(service.metadata),
                "api_key_configured": service.api_key is not None
            }), 200
        else:
            return jsonify({
                "status": "unhealthy",
                "message": "Rules service not properly initialized"
            }), 503
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Rules service error: {str(e)}"
        }), 503