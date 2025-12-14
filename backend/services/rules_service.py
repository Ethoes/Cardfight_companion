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
    
    def search_rules(self, query, k=3):
        """Search for relevant rules based on the query"""
        if not self.index or not self.metadata:
            raise RuntimeError("Rules service not properly initialized")
        
        emb = self.get_embedding(query)
        D, I = self.index.search(np.array([emb]), k)
        return [self.metadata[i] for i in I[0]]
    
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
        context = "\n\n".join(
            [f"[{c['section']}] {c['text']}" for c in context_chunks]
        )
        
        return f"""You are a Cardfight!! Vanguard rules assistant. Use the rule excerpts below to answer the user's question. Be clear and cite the rule numbers in your answer.

Rulebook Excerpts:
{context}

User Question:
{user_question}

Answer:"""
    
    def answer_question(self, question):
        """Main method to answer a rules question"""
        try:
            # Search for relevant rules
            top_chunks = self.search_rules(question)
            
            # Build prompt with context
            prompt = self.build_prompt(top_chunks, question)
            
            # Get answer from AI
            answer = self.ask_openai_chatbot(prompt)
            
            return {
                "success": True,
                "answer": answer,
                "context_sources": [chunk['section'] for chunk in top_chunks]
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