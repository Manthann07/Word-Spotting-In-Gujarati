from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import os
import shutil
from typing import List, Dict, Any
import uvicorn
from pydantic import BaseModel
import logging
import time
from pathlib import Path

# Import our custom modules
from models.model_utils import IndicBERTModel
from models.ocr_utils import OCRProcessor
from pdf.pdf_utils import PDFProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Search API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
model_utils = IndicBERTModel()
ocr_processor = OCRProcessor()
pdf_processor = PDFProcessor()

# Ensure uploads directory exists
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

class SearchRequest(BaseModel):
    query: str
    pdf_filename: str

class HighlightRequest(BaseModel):
    query: str
    pdf_filename: str

@app.get("/")
async def root():
    return {"message": "PDF Search API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if uploads directory is accessible
        uploads_dir.mkdir(exist_ok=True)
        
        # Check if models are loaded
        model_status = "loaded" if model_utils else "not_loaded"
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "uploads_directory": str(uploads_dir.absolute()),
            "models_status": model_status,
            "api_version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"[HEALTH] Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF file for processing"""
    start_time = time.time()
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Sanitize filename to prevent path traversal
    safe_filename = Path(file.filename).name
    if not safe_filename or safe_filename.startswith('.'):
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    logger.info(f"[UPLOAD] Starting upload for: {safe_filename}")
    
    # Save uploaded file with error handling
    file_path = uploads_dir / safe_filename
    
    try:
        # Check if file already exists and create backup
        if file_path.exists():
            backup_path = uploads_dir / f"{safe_filename}.backup_{int(time.time())}"
            shutil.move(str(file_path), str(backup_path))
            logger.info(f"[UPLOAD] Existing file backed up to: {backup_path}")
        
        # Save the new file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Verify file was saved correctly
        if not file_path.exists():
            raise HTTPException(status_code=500, detail="Failed to save uploaded file")
        
        file_size = file_path.stat().st_size
        logger.info(f"[UPLOAD] File saved successfully: {safe_filename} ({file_size} bytes)")
        
        # Process the PDF
        logger.info(f"[PROCESS] Starting PDF processing for: {safe_filename}")
        result = await pdf_processor.process_pdf(str(file_path))
        
        if "error" in result:
            logger.error(f"[PROCESS] PDF processing failed: {result['error']}")
            raise HTTPException(status_code=500, detail=result["error"])
        
        processing_time = time.time() - start_time
        logger.info(f"[SUCCESS] PDF processed successfully in {processing_time:.2f}s: {safe_filename}")
        
        # Add processing time to result
        result["processing_time"] = processing_time
        result["file_size"] = file_size
        
        return JSONResponse(content=result)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error during upload/processing: {str(e)}")
        # Clean up failed upload
        if file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"[CLEANUP] Removed failed upload: {safe_filename}")
            except Exception as cleanup_error:
                logger.error(f"[CLEANUP] Failed to remove file: {cleanup_error}")
        
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/search")
async def search_pdf(request: SearchRequest):
    query = request.query
    pdf_filename = request.pdf_filename
    """Search for text in a specific PDF"""
    pdf_path = os.path.join("uploads", pdf_filename)
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    try:
        # Normalize and trim query to avoid invisible chars interfering with matching
        query_norm = query.strip()
        # First try exact text matching for better highlighting
        exact_results = model_utils.search_with_exact_matching(pdf_path, query_norm)
        
        # If we found exact matches, return them
        if exact_results["results"]:
            return JSONResponse(content=exact_results)
        
        # If no exact matches, fall back to semantic search
        results = await model_utils.search_text(pdf_path, query_norm)
        return JSONResponse(content=results)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching PDF: {str(e)}")

@app.get("/pdfs")
async def list_pdfs():
    """List all uploaded PDFs"""
    pdf_files = []
    for filename in os.listdir("uploads"):
        if filename.endswith('.pdf'):
            pdf_files.append(filename)
    return {"pdfs": pdf_files}

@app.post("/download-highlighted")
async def download_highlighted_pdf(request: HighlightRequest):
    """Generate a highlighted PDF for the given query and return it as a file download"""
    try:
        query = request.query.strip()
        pdf_filename = request.pdf_filename

        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        pdf_path = uploads_dir / Path(pdf_filename).name
        if not pdf_path.exists():
            raise HTTPException(status_code=404, detail="PDF file not found")

        # Create highlighted PDF using PyMuPDF via our PDFProcessor
        output_path = pdf_processor.highlight_text_in_pdf(str(pdf_path), [query])
        if not output_path or not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Failed to generate highlighted PDF")

        download_name = f"{Path(pdf_filename).stem}_highlighted.pdf"
        return FileResponse(path=output_path, media_type="application/pdf", filename=download_name)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DOWNLOAD] Failed to generate highlighted PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating highlighted PDF: {str(e)}")

@app.get("/download-highlighted")
async def download_highlighted_pdf_get(query: str, pdf_filename: str):
    """GET variant for compatibility: accepts query params and returns highlighted PDF"""
    try:
        q = (query or "").strip()
        if not q:
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        pdf_path = uploads_dir / Path(pdf_filename).name
        if not pdf_path.exists():
            raise HTTPException(status_code=404, detail="PDF file not found")

        output_path = pdf_processor.highlight_text_in_pdf(str(pdf_path), [q])
        if not output_path or not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Failed to generate highlighted PDF")

        download_name = f"{Path(pdf_filename).stem}_highlighted.pdf"
        return FileResponse(path=output_path, media_type="application/pdf", filename=download_name)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DOWNLOAD][GET] Failed to generate highlighted PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating highlighted PDF: {str(e)}")

@app.get("/test-search")
async def test_search():
    """Test endpoint to verify search functionality"""
    return {
        "message": "Search endpoint is working",
        "test_query": "નવલકથા",
        "test_text": "આ એક નવલકથા છે જેમાં ઇતિહાસ વિશે લખવામાં આવ્યું છે",
        "contains_query": "નવલકથા" in "આ એક નવલકથા છે જેમાં ઇતિહાસ વિશે લખવામાં આવ્યું છે"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 