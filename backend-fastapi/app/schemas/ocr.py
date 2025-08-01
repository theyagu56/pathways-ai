from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date

class VisitDetail(BaseModel):
    date: Optional[str] = None
    diagnosis: Optional[str] = None
    imaging: Optional[str] = None
    cost: Optional[float] = None
    notes: Optional[str] = None

class MonthlyBillingSummary(BaseModel):
    year: int
    month: int
    total_cost: float
    record_count: int

class OCRExtractionResult(BaseModel):
    visits: List[VisitDetail] = Field(default_factory=list)
    timeline: List[VisitDetail] = Field(default_factory=list)  # reverse chronological
    monthly_summary: List[MonthlyBillingSummary] = Field(default_factory=list)
    raw_text: Optional[str] = None
    errors: Optional[List[str]] = None 