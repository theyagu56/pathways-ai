# Initialize logging first
import logging
from logging.config import dictConfig
from utils.logger import get_logger
from dotenv import load_dotenv
import os

# Configure logging
logging_config = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
            'level': 'DEBUG',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'app.log',
            'formatter': 'standard',
            'level': 'DEBUG',
        },
    },
    'loggers': {
        '': {  # root logger
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True
        },
        'ocr_service': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False
        },
    }
}

dictConfig(logging_config)

# Load environment variables
load_dotenv()

# Get logger for main module
logger = get_logger(__name__)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.match_providers import router as match_providers_router
from routes.insurances import router as insurances_router
from routes.specialties import router as specialties_router
from routes.google_ocr import router as google_ocr_router

# OCR router disabled - using Google OCR only
ocr_available = False
logger.info("Original OCR router disabled - using Google OCR service only")

# Try to import voice router, but make it optional
try:
    from routes.voice import router as voice_router
    voice_available = True
except Exception as e:
    logger.warning(f"Voice router not available: {e}")
    voice_available = False

# Initialize database tables
from app.core.database import create_tables
create_tables()
logger.info("Database tables initialized")

logger.info("Starting Pathways AI Provider Matching API")

app = FastAPI(title="Pathways Agent Provider Matching API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(match_providers_router)
app.include_router(insurances_router)
app.include_router(specialties_router)
if voice_available:
    app.include_router(voice_router)
if ocr_available:
    app.include_router(ocr_router)
app.include_router(google_ocr_router)

logger.info("FastAPI app configured with CORS and routers")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Pathways AI Provider Matching API is running"}

@app.get("/test-openai")
async def test_openai():
    """Test OpenAI API connection"""
    logger.info("OpenAI test endpoint accessed")
    
    try:
        from services.llm_client import LLMClient
        import datetime
        
        llm_client = LLMClient()
        
        # Get current timestamp
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Create prompt for OpenAI
        prompt = f"""Generate a response with exactly these three words: "Connection Successful" and then add a dash and the timestamp: {timestamp}.
        
        The final response should be exactly: "Connection Successful - {timestamp}"
        
        Do not add any additional text or formatting."""
        
        # Call OpenAI using the correct method
        response = llm_client.client.invoke(prompt)
        response_text = response.content.strip()
        
        logger.info("OpenAI API test successful")
        return {
            "status": "success",
            "message": "OpenAI API is working",
            "response": response_text,
            "timestamp": timestamp
        }
        
    except Exception as e:
        logger.error(f"OpenAI API test failed: {e}")
        return {
            "status": "error",
            "message": "OpenAI API test failed",
            "error": str(e),
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

@app.get("/test-google-ocr")
async def test_google_ocr():
    """Test Google Cloud Vision OCR API connection"""
    logger.info("Google OCR test endpoint accessed")
    
    try:
        from services.google_ocr_service import GoogleOCRService
        import datetime
        
        # Initialize Google OCR service
        ocr_service = GoogleOCRService()
        
        # Get current timestamp
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Create a simple test image with text
        from PIL import Image, ImageDraw, ImageFont
        import io
        
        # Create a test image with text
        img = Image.new('RGB', (400, 100), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to use a default font, fallback to basic if not available
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        test_text = f"Google OCR Test - {timestamp}"
        draw.text((10, 40), test_text, fill='black', font=font)
        
        # Convert image to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        # Test OCR extraction
        extracted_text = ocr_service.extract_text(img_byte_arr)
        
        logger.info("Google OCR API test successful")
        return {
            "status": "success",
            "message": "Google Cloud Vision OCR is working",
            "extracted_text": extracted_text,
            "test_text": test_text,
            "timestamp": timestamp,
            "ocr_service_type": "Google Cloud Vision" if ocr_service.client else "Mock Service"
        }
        
    except Exception as e:
        logger.error(f"Google OCR API test failed: {e}")
        return {
            "status": "error",
            "message": "Google Cloud Vision OCR test failed",
            "error": str(e),
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

logger.info("Application startup complete")

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting Pathways Agent Provider Matching API...")
    print("📋 Configuration:")
    print(f"   - OpenAI API Key: {'✅ Set' if os.getenv('OPENAI_API_KEY') else '❌ Missing'}")
    print(f"   - Azure Speech Services: {'✅ Configured' if os.getenv('AZURE_SPEECH_KEY') else '❌ Not configured'}")
    print(f"   - Providers file: Will auto-detect from multiple possible locations")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🎤 Voice Processing: Available at /api/voice/*")
    print("=" * 50)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 