from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
from services.ocr_service import ocr_service
from app.schemas.ocr import OCRExtractionResult
import csv
import io
from app.core.database import SessionLocal
from app.models.ocr_result import OCRResult
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ocr", tags=["OCR"])

@router.post("/test-extraction")
async def test_medical_extraction():
    """Test endpoint to verify medical detail extraction logic"""
    try:
        # Sample medical text
        sample_text = """
        MEDICAL BILL
        Date: 2024-01-15
        Patient: John Doe
        Diagnosis: Back pain and muscle strain
        Treatment: Physical therapy session
        Cost: $150.00
        X-ray: Chest X-ray performed
        Notes: Patient reported improvement
        
        Follow-up Visit
        Date: 2024-02-20
        Diagnosis: Improved back condition
        Cost: $75.00
        Notes: Patient doing well
        """
        
        # Extract medical details
        result = ocr_service.extract_medical_details(sample_text)
        logger.info(f"Test extraction: {len(result.get('visits', []))} visits found")
        
        # Save to database
        db_id = ocr_service.save_result("test_sample.txt", "text/plain", result)
        
        # Prepare response
        response = OCRExtractionResult(**result)
        if db_id:
            response_dict = response.dict()
            response_dict["db_id"] = db_id
            return response_dict
        
        return response
        
    except Exception as e:
        logger.error(f"Test extraction failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Test extraction failed: {str(e)}"
        )

@router.post("/upload", response_model=OCRExtractionResult)
async def upload_document(file: UploadFile = File(...)):
    try:
        logger.info(f"Processing file: {file.filename}, content_type: {file.content_type}")
        
        # Validate file type
        if not file.content_type or not (
            file.content_type.startswith('image/') or 
            file.content_type == 'application/pdf'
        ):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only images and PDFs are supported."
            )
        
        file_bytes = await file.read()
        logger.info(f"File size: {len(file_bytes)} bytes")
        
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Extract text using OCR
        text = ocr_service.extract_text(file_bytes)
        if not text:
            logger.warning("No text extracted from file")
            # Return empty result instead of error
            return OCRExtractionResult(
                visits=[],
                timeline=[],
                monthly_summary=[],
                raw_text="",
                errors=["No text could be extracted from the uploaded file. Please ensure the file contains readable text."]
            )
        
        # Extract medical details
        result = ocr_service.extract_medical_details(text)
        logger.info(f"Extracted {len(result.get('visits', []))} visits")
        
        # Save to database
        db_id = ocr_service.save_result(file.filename, file.content_type, result)
        
        # Prepare response
        response = OCRExtractionResult(**result)
        if db_id:
            response_dict = response.dict()
            response_dict["db_id"] = db_id
            return response_dict
        
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"OCR processing failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"OCR processing failed: {str(e)}"
        )

@router.get("/download/{result_id}")
def download_ocr_result_csv(result_id: int):
    try:
        db = SessionLocal()
        try:
            result = db.query(OCRResult).filter(OCRResult.id == result_id).first()
            if not result:
                raise HTTPException(status_code=404, detail="Result not found")
            
            # Prepare CSV
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Date", "Diagnosis", "Imaging", "Cost", "Notes"])
            
            for visit in result.timeline or []:
                writer.writerow([
                    visit.get("date", ""),
                    visit.get("diagnosis", ""),
                    visit.get("imaging", ""),
                    visit.get("cost", ""),
                    visit.get("notes", "")
                ])
            
            writer.writerow([])
            writer.writerow(["Year", "Month", "Total Cost", "Record Count"])
            
            for summary in result.monthly_summary or []:
                writer.writerow([
                    summary.get("year", ""),
                    summary.get("month", ""),
                    summary.get("total_cost", ""),
                    summary.get("record_count", "")
                ])
            
            output.seek(0)
            return StreamingResponse(
                output, 
                media_type="text/csv", 
                headers={"Content-Disposition": f"attachment; filename=ocr_result_{result_id}.csv"}
            )
        finally:
            db.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}") 