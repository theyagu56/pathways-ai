from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from app.core.database import SessionLocal
from app.schemas.medical_processing import (
    MedicalRecordRequest, 
    ProcessingResponse, 
    MedicalChunkResponse,
    ProcessingStatus
)
from services.medical_processing_service import MedicalProcessingService
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/medical-processing", tags=["Medical Document Processing"])

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize the processing service
processing_service = MedicalProcessingService()

@router.post("/process_medical_record", response_model=ProcessingResponse)
async def process_medical_record(
    request: MedicalRecordRequest,
    db: Session = Depends(get_db)
):
    """
    Process medical record through the complete pipeline:
    1. Split text into chunks using LangChain's RecursiveCharacterTextSplitter
    2. Generate embeddings for each chunk
    3. Store vectors in FAISS (dev) or Azure Cognitive Search (prod)
    4. Save metadata to SQLite database
    """
    try:
        logger.info(f"Received medical record processing request for patient {request.patient_id}")
        
        # Validate input
        if not request.extracted_text.strip():
            raise HTTPException(status_code=400, detail="Extracted text cannot be empty")
        
        if not request.patient_id.strip():
            raise HTTPException(status_code=400, detail="Patient ID cannot be empty")
        
        if not request.doc_type.strip():
            raise HTTPException(status_code=400, detail="Document type cannot be empty")
        
        # Process the medical record
        result = await processing_service.process_medical_record(request)
        
        if result["success"]:
            logger.info(f"Successfully processed medical record for patient {request.patient_id}")
            return ProcessingResponse(**result)
        else:
            logger.error(f"Failed to process medical record for patient {request.patient_id}")
            raise HTTPException(status_code=500, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing medical record: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/chunks/{patient_id}", response_model=List[MedicalChunkResponse])
async def get_patient_chunks(
    patient_id: str,
    doc_type: str = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieve processed chunks for a specific patient
    """
    try:
        from app.models.medical_chunk import MedicalChunk
        
        query = db.query(MedicalChunk).filter(MedicalChunk.patient_id == patient_id)
        
        if doc_type:
            query = query.filter(MedicalChunk.doc_type == doc_type)
        
        chunks = query.order_by(MedicalChunk.chunk_index).limit(limit).all()
        
        return [
            MedicalChunkResponse(
                chunk_id=chunk.chunk_id,
                patient_id=chunk.patient_id,
                doc_type=chunk.doc_type,
                chunk_text=chunk.chunk_text,
                chunk_index=chunk.chunk_index,
                chunk_size=chunk.chunk_size,
                embedding_model=chunk.embedding_model,
                vector_store_type=chunk.vector_store_type,
                vector_id=chunk.vector_id,
                metadata=chunk.chunk_metadata,
                created_at=chunk.created_at
            )
            for chunk in chunks
        ]
        
    except Exception as e:
        logger.error(f"Error retrieving chunks for patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chunks: {str(e)}")

@router.get("/status", response_model=Dict[str, Any])
async def get_processing_status():
    """
    Get the current status of the medical processing service
    """
    try:
        return {
            "service_status": "running",
            "vector_store_type": processing_service.vector_store_type,
            "embedding_model": "text-embedding-ada-002",
            "use_azure_openai": processing_service.use_azure_openai,
            "use_azure_search": processing_service.use_azure_search,
            "text_splitter_config": {
                "chunk_size": 750,
                "chunk_overlap": 150,
                "separators": ["\n\n", "\n", ". ", " ", ""]
            }
        }
    except Exception as e:
        logger.error(f"Error getting processing status: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")

@router.delete("/chunks/{patient_id}")
async def delete_patient_chunks(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete all chunks for a specific patient
    """
    try:
        from app.models.medical_chunk import MedicalChunk
        
        # Delete from database
        deleted_count = db.query(MedicalChunk).filter(
            MedicalChunk.patient_id == patient_id
        ).delete()
        
        db.commit()
        
        # TODO: Also delete from vector store (FAISS/Azure)
        logger.info(f"Deleted {deleted_count} chunks for patient {patient_id}")
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} chunks for patient {patient_id}",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        logger.error(f"Error deleting chunks for patient {patient_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting chunks: {str(e)}")

@router.get("/stats", response_model=Dict[str, Any])
async def get_processing_stats(db: Session = Depends(get_db)):
    """
    Get processing statistics
    """
    try:
        from app.models.medical_chunk import MedicalChunk
        from sqlalchemy import func
        
        # Get total chunks
        total_chunks = db.query(func.count(MedicalChunk.id)).scalar()
        
        # Get unique patients
        unique_patients = db.query(func.count(func.distinct(MedicalChunk.patient_id))).scalar()
        
        # Get document types
        doc_types = db.query(
            MedicalChunk.doc_type,
            func.count(MedicalChunk.id).label('count')
        ).group_by(MedicalChunk.doc_type).all()
        
        # Get vector store distribution
        vector_store_dist = db.query(
            MedicalChunk.vector_store_type,
            func.count(MedicalChunk.id).label('count')
        ).group_by(MedicalChunk.vector_store_type).all()
        
        return {
            "total_chunks": total_chunks,
            "unique_patients": unique_patients,
            "document_types": [{"type": dt.doc_type, "count": dt.count} for dt in doc_types],
            "vector_store_distribution": [{"type": vs.vector_store_type, "count": vs.count} for vs in vector_store_dist]
        }
        
    except Exception as e:
        logger.error(f"Error getting processing stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}") 