#!/usr/bin/env python3
"""
Test script to verify OpenAI API key is working
"""

import os
from dotenv import load_dotenv
import openai

def test_openai_key():
    """Test if the OpenAI API key is working"""
    print("🔑 Testing OpenAI API Key...")
    
    # Load environment variables from .env file (local development)
    load_dotenv('.env')
    
    # Get API key
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("❌ No OpenAI API key found in .env file")
        return False
    
    if api_key == 'your_openai_api_key_here':
        print("❌ API key is still set to placeholder value in .env file")
        print("Please update .env with your actual OpenAI API key")
        return False
    
    print(f"🔑 API Key found: {api_key[:10]}...{api_key[-4:]}")
    
    try:
        # Test the API key with a simple request
        client = openai.OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "Say 'Hello, API key is working!'"}
            ],
            max_tokens=10
        )
        
        print("✅ OpenAI API key is working!")
        print(f"📝 Response: {response.choices[0].message.content}")
        return True
        
    except Exception as e:
        print(f"❌ OpenAI API key test failed: {e}")
        return False

if __name__ == "__main__":
    test_openai_key() 