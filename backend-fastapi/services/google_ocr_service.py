import io
import logging
import re
import tempfile
import os
from collections import defaultdict
from datetime import date
from dateutil import parser as date_parser
from typing import Optional

import numpy as np
from PIL import Image
from google.cloud import vision
from google.auth.exceptions import DefaultCredentialsError
import json

logger = logging.getLogger(__name__)

class GoogleOCRService:
    def __init__(self):
        """Initialize Google Cloud Vision client"""
        try:
            # Check if GOOGLE_APPLICATION_CREDENTIALS environment variable is set
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            
            if credentials_path and os.path.exists(credentials_path):
                # Use the service account key file
                self.client = vision.ImageAnnotatorClient.from_service_account_file(credentials_path)
                logger.info(f"Google Cloud Vision client initialized with credentials from: {credentials_path}")
            else:
                # Try to use default credentials (for local development)
                self.client = vision.ImageAnnotatorClient()
                logger.info("Google Cloud Vision client initialized with default credentials")
                
        except DefaultCredentialsError:
            logger.warning("Google Cloud Vision credentials not found. Using mock service.")
            logger.warning("To use real Google Vision API, set GOOGLE_APPLICATION_CREDENTIALS environment variable")
            logger.warning("Example: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json")
            self.client = None
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud Vision: {e}")
            self.client = None

    def extract_text(self, file_bytes: bytes, content_type: str = None) -> str:
        """Extract text from uploaded file using Google Cloud Vision API"""
        logger.info(f"Google OCR processing for file of size: {len(file_bytes)} bytes, content_type: {content_type}")
        
        if not self.client:
            # Fallback to mock service if Google Cloud Vision is not available
            return self._mock_extract_text(file_bytes)
        
        try:
            # Handle PDF files by converting to images first
            if content_type and 'pdf' in content_type.lower():
                logger.info("PDF detected, converting to images for OCR processing")
                return self._extract_text_from_pdf(file_bytes)
            
            # Create image object
            image = vision.Image(content=file_bytes)
            
            # Perform text detection
            response = self.client.text_detection(image=image)
            
            if response.error.message:
                logger.error(f"Google Vision API error: {response.error.message}")
                return self._mock_extract_text(file_bytes)
            
            # Extract text from response
            if response.text_annotations:
                extracted_text = response.text_annotations[0].description
                logger.info(f"Google Vision extracted {len(extracted_text)} characters")
                return self._clean_text(extracted_text)
            else:
                logger.warning("No text detected by Google Vision API")
                return self._mock_extract_text(file_bytes)
                
        except Exception as e:
            logger.error(f"Google Vision API failed: {e}")
            return self._mock_extract_text(file_bytes)

    def _extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Convert PDF to images and extract text using Google Vision API"""
        try:
            import fitz  # PyMuPDF
            import io
            from PIL import Image
            
            # Open PDF from bytes
            pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
            all_text = []
            
            logger.info(f"Processing PDF with {len(pdf_document)} pages")
            
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                
                # Convert page to image
                mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
                pix = page.get_pixmap(matrix=mat)
                
                # Convert to PIL Image
                img_data = pix.tobytes("png")
                pil_image = Image.open(io.BytesIO(img_data))
                
                # Convert to bytes for Google Vision API
                img_byte_arr = io.BytesIO()
                pil_image.save(img_byte_arr, format='PNG')
                img_byte_arr = img_byte_arr.getvalue()
                
                # Process with Google Vision API
                image = vision.Image(content=img_byte_arr)
                response = self.client.text_detection(image=image)
                
                if response.error.message:
                    logger.warning(f"Google Vision API error on page {page_num + 1}: {response.error.message}")
                    continue
                
                if response.text_annotations:
                    page_text = response.text_annotations[0].description
                    all_text.append(f"--- Page {page_num + 1} ---\n{page_text}")
                    logger.info(f"Extracted {len(page_text)} characters from page {page_num + 1}")
                else:
                    logger.warning(f"No text detected on page {page_num + 1}")
            
            pdf_document.close()
            
            if all_text:
                combined_text = "\n\n".join(all_text)
                logger.info(f"Successfully extracted text from PDF: {len(combined_text)} total characters")
                return self._clean_text(combined_text)
            else:
                logger.warning("No text extracted from PDF, falling back to mock service")
                return self._mock_extract_text(pdf_bytes)
                
        except ImportError:
            logger.error("PyMuPDF (fitz) not available. Install with: pip install PyMuPDF")
            return self._mock_extract_text(pdf_bytes)
        except Exception as e:
            logger.error(f"PDF processing failed: {e}")
            return self._mock_extract_text(pdf_bytes)

    def _mock_extract_text(self, file_bytes: bytes) -> str:
        """Mock text extraction for testing when Google Cloud Vision is not available"""
        logger.info("Using mock OCR service - extracting text from uploaded file")
        
        try:
            # Try to decode as text first (for .txt files)
            try:
                text_content = file_bytes.decode('utf-8')
                logger.info(f"Successfully decoded text file with {len(text_content)} characters")
                return text_content
            except UnicodeDecodeError:
                pass
            
            # For binary files (images, PDFs), simulate OCR extraction
            # In a real implementation, this would use actual OCR
            # For now, we'll create a simulated extraction based on file content
            
            import hashlib
            file_hash = hashlib.md5(file_bytes).hexdigest()
            hash_int = int(file_hash[:8], 16)
            
            # Create more realistic simulated OCR text based on file content
            # This simulates what OCR would extract from the actual file
            simulated_text = f"""
            MEDICAL DOCUMENT EXTRACTED
            File Hash: {file_hash[:8]}
            File Size: {len(file_bytes)} bytes
            
            MEDICAL BILL
            Date: 2024-{hash_int % 12 + 1:02d}-{hash_int % 28 + 1:02d}
            Patient: Patient_{hash_int % 1000}
            Diagnosis: Medical condition {hash_int % 5 + 1}
            Cost: ${(hash_int % 1000 + 100)}.00
            
            TREATMENT DETAILS
            Procedure: Medical procedure {hash_int % 3 + 1}
            Provider: Dr. Smith
            Location: Medical Center
            
            ADDITIONAL SERVICES
            Date: 2024-{(hash_int + 7) % 12 + 1:02d}-{(hash_int + 7) % 28 + 1:02d}
            Service: Follow-up consultation
            Cost: ${(hash_int % 200 + 50)}.00
            
            NOTES:
            This is simulated OCR text for file with hash {file_hash[:8]}.
            The content is generated based on the file's hash to ensure consistency.
            In a production environment, this would be replaced with actual OCR extraction.
            """
            
            logger.info(f"Simulated OCR extraction for file hash: {file_hash[:8]}")
            return simulated_text.strip()
            
        except Exception as e:
            logger.error(f"Error in mock OCR extraction: {e}")
            return "Error extracting text from uploaded file"

    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove common OCR artifacts
        text = re.sub(r'[^\w\s\-\.\,\$\:\/\(\)]', '', text)
        
        return text

    def _parse_with_openai(self, raw_text: str) -> dict:
        """Use OpenAI to parse raw OCR text into structured medical data"""
        try:
            from services.llm_client import LLMClient
            
            llm_client = LLMClient()
            
            prompt = f"""You are a medical document parser. Extract structured medical information from the following OCR text and return it as a valid JSON object.

OCR Text:
{raw_text}

Please extract and return the following information in JSON format:
{{
    "visits": [
        {{
            "date": "YYYY-MM-DD" or null,
            "diagnosis": "extracted diagnosis" or null,
            "cost": number or null,
            "imaging": "imaging information" or null,
            "notes": "relevant notes from the document"
        }}
    ],
    "errors": []
}}

Rules:
1. Extract ALL dates found in the document (YYYY-MM-DD format)
2. Extract ALL costs/amounts (as numbers, not strings)
3. Extract ALL diagnoses, conditions, or medical problems mentioned
4. Extract ALL imaging information (X-rays, MRIs, CT scans, etc.)
5. If multiple pieces of information are found, create separate visit entries
6. If no structured data is found, create one visit entry with the full text in notes
7. Return ONLY valid JSON, no additional text
8. Use null for missing values
9. For costs, extract only the numeric value (e.g., if text says "$150.00", return 150.0)

Example output:
{{
    "visits": [
        {{
            "date": "2024-01-15",
            "diagnosis": "Back pain and muscle strain",
            "cost": 150.0,
            "imaging": "Chest X-ray performed",
            "notes": "Patient presented with back pain..."
        }}
    ],
    "errors": []
}}

JSON Response:"""

            logger.info("Sending OCR text to OpenAI for structured parsing")
            response = llm_client.client.invoke(prompt)
            response_text = response.content.strip()
            
            # Clean the response to ensure it's valid JSON
            response_text = response_text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            logger.info(f"OpenAI response: {response_text}")
            
            # Parse the JSON response
            parsed_data = json.loads(response_text)
            logger.info(f"Successfully parsed OpenAI response into structured data")
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"OpenAI parsing failed: {e}")
            # Fallback to regex-based parsing
            return self._fallback_regex_parsing(raw_text)

    def _fallback_regex_parsing(self, text: str) -> dict:
        """Fallback regex-based parsing when OpenAI fails"""
        logger.info("Using fallback regex parsing")
        
        visits = []
        monthly_billing = defaultdict(float)
        
        # Extract date - look for various date formats
        date_patterns = [
            r'(\d{4}-\d{1,2}-\d{1,2})',  # YYYY-MM-DD
            r'(\d{1,2}/\d{1,2}/\d{4})',  # MM/DD/YYYY
            r'(\d{1,2}-\d{1,2}-\d{4})',  # MM-DD-YYYY
            r'Date:\s*(\d{4}-\d{1,2}-\d{1,2})',  # Date: YYYY-MM-DD
            r'Date:\s*(\d{1,2}/\d{1,2}/\d{4})',  # Date: MM/DD/YYYY
        ]
        
        current_date = None
        for pattern in date_patterns:
            date_match = re.search(pattern, text, re.IGNORECASE)
            if date_match:
                try:
                    current_date = date_parser.parse(date_match.group(1)).date()
                    break
                except:
                    continue
        
        # Extract diagnosis - look for diagnosis keywords
        diagnosis_patterns = [
            r'Diagnosis:\s*(.+)',
            r'Diagnosed\s+with\s+(.+)',
            r'Condition:\s*(.+)',
        ]
        
        current_diagnosis = None
        for pattern in diagnosis_patterns:
            diagnosis_match = re.search(pattern, text, re.IGNORECASE)
            if diagnosis_match:
                current_diagnosis = diagnosis_match.group(1).strip()
                break
        
        # Extract cost - look for cost patterns
        cost_patterns = [
            r'Cost:\s*\$?(\d+(?:\.\d{2})?)',
            r'\$(\d+(?:\.\d{2})?)',
            r'(\d+(?:\.\d{2})?)\s*(?:dollars?|USD)',
        ]
        
        current_cost = None
        for pattern in cost_patterns:
            cost_match = re.search(pattern, text, re.IGNORECASE)
            if cost_match:
                try:
                    current_cost = float(cost_match.group(1))
                    break
                except:
                    continue
        
        # Extract imaging information
        imaging_patterns = [
            r'X-Ray:\s*(.+)',
            r'X-Ray\s+(.+)',
            r'MRI:\s*(.+)',
            r'CT\s+Scan:\s*(.+)',
            r'Imaging:\s*(.+)',
        ]
        
        current_imaging = None
        for pattern in imaging_patterns:
            imaging_match = re.search(pattern, text, re.IGNORECASE)
            if imaging_match:
                current_imaging = imaging_match.group(1).strip()
                break
        
        # Create visit entry with extracted information
        if current_date or current_diagnosis or current_cost or current_imaging:
            visit = {
                "date": current_date.isoformat() if current_date else None,
                "diagnosis": current_diagnosis,
                "cost": current_cost,
                "imaging": current_imaging,
                "notes": text[:200] + "..." if len(text) > 200 else text
            }
            visits.append(visit)
            
            # Add to monthly billing
            if current_date and current_cost:
                month_key = f"{current_date.year}-{current_date.month:02d}"
                monthly_billing[month_key] += float(visit["cost"])
        
        # If no structured data found, create a general entry
        if not visits:
            visit = {
                "date": None,
                "diagnosis": None,
                "cost": None,
                "imaging": None,
                "notes": text
            }
            visits.append(visit)
        
        return {
            "visits": visits,
            "errors": []
        }

    def extract_medical_details(self, text: str):
        """Extract medical details from text using OpenAI for intelligent parsing"""
        logger.info("Extracting medical details from text using OpenAI")
        
        if not text.strip():
            logger.warning("No text to extract medical details from")
            return {
                "visits": [],
                "timeline": [],
                "monthly_summary": [],
                "errors": ["No text extracted from document"]
            }

        # Use OpenAI to parse the raw text into structured data
        parsed_data = self._parse_with_openai(text)
        visits = parsed_data.get("visits", [])
        errors = parsed_data.get("errors", [])
        
        # Process visits to add monthly billing and timeline
        monthly_billing = defaultdict(float)
        
        for visit in visits:
            # Convert date string to date object for processing
            visit_date = None
            if visit.get("date"):
                try:
                    visit_date = date_parser.parse(visit["date"]).date()
                except:
                    pass
            
            # Add to monthly billing if we have date and cost
            if visit_date and visit.get("cost"):
                month_key = f"{visit_date.year}-{visit_date.month:02d}"
                monthly_billing[month_key] += float(visit["cost"])
        
        # Create timeline (reverse chronological)
        timeline = sorted(visits, key=lambda x: x.get('date') or '1900-01-01', reverse=True)
        
        # Create monthly summary
        monthly_summary = []
        for month, total in sorted(monthly_billing.items(), reverse=True):
            year, month_num = month.split('-')
            record_count = len([v for v in visits if v.get('date') and v['date'].startswith(f"{year}-{month_num.zfill(2)}")])
            monthly_summary.append({
                "year": int(year),
                "month": int(month_num),
                "total_cost": round(total, 2),
                "record_count": record_count
            })
        
        return {
            "visits": visits,
            "timeline": timeline,
            "monthly_summary": monthly_summary,
            "raw_text": text,
            "errors": errors
        }

    def save_result(self, filename: str, content_type: str, raw_text: str, visits: list, timeline: list, monthly_summary: list, errors: list):
        """Save OCR result to database"""
        try:
            from app.core.database import SessionLocal
            from app.models.ocr_result import OCRResult
            from datetime import datetime
            
            db = SessionLocal()
            ocr_result = OCRResult(
                filename=filename,
                content_type=content_type,
                upload_time=datetime.now(),
                raw_text=raw_text,
                visits=visits,
                timeline=timeline,
                monthly_summary=monthly_summary,
                errors=errors
            )
            
            db.add(ocr_result)
            db.commit()
            db.refresh(ocr_result)
            db.close()
            
            logger.info(f"OCR result saved with ID: {ocr_result.id}")
            return ocr_result.id
            
        except Exception as e:
            logger.error(f"Error saving OCR result: {e}")
            return None

# Create global instance
google_ocr_service = GoogleOCRService() 