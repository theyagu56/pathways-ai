#!/usr/bin/env python3
"""
Test script for the Medical Document Processing Pipeline
"""

import asyncio
import json
from datetime import datetime
from services.medical_processing_service import MedicalProcessingService
from app.schemas.medical_processing import MedicalRecordRequest

async def test_medical_processing():
    """Test the medical document processing pipeline"""
    
    print("🧪 Testing Medical Document Processing Pipeline")
    print("=" * 50)
    
    # Initialize the service
    service = MedicalProcessingService()
    
    # Test medical document
    test_text = """
    DISCHARGE SUMMARY
    
    Patient Name: John Doe
    Patient ID: PAT123
    Date of Admission: 2024-01-10
    Date of Discharge: 2024-01-15
    
    DIAGNOSIS:
    Primary: Acute myocardial infarction
    Secondary: Hypertension, Type 2 diabetes mellitus
    
    TREATMENT:
    - Aspirin 325mg daily
    - Metoprolol 50mg twice daily
    - Lisinopril 10mg daily
    - Metformin 500mg twice daily
    
    MEDICATIONS:
    - Aspirin 325mg PO daily
    - Metoprolol 50mg PO BID
    - Lisinopril 10mg PO daily
    - Metformin 500mg PO BID
    - Atorvastatin 20mg PO daily
    
    ALLERGIES:
    - Penicillin (rash)
    - Sulfa drugs (nausea)
    
    VITAL SIGNS:
    - Blood Pressure: 140/90 mmHg
    - Heart Rate: 72 bpm
    - Temperature: 98.6°F
    - Respiratory Rate: 16/min
    
    LAB RESULTS:
    - Troponin I: 2.5 ng/mL (elevated)
    - CK-MB: 45 ng/mL (elevated)
    - Glucose: 180 mg/dL (elevated)
    - HbA1c: 7.2% (elevated)
    
    IMAGING:
    - Chest X-ray: Normal cardiac silhouette
    - ECG: ST-segment elevation in leads II, III, aVF
    - Echocardiogram: Ejection fraction 45%
    
    ASSESSMENT:
    Patient admitted with acute inferior wall myocardial infarction.
    Successfully treated with percutaneous coronary intervention.
    Blood pressure and glucose control improved with medication adjustments.
    
    PLAN:
    - Continue current medications
    - Follow up with cardiologist in 1 week
    - Follow up with primary care physician in 2 weeks
    - Cardiac rehabilitation program recommended
    - Lifestyle modifications: low-sodium diet, regular exercise
    """
    
    # Create test request
    request = MedicalRecordRequest(
        extracted_text=test_text,
        patient_id="PAT123",
        doc_type="discharge_summary",
        visit_date=datetime(2024, 1, 15, 10, 30, 0),
        additional_metadata={
            "hospital": "General Hospital",
            "doctor": "Dr. Smith",
            "department": "Cardiology",
            "urgency": "routine"
        }
    )
    
    print(f"📄 Processing medical document for patient: {request.patient_id}")
    print(f"📋 Document type: {request.doc_type}")
    print(f"📅 Visit date: {request.visit_date}")
    print(f"📏 Text length: {len(request.extracted_text)} characters")
    print()
    
    try:
        # Process the medical record
        result = await service.process_medical_record(request)
        
        if result["success"]:
            print("✅ Processing completed successfully!")
            print(f"📊 Total chunks created: {result['total_chunks']}")
            print(f"⏱️  Processing time: {result['processing_time']:.2f} seconds")
            print(f"🗄️  Vector store type: {result['vector_store_type']}")
            print(f"🤖 Embedding model: {result['embedding_model']}")
            print()
            
            # Display chunk information
            print("📝 Chunk Details:")
            print("-" * 30)
            for i, chunk in enumerate(result['chunks'][:3]):  # Show first 3 chunks
                print(f"Chunk {i+1}:")
                print(f"  ID: {chunk.chunk_id}")
                print(f"  Size: {chunk.chunk_size} characters")
                print(f"  Text preview: {chunk.chunk_text[:100]}...")
                print()
            
            if len(result['chunks']) > 3:
                print(f"... and {len(result['chunks']) - 3} more chunks")
            
        else:
            print("❌ Processing failed!")
            print(f"Error: {result['message']}")
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()

async def test_service_status():
    """Test the service status endpoint"""
    print("\n🔍 Testing Service Status")
    print("=" * 30)
    
    service = MedicalProcessingService()
    
    print(f"Vector store type: {service.vector_store_type}")
    print(f"Use Azure OpenAI: {service.use_azure_openai}")
    print(f"Use Azure Search: {service.use_azure_search}")
    print(f"Embedding model: text-embedding-ada-002")

if __name__ == "__main__":
    print("🚀 Starting Medical Processing Pipeline Tests")
    print()
    
    # Run tests
    asyncio.run(test_service_status())
    asyncio.run(test_medical_processing())
    
    print("\n✨ Test completed!") 