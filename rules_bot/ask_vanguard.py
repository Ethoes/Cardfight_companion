import faiss
import json
import numpy as np
import requests
from sentence_transformers import SentenceTransformer

# === Config ===
META_PATH = "vanguard_metadata.json"
INDEX_PATH = "vanguard_index.faiss"
OPENROUTER_API_KEY = "your-api-key-here"  # 🔐 Replace this
MODEL = "gpt-4o"           # Use any free-tier model

# === Load index + metadata ===
index = faiss.read_index(INDEX_PATH)
with open(META_PATH, "r", encoding="utf-8") as f:
    metadata = json.load(f)

# === Load same embedding model ===
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_embedding(query):
    return np.array(embedding_model.encode(query), dtype=np.float32)

def search_rules(query, k=3):
    emb = get_embedding(query)
    D, I = index.search(np.array([emb]), k)
    return [metadata[i] for i in I[0]]

def ask_openrouter_chatbot(prompt):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers,
        json=payload
    )

    data = response.json()
    print("DEBUG API RESPONSE:", data)  # Add this line
    return data["choices"][0]["message"]["content"]

def build_prompt(context_chunks, user_question):
    context = "\n\n".join(
        [f"[{c['section']}] {c['text']}" for c in context_chunks]
    )

    return f"""You are a Cardfight!! Vanguard rules assistant. Use the rule excerpts below to answer the user's question. Be clear and cite the rule numbers in your answer.

Rulebook Excerpts:
{context}

User Question:
{user_question}

Answer:"""

# === CLI ===
if __name__ == "__main__":
    question = input("❓ Ask a Vanguard rules question: ").strip()
    if not question:
        print("Please enter a question.")
        exit(1)

    top_chunks = search_rules(question)
    prompt = build_prompt(top_chunks, question)
    answer = ask_openrouter_chatbot(prompt)

    print("\n🤖 Answer:\n")
    print(answer)
