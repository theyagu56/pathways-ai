from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class MedicalRecordRequest(BaseModel):
    extracted_text: str = Field(..., description="Extracted medical text from OCR")
    patient_id: str = Field(..., description="Unique patient identifier")
    doc_type: str = Field(..., description="Type of medical document (e.g., 'discharge_summary', 'lab_report', 'prescription')")
    visit_date: Optional[datetime] = Field(None, description="Date of medical visit")
    additional_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata for the document")

class MedicalChunkResponse(BaseModel):
    chunk_id: str
    patient_id: str
    doc_type: str
    chunk_text: str
    chunk_index: int
    chunk_size: int
    embedding_model: str
    vector_store_type: str
    vector_id: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime

class ProcessingResponse(BaseModel):
    success: bool
    message: str
    total_chunks: int
    chunks: list[MedicalChunkResponse]
    processing_time: float
    vector_store_type: str
    embedding_model: str

class ProcessingStatus(BaseModel):
    status: str  # 'processing', 'completed', 'failed'
    progress: float  # 0.0 to 1.0
    message: str
    total_chunks: Optional[int]
    processed_chunks: Optional[int] 