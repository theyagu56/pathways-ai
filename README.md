# Pathways AI - Healthcare Provider Matching & Voice-Enabled Intake System

Pathways AI is a comprehensive healthcare platform that uses AI to match patients with healthcare providers based on symptoms, location, and insurance. The system features voice-enabled intake, medical document processing, and intelligent provider recommendations.

## 🚀 Key Features

- **🎤 Voice-Enabled Intake**: Record symptoms via microphone or upload audio files
- **🏥 AI-Powered Provider Matching**: Intelligent recommendations based on symptoms and location
- **📄 Medical Document Processing**: OCR and analysis of medical bills and documents
- **🔍 Insurance & Specialty Matching**: Find providers that accept your insurance
- **📱 Modern Web Interface**: Responsive React frontend with Tailwind CSS
- **🤖 OpenAI Integration**: Advanced AI analysis using GPT models

## 🏗️ Architecture

- **Backend**: FastAPI with AI/ML services, voice processing, and OCR
- **Frontend**: React with TypeScript and Tailwind CSS
- **AI Services**: OpenAI GPT, Whisper speech-to-text, Google Cloud Vision
- **Database**: SQLite with vector search capabilities
- **Voice Processing**: Azure Speech Services integration (optional)

## 🛠️ Tech Stack

### Backend (`backend-fastapi/`)
- **FastAPI**: Modern Python web framework
- **OpenAI**: GPT models for intelligent analysis
- **Whisper**: Speech-to-text transcription
- **Google Cloud Vision**: OCR for medical documents
- **FAISS**: Vector database for semantic search
- **Azure Integration**: Speech services and storage

### Frontend (`frontend-react/`)
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **React Hook Form**: Form management with validation

## 📁 Project Structure

```
pathways-ai/
├── backend-fastapi/          # FastAPI backend with AI services
│   ├── app/                  # Core application modules
│   ├── routes/               # API endpoints
│   ├── services/             # Business logic services
│   └── utils/                # Utility functions
├── frontend-react/           # React frontend application
│   ├── src/                  # Source code
│   ├── components/           # Reusable UI components
│   └── pages/                # Application pages
├── shared-data/              # Provider database and configuration
├── Test-data/                # Sample medical documents
└── docs/                     # Additional documentation
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- OpenAI API key
- FFmpeg (for audio processing)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd pathways-ai
```

### 2. Backend Setup
```bash
cd backend-fastapi

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your OpenAI API key and other settings

# Start the server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend-react

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables
Create a `.env` file in `backend-fastapi/`:

```env
# Required: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Azure Speech Services
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=your_azure_region_here
USE_AZURE_SPEECH=false

# Optional: Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint_here

# Application Settings
LOG_LEVEL=INFO
ENVIRONMENT=local
```

## 📡 API Endpoints

### Core Services
- **Provider Matching**: `POST /api/match-providers`
- **Voice Processing**: `POST /api/voice/upload-audio`
- **Medical Processing**: `POST /api/medical/process`
- **OCR Services**: `POST /api/google-ocr/process`
- **Specialties**: `GET /api/specialties`
- **Insurance**: `GET /api/insurances`

### Example Provider Matching Request
```json
{
  "injury_description": "I have a sprained ankle from playing basketball",
  "zip_code": "10001",
  "insurance": "Blue Cross"
}
```

## 🎤 Voice Features

- **Real-time Recording**: Browser-based microphone recording
- **Audio Upload**: Support for WAV, MP3, M4A, FLAC, OGG
- **Automatic Transcription**: Using OpenAI Whisper or Azure Speech
- **Symptom Extraction**: AI-powered analysis of voice input
- **Insurance Detection**: Automatic insurance provider identification

## 🏥 Provider Matching Engine

- **AI Analysis**: GPT-powered symptom analysis and specialty recommendations
- **Location-based Search**: ZIP code proximity calculations
- **Insurance Matching**: Find providers that accept your insurance
- **Specialty Ranking**: Intelligent provider ranking based on symptoms
- **Availability Check**: Real-time appointment availability

## 📄 Medical Document Processing

- **OCR Support**: Google Cloud Vision API integration
- **Multiple Formats**: PDF, images, scanned documents
- **Data Extraction**: Automatic extraction of medical information
- **Bill Analysis**: Medical bill parsing and cost breakdown
- **Document Management**: Organized storage and retrieval

## 🧪 Testing

### Backend Testing
```bash
cd backend-fastapi

# Test voice integration
python test_voice_integration.py

# Test API endpoints
curl http://localhost:8000/api/specialties
```

### Frontend Testing
```bash
cd frontend-react

# Run tests
npm test

# Build for production
npm run build
```

## 🐳 Docker Support

```bash
# Start all services
docker-compose up

# Build and run
docker-compose up --build
```

## 📚 Additional Documentation

- [Setup Guide](SETUP.md) - Comprehensive installation instructions
- [Voice Integration](VOICE_INTEGRATION_README.md) - Voice processing details
- [Provider Matching](README-PROVIDER-MATCHING.md) - Provider matching engine
- [Medical Processing](backend-fastapi/MEDICAL_PROCESSING_CONFIG.md) - Medical document processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For issues and questions:
- Check the documentation in the `docs/` folder
- Review the setup guides
- Open an issue on GitHub

---

**Pathways AI** - Transforming healthcare access through intelligent AI-powered provider matching and voice-enabled patient intake.
