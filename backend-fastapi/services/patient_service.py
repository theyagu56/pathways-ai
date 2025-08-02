import logging
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.patient import Patient
from typing import List, Optional, Dict, Any
import re

logger = logging.getLogger(__name__)

class PatientService:
    def __init__(self):
        self.db: Session = next(get_db())
    
    def create_patient(self, name: str, folder_name: str, **kwargs) -> Patient:
        """Create a new patient in the database"""
        try:
            # Check if patient already exists
            existing_patient = self.db.query(Patient).filter(
                Patient.folder_name == folder_name
            ).first()
            
            if existing_patient:
                logger.info(f"Patient already exists: {existing_patient.patient_id}")
                return existing_patient
            
            # Create new patient
            patient = Patient(
                name=name,
                folder_name=folder_name,
                **kwargs
            )
            
            self.db.add(patient)
            self.db.commit()
            self.db.refresh(patient)
            
            logger.info(f"Created new patient: {patient.patient_id} - {patient.name}")
            return patient
            
        except Exception as e:
            logger.error(f"Failed to create patient: {e}")
            self.db.rollback()
            raise
    
    def get_patient_by_name(self, name: str) -> Optional[Patient]:
        """Get patient by name"""
        try:
            # Try exact match first
            patient = self.db.query(Patient).filter(Patient.name == name).first()
            if patient:
                return patient
            
            # Try folder name match
            folder_name = name.replace(' ', '_')
            patient = self.db.query(Patient).filter(Patient.folder_name == folder_name).first()
            if patient:
                return patient
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get patient by name: {e}")
            return None
    
    def get_patient_by_folder(self, folder_name: str) -> Optional[Patient]:
        """Get patient by folder name"""
        try:
            return self.db.query(Patient).filter(Patient.folder_name == folder_name).first()
        except Exception as e:
            logger.error(f"Failed to get patient by folder: {e}")
            return None
    
    def get_all_patients(self) -> List[Dict[str, Any]]:
        """Get all patients with additional metadata"""
        try:
            patients = self.db.query(Patient).all()
            result = []
            
            for patient in patients:
                # Get file count from folder (if exists)
                import os
                from pathlib import Path
                
                folder_path = Path("uploads") / patient.folder_name
                file_count = 0
                if folder_path.exists():
                    file_count = len([f for f in folder_path.iterdir() if f.is_file()])
                
                result.append({
                    "patient_id": patient.patient_id,
                    "name": patient.name,
                    "folder_name": patient.folder_name,
                    "file_count": file_count,
                    "email": patient.email,
                    "phone": patient.phone,
                    "created_at": patient.created_at.isoformat() if patient.created_at else None,
                    "updated_at": patient.updated_at.isoformat() if patient.updated_at else None
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get all patients: {e}")
            return []
    
    def update_patient(self, patient_id: str, **kwargs) -> Optional[Patient]:
        """Update patient information"""
        try:
            patient = self.db.query(Patient).filter(Patient.patient_id == patient_id).first()
            if not patient:
                return None
            
            for key, value in kwargs.items():
                if hasattr(patient, key):
                    setattr(patient, key, value)
            
            self.db.commit()
            self.db.refresh(patient)
            
            logger.info(f"Updated patient: {patient.patient_id}")
            return patient
            
        except Exception as e:
            logger.error(f"Failed to update patient: {e}")
            self.db.rollback()
            return None

# Global instance
patient_service = PatientService() 