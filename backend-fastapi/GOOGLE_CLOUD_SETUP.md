# Google Cloud Vision API Setup Guide

## For Medical Chronology 1 Feature

### Step 1: Enable Google Cloud Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Cloud Vision API" and enable it

### Step 2: Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `vision-api-service-account`
4. Description: `Service account for Medical Chronology OCR`
5. Click "Create and Continue"

### Step 3: Assign Permissions

1. Add the following roles:
   - `Cloud Vision API User`
2. Click "Continue"
3. Click "Done"

### Step 4: Create and Download Key

1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create"
6. Download the JSON file

### Step 5: Configure Credentials

#### Option A: Local Development
```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"

# Or add to your .env file
echo "GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json" >> .env
```

#### Option B: Docker Development
1. Copy your service account key to the project:
   ```bash
   cp /path/to/your/service-account-key.json backend-fastapi/google-credentials.json
   ```

2. Update your .env file:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
   ```

3. Update Dockerfile to copy credentials:
   ```dockerfile
   COPY google-credentials.json /app/google-credentials.json
   ```

#### Option C: Production Deployment
- Use Google Cloud's built-in authentication (Workload Identity, etc.)
- Or mount the credentials as a Kubernetes secret

### Step 6: Test the Setup

1. Restart your backend service
2. Check logs for: "Google Cloud Vision client initialized with credentials from: ..."
3. Upload a document in Medical Chronology 1
4. You should see real OCR results instead of mock data

### Troubleshooting

- **"credentials not found"**: Check if the path in GOOGLE_APPLICATION_CREDENTIALS is correct
- **"permission denied"**: Ensure the service account has the Cloud Vision API User role
- **"API not enabled"**: Enable the Cloud Vision API in your Google Cloud project

### Security Notes

- Never commit service account keys to version control
- Use environment variables or secure secret management
- Consider using Google Cloud's built-in authentication for production 