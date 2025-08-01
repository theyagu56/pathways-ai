#!/usr/bin/env python3
"""
Test script to demonstrate OpenAI-based OCR text parsing
"""

import os
import sys
import json
from services.google_ocr_service import GoogleOCRService

def test_openai_parsing():
    """Test the new OpenAI-based parsing functionality"""
    
    # Sample OCR text from a medical document
    sample_ocr_text = """
    MEDICAL BILL
    
    Date: 2024-01-15
    Patient: John Doe
    Diagnosis: Back pain and muscle strain
    Cost: $150.00
    
    X-Ray: Chest X-ray performed
    MRI: Brain scan completed
    
    Additional Notes:
    Patient presented with severe back pain after lifting heavy objects.
    Physical examination revealed muscle strain in the lower back region.
    Treatment plan includes rest, physical therapy, and pain management.
    
    Follow-up appointment scheduled for 2024-02-01
    """
    
    print("🧪 Testing OpenAI-based OCR Text Parsing")
    print("=" * 50)
    print(f"Sample OCR Text:\n{sample_ocr_text}")
    print("\n" + "=" * 50)
    
    # Initialize the OCR service
    ocr_service = GoogleOCRService()
    
    try:
        # Extract medical details using OpenAI
        print("🔍 Extracting medical details using OpenAI...")
        result = ocr_service.extract_medical_details(sample_ocr_text)
        
        print("\n✅ Extraction Results:")
        print(json.dumps(result, indent=2, default=str))
        
        # Show what was extracted
        print("\n📊 Extracted Information Summary:")
        for i, visit in enumerate(result.get('visits', []), 1):
            print(f"\nVisit {i}:")
            print(f"  📅 Date: {visit.get('date', 'Not found')}")
            print(f"  🏥 Diagnosis: {visit.get('diagnosis', 'Not found')}")
            print(f"  💰 Cost: ${visit.get('cost', 'Not found')}")
            print(f"  🔬 Imaging: {visit.get('imaging', 'Not found')}")
            print(f"  📝 Notes: {visit.get('notes', 'Not found')[:100]}...")
        
        if result.get('monthly_summary'):
            print(f"\n📈 Monthly Summary:")
            for summary in result['monthly_summary']:
                print(f"  {summary['year']}-{summary['month']:02d}: ${summary['total_cost']} ({summary['record_count']} records)")
        
        if result.get('errors'):
            print(f"\n⚠️  Errors: {result['errors']}")
            
    except Exception as e:
        print(f"❌ Error during extraction: {e}")
        import traceback
        traceback.print_exc()

def test_with_real_file():
    """Test with a real file if available"""
    test_files = [
        "test_medical.txt",
        "NewSampleBill.pdf",
        "medical_bill_test.png"
    ]
    
    for filename in test_files:
        if os.path.exists(filename):
            print(f"\n🧪 Testing with real file: {filename}")
            print("=" * 50)
            
            try:
                with open(filename, 'rb') as f:
                    file_bytes = f.read()
                
                ocr_service = GoogleOCRService()
                
                # Extract text first
                print("📖 Extracting text from file...")
                extracted_text = ocr_service.extract_text(file_bytes)
                print(f"Extracted {len(extracted_text)} characters")
                print(f"First 200 chars: {extracted_text[:200]}...")
                
                # Extract medical details
                print("\n🔍 Extracting medical details...")
                result = ocr_service.extract_medical_details(extracted_text)
                
                print("\n✅ Results:")
                print(json.dumps(result, indent=2, default=str))
                
                break  # Test with first available file
                
            except Exception as e:
                print(f"❌ Error processing {filename}: {e}")

if __name__ == "__main__":
    print("🚀 Starting OpenAI-based OCR Parsing Test")
    print("Note: Make sure OPENAI_API_KEY is set in your environment")
    print()
    
    # Test with sample text
    test_openai_parsing()
    
    # Test with real file if available
    test_with_real_file()
    
    print("\n🎉 Test completed!") 