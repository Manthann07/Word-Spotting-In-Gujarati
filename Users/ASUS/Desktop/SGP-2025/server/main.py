from fastapi import FastAPI, UploadFile, File, HTTPException, Form
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
from PIL import Image

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
        result["file_type"] = "pdf"
        
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

@app.post("/search-by-image")
async def search_by_image(pdf_filename: str = Form(...), image: UploadFile = File(...)):
    """Search inside an uploaded PDF using an uploaded image of a word/phrase.

    - OCRs the provided image (Gujarati + English)
    - Runs exact match first, then semantic search as fallback on the target PDF
    - Returns normal search payload plus the extracted query string
    """
    try:
        # Validate target PDF
        target_pdf_path = uploads_dir / Path(pdf_filename).name
        if not target_pdf_path.exists() or not str(target_pdf_path).lower().endswith('.pdf'):
            raise HTTPException(status_code=404, detail="Target PDF not found")

        # Validate and load image bytes into PIL
        if not image.filename:
            raise HTTPException(status_code=400, detail="Image file is required")

        try:
            img = Image.open(image.file)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

        # OCR (advanced for better Gujarati extraction)
        try:
            extracted = ocr_processor.extract_text_with_advanced_ocr(img, ['guj','eng'])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to OCR image: {e}")
        finally:
            try:
                img.close()
            except Exception:
                pass

        extracted_query = (extracted or '').strip()
        if not extracted_query:
            raise HTTPException(status_code=422, detail="Could not read any text from the image")

        # Search in PDF: exact match first, semantic fallback (same pipeline as text search)
        exact_results = model_utils.search_with_exact_matching(str(target_pdf_path), extracted_query)
        if exact_results.get("results"):
            exact_results["extracted_query"] = extracted_query
            exact_results["query"] = extracted_query
            exact_results["search_type"] = exact_results.get("search_type") or "exact_match_from_image"
            return JSONResponse(content=exact_results)

        results = await model_utils.search_text(str(target_pdf_path), extracted_query)
        results["extracted_query"] = extracted_query
        results["query"] = extracted_query
        results["search_type"] = results.get("search_type") or "semantic_from_image"
        return JSONResponse(content=results)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching by image: {str(e)}")

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload a PNG/JPG image and process it natively (no PDF conversion)."""
    start_time = time.time()

    # Validate filename
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    name_lower = file.filename.lower()
    if not (name_lower.endswith('.png') or name_lower.endswith('.jpg') or name_lower.endswith('.jpeg')):
        raise HTTPException(status_code=400, detail="Only PNG/JPG images are allowed")

    # Sanitize filename and derive pdf name
    safe_filename = Path(file.filename).name
    if not safe_filename or safe_filename.startswith('.'):
        raise HTTPException(status_code=400, detail="Invalid filename")

    base_stem = Path(safe_filename).stem
    image_path = uploads_dir / safe_filename

    try:
        # Save image first
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Normalize extension based on actual content format
        try:
            with Image.open(image_path) as img_probe:
                fmt = (img_probe.format or '').upper()
                desired_ext = '.png' if fmt == 'PNG' else ('.jpg' if fmt in ('JPEG', 'JPG') else image_path.suffix.lower())
        except Exception:
            desired_ext = image_path.suffix.lower() or '.png'

        if desired_ext not in ['.png', '.jpg', '.jpeg']:
            desired_ext = '.png'

        if image_path.suffix.lower() != desired_ext:
            corrected_path = uploads_dir / f"{base_stem}{desired_ext}"
            try:
                if corrected_path.exists():
                    corrected_path.unlink()
                image_path.rename(corrected_path)
                image_path = corrected_path
            except Exception:
                # If rename fails, keep original path
                pass

        file_size = image_path.stat().st_size if image_path.exists() else 0

        # OCR the image directly (advanced)
        try:
            with Image.open(image_path) as img:
                text = ocr_processor.extract_text_with_advanced_ocr(img, ['guj', 'eng'])
        except Exception as ie:
            raise HTTPException(status_code=500, detail=f"Failed to OCR image: {ie}")

        pages = []
        if text and text.strip():
            pages.append({
                "page": 1,
                "text": text.strip(),
                "confidence": 0.8
            })

        result = {
            "success": True,
            "filename": image_path.name,
            "total_pages": 1,
            "processing_method": "Image OCR",
            "detected_languages": ['guj','eng'],
            "pdf_info": {"num_pages": 1, "file_size": file_size},
            "pages": pages,
            "file_type": "image",
            "image_ext": image_path.suffix.lower() or ".png"
        }
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        processing_time = time.time() - start_time
        result["processing_time"] = processing_time
        result["file_size"] = file_size

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on error
        if image_path.exists():
            try:
                image_path.unlink()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/download-highlighted-image")
async def download_highlighted_image(request: HighlightRequest):
    """Generate a highlighted image for the given query and return it for download"""
    try:
        query = request.query.strip()
        image_filename = request.pdf_filename  # reuse field name from client; holds image name

        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        image_path = uploads_dir / Path(image_filename).name
        if not image_path.exists():
            raise HTTPException(status_code=404, detail="Image file not found")

        output_path = pdf_processor.highlight_text_in_image(str(image_path), [query])
        if not output_path or not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Failed to generate highlighted image")

        download_name = f"{Path(image_filename).stem}_highlighted{image_path.suffix or '.png'}"
        media_type = 'image/png' if image_path.suffix.lower() == '.png' else 'image/jpeg'
        return FileResponse(path=output_path, media_type=media_type, filename=download_name)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DOWNLOAD][IMAGE] Failed to generate highlighted image: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating highlighted image: {str(e)}")

@app.post("/search")
async def search_pdf(request: SearchRequest):
    query = request.query
    pdf_filename = request.pdf_filename
    """Search for text in a specific PDF"""
    file_path = os.path.join("uploads", pdf_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Normalize and trim query to avoid invisible chars interfering with matching
        query_norm = query.strip()
        # Branch based on file type
        if file_path.lower().endswith('.pdf'):
            # First try exact text matching for better highlighting
            exact_results = model_utils.search_with_exact_matching(file_path, query_norm)
            if exact_results["results"]:
                return JSONResponse(content=exact_results)
            # If no exact matches, fall back to semantic search
            results = await model_utils.search_text(file_path, query_norm)
            return JSONResponse(content=results)
        else:
            # Image flow: OCR the image then run exact matching on the text
            try:
                from PIL import Image
                with Image.open(file_path) as img:
                    text = ocr_processor.extract_text_with_ocr(img, ['guj','eng'])
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error reading image: {e}")

            text_norm = (text or '').strip()
            pages = []
            if text_norm:
                matches = model_utils.find_exact_matches(text_norm, query_norm)
                score = float(len(matches)) / max(1, len(text_norm)) * 1000.0
                context_start = 0
                context_end = min(len(text_norm), 300)
                if matches:
                    first = matches[0]
                    context_start = max(0, first['position'] - 100)
                    context_end = min(len(text_norm), first['position'] + len(query_norm) + 100)
                context_text = text_norm[context_start:context_end]
                if context_start > 0:
                    context_text = '...' + context_text
                if context_end < len(text_norm):
                    context_text = context_text + '...'
                pages.append({
                    'page': 1,
                    'text': context_text,
                    'score': score,
                    'full_text': text_norm,
                    'exact_matches': matches,
                    'match_count': len(matches),
                    'has_exact_match': len(matches) > 0
                })

            return JSONResponse(content={
                'results': pages,
                'total_pages': 1,
                'query': query_norm,
                'search_type': 'exact_match_image'
            })
        
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