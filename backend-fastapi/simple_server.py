#!/usr/bin/env python3
"""
Simple FastAPI server for Pathways AI - minimal version to get started
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn
import os

# Create FastAPI app
app = FastAPI(
    title="Pathways AI API",
    description="Medical AI Assistant API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Pathways AI API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Pathways AI Backend"}

@app.get("/docs-redirect")
async def docs_redirect():
    """Redirect to API docs"""
    return HTMLResponse("""
    <html>
        <head>
            <title>Pathways AI API</title>
        </head>
        <body>
            <h1>Pathways AI API</h1>
            <p>The API is running successfully!</p>
            <p><a href="/docs">View API Documentation</a></p>
            <p><a href="/health">Health Check</a></p>
        </body>
    </html>
    """)

@app.get("/api/test")
async def test_endpoint():
    """Test endpoint for frontend connectivity"""
    return {
        "message": "Backend connection successful",
        "backend_status": "running",
        "timestamp": "2025-08-09"
    }

if __name__ == "__main__":
    print("🚀 Starting Pathways AI Backend Server...")
    print("📊 API Documentation will be available at: http://localhost:8000/docs")
    print("🔍 Health check available at: http://localhost:8000/health")
    
    uvicorn.run(
        "simple_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
