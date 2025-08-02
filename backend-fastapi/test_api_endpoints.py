#!/usr/bin/env python3
"""
Test script for the Medical Processing API Endpoints
"""

import asyncio
import json
import requests
from datetime import datetime

def test_api_endpoints():
    """Test the medical processing API endpoints"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Medical Processing API Endpoints")
    print("=" * 50)
    
    # Test 1: Get service status
    print("\n1. Testing service status endpoint...")
    try:
        response = requests.get(f"{base_url}/api/medical-processing/status")
        if response.status_code == 200:
            print("✅ Service status endpoint working")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"❌ Service status failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Service status error: {e}")
    
    # Test 2: Get processing statistics
    print("\n2. Testing statistics endpoint...")
    try:
        response = requests.get(f"{base_url}/api/medical-processing/stats")
        if response.status_code == 200:
            print("✅ Statistics endpoint working")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"❌ Statistics failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Statistics error: {e}")
    
    # Test 3: Process a medical record
    print("\n3. Testing medical record processing...")
    
    test_data = {
        "extracted_text": """
        DISCHARGE SUMMARY
        
        Patient Name: Jane Smith
        Patient ID: PAT456
        Date of Admission: 2024-01-20
        Date of Discharge: 2024-01-25
        
        DIAGNOSIS:
        Primary: Pneumonia
        Secondary: Hypertension
        
        TREATMENT:
        - Azithromycin 500mg daily for 5 days
        - Lisinopril 10mg daily
        - Rest and hydration
        
        MEDICATIONS:
        - Azithromycin 500mg PO daily
        - Lisinopril 10mg PO daily
        - Tylenol as needed for fever
        
        VITAL SIGNS:
        - Blood Pressure: 135/85 mmHg
        - Heart Rate: 88 bpm
        - Temperature: 99.2°F
        - Respiratory Rate: 18/min
        
        ASSESSMENT:
        Patient admitted with community-acquired pneumonia.
        Responded well to antibiotic therapy.
        Blood pressure controlled with medication.
        
        PLAN:
        - Complete antibiotic course
        - Follow up with primary care in 1 week
        - Continue blood pressure medication
        """,
        "patient_id": "PAT456",
        "doc_type": "discharge_summary",
        "visit_date": "2024-01-25T14:30:00Z",
        "additional_metadata": {
            "hospital": "City General Hospital",
            "doctor": "Dr. Johnson",
            "department": "Internal Medicine",
            "urgency": "routine"
        }
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/medical-processing/process_medical_record",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Medical record processing successful")
            result = response.json()
            print(f"Total chunks created: {result.get('total_chunks', 0)}")
            print(f"Processing time: {result.get('processing_time', 0):.2f} seconds")
            print(f"Vector store type: {result.get('vector_store_type', 'unknown')}")
        else:
            print(f"❌ Medical record processing failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Medical record processing error: {e}")
    
    # Test 4: Get chunks for the patient
    print("\n4. Testing get chunks endpoint...")
    try:
        response = requests.get(f"{base_url}/api/medical-processing/chunks/PAT456")
        if response.status_code == 200:
            chunks = response.json()
            print(f"✅ Retrieved {len(chunks)} chunks for patient PAT456")
            if chunks:
                print(f"First chunk ID: {chunks[0].get('chunk_id', 'N/A')}")
                print(f"First chunk size: {chunks[0].get('chunk_size', 0)} characters")
        else:
            print(f"❌ Get chunks failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Get chunks error: {e}")
    
    print("\n✨ API endpoint testing completed!")

if __name__ == "__main__":
    test_api_endpoints() 