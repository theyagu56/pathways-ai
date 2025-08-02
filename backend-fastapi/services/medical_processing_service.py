import os
import asyncio
import time
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from sqlalchemy.orm import Session

# LangChain imports
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.vectorstores import FAISS

# Local imports
from app.core.database import SessionLocal
from app.models.medical_chunk import MedicalChunk
from app.schemas.medical_processing import MedicalRecordRequest, MedicalChunkResponse
from utils.logger import get_logger

logger = get_logger(__name__)

class MedicalProcessingService:
    def __init__(self):
        self.use_azure_search = os.getenv("USE_AZURE_SEARCH", "false").lower() == "true"
        self.use_azure_openai = os.getenv("USE_AZURE_OPENAI", "false").lower() == "true"
        self.embeddings = None
        self.vector_store = None
        self.text_splitter = None
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize embedding model, vector store, and text splitter"""
        try:
            # Initialize text splitter
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=750,  # Target 500-1000 chars
                chunk_overlap=150,  # 20% overlap
                length_function=len,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            logger.info("Text splitter initialized with 750 char chunks and 150 char overlap")
            
            # Initialize embedding model
            if self.use_azure_openai:
                logger.info("Initializing Azure OpenAI embeddings")
                self.embeddings = AzureOpenAIEmbeddings(
                    azure_deployment=os.getenv("AZURE_EMBEDDING_DEPLOYMENT", "text-embedding-ada-002"),
                    openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2023-05-15"),
                    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
                    openai_api_key=os.getenv("AZURE_OPENAI_API_KEY")
                )
                logger.info("Azure OpenAI embeddings initialized successfully")
            else:
                logger.info("Initializing OpenAI embeddings")
                self.embeddings = OpenAIEmbeddings(
                    model="text-embedding-ada-002",
                    openai_api_key=os.getenv("OPENAI_API_KEY")
                )
                logger.info("OpenAI embeddings initialized successfully")
            
            # Initialize vector store (FAISS for dev, Azure Cognitive Search for prod)
            if self.use_azure_search:
                logger.info("Azure Cognitive Search will be used for vector storage")
                # TODO: Implement Azure Cognitive Search integration
                self.vector_store_type = "azure"
            else:
                logger.info("FAISS will be used for vector storage")
                self.vector_store_type = "faiss"
                
        except Exception as e:
            logger.error(f"Failed to initialize medical processing components: {e}")
            raise
    
    async def process_medical_record(self, request: MedicalRecordRequest) -> Dict[str, Any]:
        """Process medical record through the complete pipeline"""
        start_time = time.time()
        logger.info(f"Starting medical record processing for patient {request.patient_id}")
        
        try:
            # Step 1: Text chunking
            logger.info("Step 1: Splitting text into chunks")
            chunks = await self._split_text(request.extracted_text)
            logger.info(f"Created {len(chunks)} text chunks")
            
            # Step 2: Generate embeddings and store
            logger.info("Step 2: Generating embeddings and storing vectors")
            chunk_responses = []
            
            for i, chunk_text in enumerate(chunks):
                chunk_response = await self._process_chunk(
                    chunk_text=chunk_text,
                    chunk_index=i,
                    patient_id=request.patient_id,
                    doc_type=request.doc_type,
                    visit_date=request.visit_date,
                    additional_metadata=request.additional_metadata
                )
                chunk_responses.append(chunk_response)
            
            processing_time = time.time() - start_time
            logger.info(f"Medical record processing completed in {processing_time:.2f} seconds")
            
            return {
                "success": True,
                "message": f"Successfully processed {len(chunks)} chunks",
                "total_chunks": len(chunks),
                "chunks": chunk_responses,
                "processing_time": processing_time,
                "vector_store_type": self.vector_store_type,
                "embedding_model": "text-embedding-ada-002"
            }
            
        except Exception as e:
            logger.error(f"Error processing medical record: {e}")
            return {
                "success": False,
                "message": f"Processing failed: {str(e)}",
                "total_chunks": 0,
                "chunks": [],
                "processing_time": time.time() - start_time,
                "vector_store_type": self.vector_store_type,
                "embedding_model": "text-embedding-ada-002"
            }
    
    async def _split_text(self, text: str) -> List[str]:
        """Split text into chunks using LangChain's RecursiveCharacterTextSplitter"""
        try:
            # Handle section headers and multiline paragraphs
            # Pre-process text to better handle medical document structure
            processed_text = self._preprocess_medical_text(text)
            
            # Split text into chunks
            chunks = self.text_splitter.split_text(processed_text)
            
            # Filter out very short chunks (likely noise)
            filtered_chunks = [chunk.strip() for chunk in chunks if len(chunk.strip()) > 50]
            
            logger.info(f"Text split into {len(filtered_chunks)} chunks after filtering")
            return filtered_chunks
            
        except Exception as e:
            logger.error(f"Error splitting text: {e}")
            raise
    
    def _preprocess_medical_text(self, text: str) -> str:
        """Preprocess medical text to improve chunking quality"""
        # Normalize whitespace
        text = " ".join(text.split())
        
        # Handle common medical document patterns
        # Replace multiple newlines with double newlines for better splitting
        text = text.replace("\n\n\n", "\n\n")
        
        # Ensure proper spacing around section headers
        import re
        # Add spacing around common medical section headers
        headers = [
            r"DIAGNOSIS:", r"TREATMENT:", r"MEDICATIONS:", r"ALLERGIES:",
            r"VITAL SIGNS:", r"LAB RESULTS:", r"IMAGING:", r"ASSESSMENT:",
            r"PLAN:", r"HISTORY:", r"PHYSICAL EXAM:", r"DISCHARGE:"
        ]
        
        for header in headers:
            text = re.sub(header, f"\n\n{header}\n", text, flags=re.IGNORECASE)
        
        return text
    
    async def _process_chunk(self, chunk_text: str, chunk_index: int, patient_id: str, 
                           doc_type: str, visit_date: Optional[datetime], 
                           additional_metadata: Dict[str, Any]) -> MedicalChunkResponse:
        """Process individual chunk: generate embedding, store in vector DB, save metadata"""
        try:
            # Generate embedding
            logger.debug(f"Generating embedding for chunk {chunk_index}")
            embedding = await self._generate_embedding(chunk_text)
            
            # Store in vector database
            vector_id = await self._store_vector(chunk_text, embedding, patient_id, doc_type)
            
            # Save metadata to SQLite
            chunk_response = await self._save_chunk_metadata(
                chunk_text=chunk_text,
                chunk_index=chunk_index,
                patient_id=patient_id,
                doc_type=doc_type,
                visit_date=visit_date,
                vector_id=vector_id,
                additional_metadata=additional_metadata
            )
            
            logger.debug(f"Successfully processed chunk {chunk_index}")
            return chunk_response
            
        except Exception as e:
            logger.error(f"Error processing chunk {chunk_index}: {e}")
            raise
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text"""
        try:
            # Use asyncio to run embedding generation in thread pool
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(None, self.embeddings.embed_query, text)
            return embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    async def _store_vector(self, text: str, embedding: List[float], 
                          patient_id: str, doc_type: str) -> str:
        """Store vector in appropriate vector database"""
        try:
            if self.vector_store_type == "faiss":
                return await self._store_in_faiss(text, embedding, patient_id, doc_type)
            elif self.vector_store_type == "azure":
                return await self._store_in_azure_search(text, embedding, patient_id, doc_type)
            else:
                raise ValueError(f"Unsupported vector store type: {self.vector_store_type}")
        except Exception as e:
            logger.error(f"Error storing vector: {e}")
            raise
    
    async def _store_in_faiss(self, text: str, embedding: List[float], 
                            patient_id: str, doc_type: str) -> str:
        """Store vector in FAISS"""
        try:
            # Create or load FAISS index
            faiss_path = f"vector_store/faiss_index_{patient_id}"
            os.makedirs("vector_store", exist_ok=True)
            
            # For simplicity, we'll create a new index for each patient
            # In production, you might want to maintain a single index
            vector_store = FAISS.from_texts(
                texts=[text],
                embedding=self.embeddings,
                metadatas=[{"patient_id": patient_id, "doc_type": doc_type}]
            )
            
            # Save the index
            vector_store.save_local(faiss_path)
            
            # Return a unique identifier for this vector
            vector_id = f"faiss_{patient_id}_{hash(text) % 1000000}"
            logger.debug(f"Stored vector in FAISS with ID: {vector_id}")
            return vector_id
            
        except Exception as e:
            logger.error(f"Error storing in FAISS: {e}")
            raise
    
    async def _store_in_azure_search(self, text: str, embedding: List[float], 
                                   patient_id: str, doc_type: str) -> str:
        """Store vector in Azure Cognitive Search"""
        # TODO: Implement Azure Cognitive Search integration
        logger.warning("Azure Cognitive Search integration not yet implemented")
        return f"azure_{patient_id}_{hash(text) % 1000000}"
    
    async def _save_chunk_metadata(self, chunk_text: str, chunk_index: int, 
                                 patient_id: str, doc_type: str, 
                                 visit_date: Optional[datetime], vector_id: str,
                                 additional_metadata: Dict[str, Any]) -> MedicalChunkResponse:
        """Save chunk metadata to SQLite database"""
        try:
            db = SessionLocal()
            try:
                # Create new chunk record
                chunk = MedicalChunk(
                    patient_id=patient_id,
                    doc_type=doc_type,
                    visit_date=visit_date,
                    chunk_text=chunk_text,
                    chunk_index=chunk_index,
                    chunk_size=len(chunk_text),
                    embedding_model="text-embedding-ada-002",
                    vector_store_type=self.vector_store_type,
                    vector_id=vector_id,
                    chunk_metadata=additional_metadata
                )
                
                db.add(chunk)
                db.commit()
                db.refresh(chunk)
                
                logger.debug(f"Saved chunk metadata to database: {chunk.chunk_id}")
                
                return MedicalChunkResponse(
                    chunk_id=chunk.chunk_id,
                    patient_id=chunk.patient_id,
                    doc_type=chunk.doc_type,
                    chunk_text=chunk.chunk_text,
                    chunk_index=chunk.chunk_index,
                    chunk_size=chunk.chunk_size,
                    embedding_model=chunk.embedding_model,
                    vector_store_type=chunk.vector_store_type,
                    vector_id=chunk.vector_id,
                    metadata=chunk.chunk_metadata,
                    created_at=chunk.created_at
                )
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error saving chunk metadata: {e}")
            raise 