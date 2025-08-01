from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
import logging
from services.google_ocr_service import google_ocr_service
from app.schemas.ocr import OCRExtractionResult
import tempfile
import os
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/google-ocr", tags=["Google OCR"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient_name: str = Form(default="Unknown Patient")
):
    """Upload a document for OCR processing using Google Cloud Vision API"""
    try:
        logger.info(f"Processing file: {file.filename} for patient: {patient_name}")
        
        # Read file content
        file_bytes = await file.read()
        
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Create patient folder and save file
        patient_folder = save_patient_file(patient_name, file.filename, file_bytes)
        
        # Extract text using Google Cloud Vision
        text = google_ocr_service.extract_text(file_bytes, file.content_type)
        
        if not text.strip():
            logger.warning("No text extracted from document")
            return {
                "visits": [],
                "timeline": [],
                "monthly_summary": [],
                "errors": ["No text could be extracted from the uploaded document"],
                "patient_name": patient_name,
                "file_path": str(patient_folder)
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
        response_dict = response.dict()
        response_dict["patient_name"] = patient_name
        response_dict["file_path"] = str(patient_folder)
        
        logger.info(f"Successfully processed document for {patient_name}. Found {len(result['visits'])} visits")
        return response_dict
        
    except Exception as e:
        logger.error(f"OCR processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

def save_patient_file(patient_name: str, filename: str, file_bytes: bytes) -> Path:
    """Save uploaded file to patient-specific folder"""
    try:
        # Create base uploads directory
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)
        
        # Create patient folder (sanitize name for filesystem)
        safe_patient_name = "".join(c for c in patient_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_patient_name = safe_patient_name.replace(' ', '_')
        patient_folder = uploads_dir / safe_patient_name
        patient_folder.mkdir(exist_ok=True)
        
        # Save file to patient folder
        file_path = patient_folder / filename
        with open(file_path, 'wb') as f:
            f.write(file_bytes)
        
        logger.info(f"Saved file {filename} to patient folder: {patient_folder}")
        return patient_folder
        
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

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
        logger.error(f"Failed to download result: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download result: {str(e)}")

@router.get("/patient-files/{patient_name}")
async def get_patient_files(patient_name: str):
    """Get list of files for a specific patient"""
    try:
        # Sanitize patient name
        safe_patient_name = "".join(c for c in patient_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_patient_name = safe_patient_name.replace(' ', '_')
        
        patient_folder = Path("uploads") / safe_patient_name
        
        if not patient_folder.exists():
            return {"patient_name": patient_name, "files": [], "message": "No files found for this patient"}
        
        files = []
        for file_path in patient_folder.iterdir():
            if file_path.is_file():
                files.append({
                    "filename": file_path.name,
                    "size": file_path.stat().st_size,
                    "uploaded": file_path.stat().st_mtime
                })
        
        return {
            "patient_name": patient_name,
            "files": files,
            "folder_path": str(patient_folder)
        }
        
    except Exception as e:
        logger.error(f"Failed to get patient files: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get patient files: {str(e)}")

@router.get("/patients")
async def list_patients():
    """Get list of all patients with uploaded files"""
    try:
        uploads_dir = Path("uploads")
        
        if not uploads_dir.exists():
            return {"patients": []}
        
        patients = []
        for patient_folder in uploads_dir.iterdir():
            if patient_folder.is_dir():
                file_count = len([f for f in patient_folder.iterdir() if f.is_file()])
                patients.append({
                    "name": patient_folder.name.replace('_', ' '),
                    "folder_name": patient_folder.name,
                    "file_count": file_count,
                    "folder_path": str(patient_folder)
                })
        
        return {"patients": patients}
        
    except Exception as e:
        logger.error(f"Failed to list patients: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list patients: {str(e)}")

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