def build_prompt_simple(context_chunks, user_question):
    """Simple build_prompt without feedback for testing"""
    if not context_chunks:
        return None
        
    context = "\n\n".join(
        [f"[{c['section']}] {c['text']}" for c in context_chunks]
    )
    
    prompt = f"""You are a Cardfight!! Vanguard rules assistant. Answer the user's question using the rule excerpts provided below.

IMPORTANT INSTRUCTIONS:
- Use the provided rule excerpts to answer the question as best you can
- Make logical inferences from the rules when they clearly imply an answer
- Cite the relevant rule sections in your answer (e.g., "According to Rule 7.1.2...")
- Only respond with "I don't have sufficient information in the rulebook to answer this question accurately" if the excerpts are completely unrelated to the question

Rulebook Excerpts:
{context}

User Question:
{user_question}

Provide a helpful answer based on the rule excerpts above:"""
    
    return prompt

# Test it
if __name__ == "__main__":
    import sys
    sys.path.append('../../backend')
    from services.rules_service import VanguardRulesService
    
    # Test with simplified prompt
    service = VanguardRulesService()
    service.build_prompt = build_prompt_simple
    
    result = service.answer_question("Test question")
    print("Success!" if result['success'] else f"Error: {result.get('error')}")