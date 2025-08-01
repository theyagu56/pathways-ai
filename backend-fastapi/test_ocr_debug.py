#!/usr/bin/env python3
"""
Debug script to test OCR functionality
"""

import requests
import json
import os

def test_ocr_upload():
    """Test the OCR upload endpoint"""
    print("🔍 Testing OCR Upload Endpoint...")
    
    # Create a simple test file
    test_content = b"""
    MEDICAL BILL
    Date: 2024-01-15
    Patient: John Doe
    Diagnosis: Back pain
    Cost: $150.00
    """
    
    # Test the upload endpoint
    url = "http://localhost:8000/google-ocr/upload"
    
    try:
        files = {
            'file': ('test_medical.txt', test_content, 'text/plain')
        }
        
        print(f"📤 Uploading test file to {url}")
        response = requests.post(url, files=files)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Upload successful!")
            print(f"📋 Found {len(result.get('visits', []))} visits")
            print(f"📄 Raw text length: {len(result.get('raw_text', ''))}")
            
            # Print the first visit details
            if result.get('visits'):
                visit = result['visits'][0]
                print(f"📅 Date: {visit.get('date')}")
                print(f"🏥 Diagnosis: {visit.get('diagnosis')}")
                print(f"💰 Cost: {visit.get('cost')}")
                print(f"📝 Notes: {visit.get('notes', '')[:100]}...")
            
            return True
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during upload: {e}")
        return False

def test_server_health():
    """Test if the server is healthy"""
    print("🏥 Testing Server Health...")
    
    try:
        response = requests.get("http://localhost:8000/")
        if response.status_code == 200:
            print("✅ Server is healthy")
            return True
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server health check error: {e}")
        return False

def test_api_endpoints():
    """Test available API endpoints"""
    print("🔗 Testing API Endpoints...")
    
    endpoints = [
        "/",
        "/docs",
        "/openapi.json"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"http://localhost:8000{endpoint}")
            print(f"✅ {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: {e}")

def main():
    """Main debug function"""
    print("🚀 Starting OCR Debug Session")
    print("=" * 50)
    
    # Test server health
    if not test_server_health():
        print("❌ Server is not healthy. Please start the backend server first.")
        return
    
    print()
    
    # Test API endpoints
    test_api_endpoints()
    
    print()
    
    # Test OCR upload
    success = test_ocr_upload()
    
    print()
    print("=" * 50)
    if success:
        print("✅ OCR Debug Test Completed Successfully!")
    else:
        print("❌ OCR Debug Test Failed!")
    
    print("\n📋 Next Steps:")
    print("1. Check the server logs for any errors")
    print("2. Try uploading a real document from the frontend")
    print("3. If issues persist, check the OpenAI API key configuration")

if __name__ == "__main__":
    main() 