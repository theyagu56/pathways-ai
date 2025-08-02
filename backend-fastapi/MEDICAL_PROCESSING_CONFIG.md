# Medical Document Processing Pipeline Configuration

## Environment Variables

Create a `.env` file in the `backend-fastapi/` directory with the following variables:

### Database Configuration
```env
DATABASE_URL=sqlite:///./app.db
SQLITE_DB_PATH=./app.db
```

### OpenAI Configuration (Development)
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

### Azure OpenAI Configuration (Production)
```env
USE_AZURE_OPENAI=false
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint_here
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_API_VERSION=2023-05-15
AZURE_DEPLOYMENT_NAME=gpt-4
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-ada-002
```

### Vector Store Configuration
```env
USE_AZURE_SEARCH=false
USE_FAISS=true
```

### Azure Cognitive Search Configuration (Production)
```env
AZURE_SEARCH_ENDPOINT=your_azure_search_endpoint_here
AZURE_SEARCH_API_KEY=your_azure_search_api_key_here
AZURE_SEARCH_INDEX_NAME=medical-documents
```

### Server Configuration
```env
HOST=0.0.0.0
PORT=8000
```

## Configuration Modes

### Development Mode
- `USE_AZURE_OPENAI=false` - Uses OpenAI API directly
- `USE_AZURE_SEARCH=false` - Uses FAISS for vector storage
- `USE_FAISS=true` - Enables local FAISS vector database

### Production Mode
- `USE_AZURE_OPENAI=true` - Uses Azure OpenAI service
- `USE_AZURE_SEARCH=true` - Uses Azure Cognitive Search
- `USE_FAISS=false` - Disables local FAISS

## API Endpoints

### Process Medical Record
```
POST /api/medical-processing/process_medical_record
```

**Request Body:**
```json
{
  "extracted_text": "Patient has hypertension and diabetes...",
  "patient_id": "PAT123",
  "doc_type": "discharge_summary",
  "visit_date": "2024-01-15T10:30:00Z",
  "additional_metadata": {
    "hospital": "General Hospital",
    "doctor": "Dr. Smith"
  }
}
```

### Get Patient Chunks
```
GET /api/medical-processing/chunks/{patient_id}?doc_type=discharge_summary&limit=100
```

### Get Processing Status
```
GET /api/medical-processing/status
```

### Get Processing Statistics
```
GET /api/medical-processing/stats
```

### Delete Patient Chunks
```
DELETE /api/medical-processing/chunks/{patient_id}
```

## Processing Pipeline

1. **Text Chunking**: Uses LangChain's RecursiveCharacterTextSplitter
   - Chunk size: 750 characters
   - Overlap: 150 characters (20%)
   - Handles medical document structure

2. **Embedding Generation**: 
   - Development: OpenAI `text-embedding-ada-002`
   - Production: Azure OpenAI embedding endpoint

3. **Vector Storage**:
   - Development: FAISS (local file storage)
   - Production: Azure Cognitive Search

4. **Metadata Storage**: SQLite database with chunk information

## File Structure

```
backend-fastapi/
├── app/
│   ├── models/
│   │   └── medical_chunk.py          # Database model for chunks
│   ├── schemas/
│   │   └── medical_processing.py     # Pydantic schemas
│   └── core/
│       └── database.py               # Database configuration
├── services/
│   └── medical_processing_service.py # Core processing logic
├── routes/
│   └── medical_processing.py         # FastAPI endpoints
├── vector_store/                     # FAISS index storage
└── app.db                           # SQLite database
``` 