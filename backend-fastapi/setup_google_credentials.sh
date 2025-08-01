#!/bin/bash

# Google Cloud Vision API Credentials Setup Script
# For Medical Chronology 1 Feature

echo "🔧 Setting up Google Cloud Vision API credentials..."

# Check if credentials file exists
if [ -f "google-credentials.json" ]; then
    echo "✅ Found google-credentials.json"
    
    # Set environment variable
    export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/google-credentials.json"
    echo "✅ Set GOOGLE_APPLICATION_CREDENTIALS to: $GOOGLE_APPLICATION_CREDENTIALS"
    
    # Add to .env file if it exists
    if [ -f ".env" ]; then
        # Check if already exists in .env
        if ! grep -q "GOOGLE_APPLICATION_CREDENTIALS" .env; then
            echo "GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/google-credentials.json" >> .env
            echo "✅ Added to .env file"
        else
            echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS already exists in .env"
        fi
    else
        echo "⚠️  .env file not found, creating one..."
        echo "GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/google-credentials.json" > .env
        echo "✅ Created .env file with credentials path"
    fi
    
    echo ""
    echo "🎉 Setup complete! You can now run your backend with real Google Vision API."
    echo "📝 To test: Upload a document in Medical Chronology 1 page"
    
else
    echo "❌ google-credentials.json not found!"
    echo ""
    echo "📋 To get credentials:"
    echo "1. Go to https://console.cloud.google.com/"
    echo "2. Create a service account with 'Cloud Vision API User' role"
    echo "3. Download the JSON key file"
    echo "4. Rename it to 'google-credentials.json' and place it in this directory"
    echo ""
    echo "📖 See GOOGLE_CLOUD_SETUP.md for detailed instructions"
fi 