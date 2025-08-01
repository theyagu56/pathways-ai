from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import logging
from services.google_ocr_service import google_ocr_service
from app.schemas.ocr import OCRExtractionResult
import tempfile
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/google-ocr", tags=["Google OCR"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a document for OCR processing using Google Cloud Vision API"""
    try:
        logger.info(f"Processing file: {file.filename} ({file.content_type})")
        
        # Read file content
        file_bytes = await file.read()
        
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Extract text using Google Cloud Vision
        text = google_ocr_service.extract_text(file_bytes, file.content_type)
        
        if not text.strip():
            logger.warning("No text extracted from document")
            return {
                "visits": [],
                "timeline": [],
                "monthly_summary": [],
                "errors": ["No text could be extracted from the uploaded document"]
            }
        
        # Extract medical details
        result = google_ocr_service.extract_medical_details(text)
        
        # Save to database
        result_id = google_ocr_service.save_result(
            filename=file.filename,
            content_type=file.content_type,
            raw_text=text,
            visits=result["visits"],
            timeline=result["timeline"],
            monthly_summary=result["monthly_summary"],
            errors=result["errors"]
        )
        
        # Validate response
        response = OCRExtractionResult(**result)
        
        logger.info(f"Successfully processed document. Found {len(result['visits'])} visits")
        return response.dict()
        
    except Exception as e:
        logger.error(f"OCR processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@router.get("/download/{result_id}")
async def download_result(result_id: int):
    """Download OCR result as CSV file"""
    try:
        from app.core.database import SessionLocal
        from app.models.ocr_result import OCRResult
        import csv
        import tempfile
        
        db = SessionLocal()
        result = db.query(OCRResult).filter(OCRResult.id == result_id).first()
        db.close()
        
        if not result:
            raise HTTPException(status_code=404, detail="Result not found")
        
        # Create CSV file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv', newline='') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header
            writer.writerow(['Date', 'Diagnosis', 'Cost', 'Imaging', 'Notes'])
            
            # Write visit data
            for visit in result.visits:
                writer.writerow([
                    visit.get('date', ''),
                    visit.get('diagnosis', ''),
                    visit.get('cost', ''),
                    visit.get('imaging', ''),
                    visit.get('notes', '')
                ])
            
            temp_file_path = csvfile.name
        
        return FileResponse(
            temp_file_path,
            media_type='text/csv',
            filename=f'medical_chronology_{result_id}.csv'
        )
        
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@router.post("/test-extraction")
async def test_medical_extraction():
    """Test the medical detail extraction logic with sample text"""
    try:
        # Use the mock service to get varied sample data
        sample_bytes = b"test_document_for_extraction"
        sample_text = google_ocr_service.extract_text(sample_bytes)
        
        result = google_ocr_service.extract_medical_details(sample_text)
        response = OCRExtractionResult(**result)
        
        return response.dict()
        
    except Exception as e:
        logger.error(f"Test extraction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Test extraction failed: {str(e)}") 