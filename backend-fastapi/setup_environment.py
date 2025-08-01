#!/usr/bin/env python3
"""
Setup script for Pathways AI Backend
This script helps configure the environment and database properly.
"""

import os
import sys
from pathlib import Path

def setup_environment():
    """Setup the environment for the backend"""
    print("🔧 Setting up Pathways AI Backend Environment...")
    
    # Check if .env.production exists
    env_file = Path(".env.production")
    if not env_file.exists():
        print("❌ .env.production file not found!")
        print("Please create .env.production with your OpenAI API key")
        return False
    
    # Read current environment
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Check if OpenAI API key is set
    if "your_openai_api_key_here" in content:
        print("⚠️  WARNING: OpenAI API key is still set to placeholder value!")
        print("Please update .env.production with your actual OpenAI API key")
        print("Example: OPENAI_API_KEY=sk-your-actual-api-key-here")
        return False
    
    print("✅ Environment configuration looks good!")
    return True

def setup_database():
    """Setup the database"""
    print("\n🗄️  Setting up database...")
    
    try:
        from app.core.database import create_tables
        create_tables()
        print("✅ Database tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Pathways AI Backend Setup")
    print("=" * 40)
    
    # Setup environment
    if not setup_environment():
        print("\n❌ Environment setup failed. Please fix the issues above.")
        return 1
    
    # Setup database
    if not setup_database():
        print("\n❌ Database setup failed. Please fix the issues above.")
        return 1
    
    print("\n✅ Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Start the backend server: python -m uvicorn main:app --host 0.0.0.0 --port 8000")
    print("2. Access the API documentation: http://localhost:8000/docs")
    print("3. Test OCR functionality by uploading a document")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 