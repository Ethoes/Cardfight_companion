# Rules Bot API Integration

This document describes how to use the integrated Cardfight!! Vanguard rules bot API.

## Setup

1. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_actual_api_key_here
     ```

3. **Required Files**
   - `vanguard_index.faiss` (FAISS vector index)
   - `vanguard_metadata.json` (Rule text metadata)
   
   These files should be in the `backend/` directory.

## API Endpoints

### Ask Rules Question
**POST** `/api/rules/ask`

Ask a Cardfight!! Vanguard rules question and get an AI-powered answer.

**Request Body:**
```json
{
    "question": "What happens when I call a grade 3 unit?"
}
```

**Response:**
```json
{
    "success": true,
    "answer": "When you call a grade 3 unit, you can perform Superior Call...",
    "context_sources": ["Rule 7.1.2", "Rule 8.3.1"]
}
```

**Error Response:**
```json
{
    "success": false,
    "error": "Error description",
    "answer": null,
    "context_sources": []
}
```

### Health Check
**GET** `/api/rules/health`

Check if the rules service is properly loaded and ready.

**Response:**
```json
{
    "status": "healthy",
    "message": "Rules service is ready",
    "index_size": 1234,
    "metadata_entries": 1234,
    "api_key_configured": true
}
```

## Frontend Integration Example

```javascript
// Ask a rules question
const askRulesQuestion = async (question) => {
    try {
        const response = await fetch('/api/rules/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Answer:', data.answer);
            console.log('Sources:', data.context_sources);
        } else {
            console.error('Error:', data.error);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
};

// Usage
askRulesQuestion("How does riding work in Vanguard?");
```

## Troubleshooting

1. **Service won't start**
   - Check that `vanguard_index.faiss` and `vanguard_metadata.json` exist in backend/
   - Verify all dependencies are installed: `pip install -r requirements.txt`

2. **OpenAI API errors**
   - Ensure `OPENAI_API_KEY` is set in your `.env` file
   - Check your OpenAI account has sufficient credits
   - Verify the API key has the correct permissions

3. **Memory issues**
   - The sentence transformer model and FAISS index require significant memory
   - Consider using a smaller embedding model if needed

## Technical Details

- **Vector Search**: Uses FAISS for efficient similarity search
- **Embeddings**: sentence-transformers/all-MiniLM-L6-v2 model
- **AI Model**: OpenAI GPT-4o for generating answers
- **Context**: Retrieves top 3 most relevant rule sections for each question