import io
import logging
import re
import tempfile
import os
from collections import defaultdict
from datetime import date
from dateutil import parser as date_parser

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        # Mock OCR service for immediate testing
        logger.info("Initializing Mock OCR Service for testing")
        self.ocr = None

    def extract_text(self, file_bytes: bytes) -> str:
        """Mock text extraction for testing - returns sample medical document text"""
        logger.info(f"Mock OCR processing for file of size: {len(file_bytes)} bytes")
        
        # Return a sample medical document text for testing
        sample_text = """
        MEDICAL BILL
        
        Date: 2024-01-15
        Patient: John Doe
        Diagnosis: Back pain and muscle strain
        Cost: $150.00
        X-ray: Chest X-ray performed
        
        Date: 2024-02-20
        Patient: John Doe
        Diagnosis: Improved back condition
        Cost: $75.00
        Physical Therapy: 3 sessions completed
        
        Date: 2024-03-10
        Patient: John Doe
        Diagnosis: Fully recovered
        Cost: $50.00
        Follow-up consultation
        """
        
        logger.info(f"Mock OCR extracted {len(sample_text)} characters")
        return sample_text.strip()

    def extract_medical_details(self, text: str) -> dict:
        """Extract medical details from OCR text"""
        if not text.strip():
            return {
                "visits": [],
                "timeline": [],
                "monthly_summary": [],
                "raw_text": text,
                "errors": ["No text extracted from document"]
            }
        
        # Simple patterns for medical document parsing
        date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',  # MM/DD/YYYY or DD/MM/YYYY
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',    # YYYY/MM/DD
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})',  # DD Month YYYY
        ]
        
        diagnosis_keywords = ["diagnosis", "dx", "impression", "condition", "problem", "symptoms"]
        imaging_keywords = ["x-ray", "ct", "mri", "ultrasound", "imaging", "scan", "radiology"]
        billing_patterns = [
            r'\$?([0-9,]+(?:\.[0-9]{2})?)',  # $1,234.56 or 1234.56
            r'([0-9,]+(?:\.[0-9]{2})?)\s*(?:dollars?|USD)',  # 1234.56 dollars
        ]
        
        visits = []
        monthly_summary = defaultdict(lambda: {"total_cost": 0.0, "record_count": 0})
        errors = []
        
        # Split text into lines and process each line
        lines = text.split('\n')
        current_visit = {}
        
        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                continue
            
            # Try to extract date
            date_found = False
            for pattern in date_patterns:
                date_match = re.search(pattern, line, re.IGNORECASE)
                if date_match:
                    try:
                        visit_date = date_parser.parse(date_match.group(1), fuzzy=True, dayfirst=False)
                        current_visit["date"] = visit_date.date()
                        date_found = True
                        break
                    except Exception as e:
                        errors.append(f"Could not parse date '{date_match.group(1)}' on line {line_num}: {e}")
            
            # Extract diagnosis
            for keyword in diagnosis_keywords:
                if keyword in line.lower():
                    current_visit["diagnosis"] = line.strip()
                    break
            
            # Extract imaging information
            for keyword in imaging_keywords:
                if keyword in line.lower():
                    current_visit["imaging"] = line.strip()
                    break
            
            # Extract billing amounts
            for pattern in billing_patterns:
                bill_match = re.search(pattern, line, re.IGNORECASE)
                if bill_match:
                    try:
                        cost_str = bill_match.group(1).replace(',', '')
                        cost = float(cost_str)
                        if cost > 0:  # Only consider positive amounts
                            current_visit["cost"] = cost
                            if "date" in current_visit:
                                y, m = current_visit["date"].year, current_visit["date"].month
                                monthly_summary[(y, m)]["total_cost"] += cost
                                monthly_summary[(y, m)]["record_count"] += 1
                        break
                    except Exception as e:
                        errors.append(f"Could not parse billing '{bill_match.group(1)}' on line {line_num}: {e}")
            
            # If we found a date, this might be a new visit
            if date_found and current_visit:
                current_visit["notes"] = line.strip()
                visits.append(current_visit.copy())
                current_visit = {}
        
        # Sort visits reverse chronologically
        visits_sorted = sorted(visits, key=lambda v: v.get("date", date(1900, 1, 1)), reverse=True)
        timeline = visits_sorted
        
        # Create monthly summary
        monthly_summary_list = [
            {"year": y, "month": m, "total_cost": v["total_cost"], "record_count": v["record_count"]}
            for (y, m), v in monthly_summary.items()
        ]
        monthly_summary_list = sorted(monthly_summary_list, key=lambda x: (x["year"], x["month"]), reverse=True)
        
        return {
            "visits": visits_sorted,
            "timeline": timeline,
            "monthly_summary": monthly_summary_list,
            "raw_text": text,
            "errors": errors
        }

    def save_result(self, filename: str, content_type: str, result: dict) -> int:
        """Save OCR result to database"""
        try:
            from app.core.database import SessionLocal
            from app.models.ocr_result import OCRResult
            
            db = SessionLocal()
            ocr_result = OCRResult(
                filename=filename,
                content_type=content_type,
                raw_text=result.get("raw_text"),
                visits=result.get("visits"),
                timeline=result.get("timeline"),
                monthly_summary=result.get("monthly_summary"),
                errors=result.get("errors")
            )
            db.add(ocr_result)
            db.commit()
            db.refresh(ocr_result)
            db.close()
            logger.info(f"OCR result saved with ID: {ocr_result.id}")
            return ocr_result.id
        except Exception as e:
            logger.error(f"Failed to save OCR result: {e}")
            return None

# Create singleton instance
ocr_service = OCRService() 