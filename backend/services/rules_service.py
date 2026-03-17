import faiss
import json
import numpy as np
import requests
import os
from sentence_transformers import SentenceTransformer

class VanguardRulesService:
    """Service for handling Cardfight!! Vanguard rules questions using AI"""
    
    def __init__(self):
        # Paths relative to the backend directory
        self.base_path = os.path.dirname(os.path.dirname(__file__))  # backend directory
        self.meta_path = os.path.join(self.base_path, "vanguard_metadata.json")
        self.index_path = os.path.join(self.base_path, "vanguard_index.faiss")
        
        # Model configuration
        self.model = "gpt-4o"
        self.api_key = os.getenv("OPENAI_API_KEY")
        
        # Initialize components
        self.index = None
        self.metadata = None
        self.embedding_model = None
        
        self._load_components()
    
    def _load_components(self):
        """Load FAISS index, metadata, and embedding model"""
        try:
            # Load FAISS index
            if os.path.exists(self.index_path):
                self.index = faiss.read_index(self.index_path)
            else:
                raise FileNotFoundError(f"FAISS index not found at {self.index_path}")
            
            # Load metadata
            if os.path.exists(self.meta_path):
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            else:
                raise FileNotFoundError(f"Metadata file not found at {self.meta_path}")
            
            # Load embedding model
            self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            
            print(f"✅ Rules service loaded successfully")
            print(f"   - Index size: {self.index.ntotal} entries")
            print(f"   - Metadata entries: {len(self.metadata)}")
            
        except Exception as e:
            print(f"❌ Error loading rules service: {str(e)}")
            raise
    
    def get_embedding(self, query):
        """Generate embedding for a query"""
        return np.array(self.embedding_model.encode(query), dtype=np.float32)
    
    def search_rules(self, query, k=20, min_similarity_threshold=0.3):  # Increased from k=3
        """Search for relevant rules based on the query"""
        if not self.index or not self.metadata:
            raise RuntimeError("Rules service not properly initialized")
        
        emb = self.get_embedding(query)
        D, I = self.index.search(np.array([emb]), k)
        
        # Filter results by similarity threshold
        # D contains squared L2 distances - convert to similarities
        # Lower distances = higher similarity
        relevant_results = []
        found_sections = set()
        
        for i, (distance, idx) in enumerate(zip(D[0], I[0])):
            # Convert distance to similarity (rough approximation)
            similarity = 1 / (1 + distance)  # Simple distance-to-similarity conversion
            
            if similarity >= min_similarity_threshold:
                result = self.metadata[idx].copy()
                result['similarity'] = similarity
                relevant_results.append(result)
                found_sections.add(result['section'])
        
        # Add context expansion: include adjacent numbered sections
        expanded_results = relevant_results.copy()
        for result in relevant_results:
            section = result['section']
            # Find related sections (adjacent numbered rules)
            related_sections = self._find_related_sections(section, found_sections)
            for related_section in related_sections:
                # Find this section in metadata
                for metadata_item in self.metadata:
                    if metadata_item['section'] == related_section and related_section not in found_sections:
                        expanded_result = metadata_item.copy()
                        expanded_result['similarity'] = 0.25  # Lower similarity for related sections
                        expanded_results.append(expanded_result)
                        found_sections.add(related_section)
                        break
        
        # Sort by similarity and limit results
        expanded_results.sort(key=lambda x: x['similarity'], reverse=True)
        return expanded_results[:15]  # Return top 15 results including context
    
    def _find_related_sections(self, section, already_found):
        """Find adjacent numbered sections for better context"""
        related = []
        try:
            # Parse section number (e.g., "9.7.2" -> base="9.7", subsection="2")
            if section.count('.') >= 2:
                parts = section.split('.')
                if len(parts) >= 3:
                    base = f"{parts[0]}.{parts[1]}"
                    subsection_num = int(parts[2]) if parts[2].isdigit() else 0
                    
                    # Add adjacent subsections
                    for offset in [-1, 1]:
                        new_subsection = subsection_num + offset
                        if new_subsection > 0:
                            candidate = f"{base}.{new_subsection}."
                            if candidate not in already_found:
                                related.append(candidate)
                    
                    # Also add the parent section
                    parent = f"{base}."
                    if parent not in already_found:
                        related.append(parent)
            
            elif section.count('.') == 1:
                # For sections like "9.7.", add subsections 9.7.1., 9.7.2., etc.
                base = section.rstrip('.')
                for i in range(1, 4):  # Add first 3 subsections
                    candidate = f"{base}.{i}."
                    if candidate not in already_found:
                        related.append(candidate)
        
        except (ValueError, IndexError):
            pass  # Skip if section format is unexpected
            
        return related
    
    def ask_openai_chatbot(self, prompt):
        """Send prompt to OpenAI API and get response"""
        if not self.api_key:
            raise ValueError("OpenAI API key not set. Please set OPENAI_API_KEY environment variable.")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenAI API request failed: {str(e)}")
        except (KeyError, IndexError) as e:
            raise Exception(f"Unexpected API response format: {str(e)}")
    
    def build_prompt(self, context_chunks, user_question):
        """Build the prompt for the AI with context and question"""
        if not context_chunks:
            return None
            
        context = "\n\n".join(
            [f"[{c['section']}] {c['text']}" for c in context_chunks]
        )
        
        prompt = """You are a Cardfight!! Vanguard rules assistant. Answer the user's question using the rule excerpts provided below.

IMPORTANT INSTRUCTIONS:
- Use the provided rule excerpts to answer the question as best you can
- If the excerpts contain relevant information, provide a helpful answer even if not 100% complete
- Cite the relevant rule sections in your answer (e.g., "According to Rule 7.1.2...")
- Only respond with "I don't have sufficient information in the rulebook to answer this question accurately" if the excerpts are completely unrelated to the question
- Be helpful and provide useful guidance based on the available rules

Rulebook Excerpts:
{}

User Question:
{}

Provide a helpful answer based on the rule excerpts above:""".format(context, user_question)
        
        return prompt
    
    def answer_question(self, question, min_similarity_threshold=0.3, min_context_chunks=1):
        """Main method to answer a rules question"""
        try:
            # Search for relevant rules
            top_chunks = self.search_rules(question, min_similarity_threshold=min_similarity_threshold)
            
            # Check if we have enough relevant context
            if len(top_chunks) < min_context_chunks:
                return {
                    "success": True,
                    "answer": "I don't have sufficient information in the rulebook to answer this question accurately. The question might be too specific, unclear, or about content not covered in the available rules.",
                    "context_sources": [],
                    "relevance_info": {
                        "found_chunks": len(top_chunks),
                        "min_required": min_context_chunks,
                        "similarity_threshold": min_similarity_threshold
                    }
                }
            
            # Log the similarity scores for debugging
            similarities = [float(chunk.get('similarity', 0)) for chunk in top_chunks]  # Convert numpy float32 to Python float
            print(f"[DEBUG] Found {len(top_chunks)} relevant chunks with similarities: {similarities}")
            
            # Build prompt with context
            prompt = self.build_prompt(top_chunks, question)
            if not prompt:
                return {
                    "success": True,
                    "answer": "I don't have sufficient information in the rulebook to answer this question accurately.",
                    "context_sources": []
                }
            
            # Get answer from AI
            answer = self.ask_openai_chatbot(prompt)
            print(f"[DEBUG] AI Response: {answer[:200]}...")  # Log first 200 chars of response
            
            # Check if AI says it doesn't have enough info (be more specific)
            insufficient_info_phrases = [
                "i don't have sufficient information in the rulebook",
                "don't have sufficient information in the rulebook",
                "not enough information in the provided rules",
                "insufficient information in the rulebook"
            ]
            
            # Only trigger fallback if AI explicitly says the rulebook lacks info
            if any(phrase in answer.lower() for phrase in insufficient_info_phrases):
                return {
                    "success": True,
                    "answer": "I don't have sufficient information in the rulebook to answer this question accurately. You might want to consult the full rulebook or contact a judge for clarification.",
                    "context_sources": [chunk['section'] for chunk in top_chunks],
                    "relevance_info": {
                        "ai_indicated_insufficient": True,
                        "found_chunks": len(top_chunks),
                        "similarity_scores": similarities
                    }
                }
            
            return {
                "success": True,
                "answer": answer,
                "context_sources": [chunk['section'] for chunk in top_chunks],
                "relevance_info": {
                    "found_chunks": len(top_chunks),
                    "similarity_scores": similarities
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "answer": None,
                "context_sources": []
            }

# Global instance - will be initialized when the module is imported
rules_service = None

def get_rules_service():
    """Get or create the global rules service instance"""
    global rules_service
    if rules_service is None:
        rules_service = VanguardRulesService()
    return rules_service