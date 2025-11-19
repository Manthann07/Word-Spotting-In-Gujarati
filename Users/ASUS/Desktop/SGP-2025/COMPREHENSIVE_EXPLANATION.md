# Comprehensive Code Explanation for Gujarati Word Spotting System

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Files Explanation](#backend-files-explanation)
5. [Frontend Files Explanation](#frontend-files-explanation)
6. [How It Works](#how-it-works)
7. [Why These Technologies](#why-these-technologies)

---

## Project Overview

This is a **Gujarati Word Spotting System** - a web application that allows users to:
- Upload PDF documents (or images) containing Gujarati text
- Search for specific words or phrases within those documents
- View search results with highlighted matches
- Download highlighted versions of documents

**Key Features:**
- Multi-language support (Gujarati + English)
- OCR (Optical Character Recognition) for scanned documents
- AI-powered semantic search using IndicBERT
- Exact text matching for precise results
- Modern, responsive web interface

---

## System Architecture

```
┌─────────────────┐
│   React Client  │  (Frontend - User Interface)
│   (Port 5173)   │
└────────┬────────┘
         │ HTTP Requests
         │ (REST API)
         ▼
┌─────────────────┐
│  FastAPI Server │  (Backend - Business Logic)
│   (Port 8000)   │
└────────┬────────┘
         │
         ├──► PDF Processing
         ├──► OCR Processing
         ├──► AI Model (IndicBERT)
         └──► File Storage
```

---

## Technology Stack

### Backend Technologies

| Technology | Version | Purpose | Why Use This? |
|------------|---------|---------|---------------|
| **FastAPI** | 0.104.1 | Web framework | Modern, fast, automatic API documentation, async support |
| **PyPDF2** | 3.0.1 | PDF text extraction | Lightweight, reliable for text-based PDFs |
| **PyMuPDF (fitz)** | 1.26.3 | Advanced PDF processing | Better rendering, OCR support, highlighting capabilities |
| **Tesseract OCR** | - | Text recognition | Industry-standard OCR, supports Gujarati language |
| **EasyOCR** | 1.7.0 | Alternative OCR | Better for Indic languages, deep learning-based |
| **Transformers** | 4.35.2 | AI model framework | Access to pre-trained IndicBERT model |
| **PyTorch** | 2.1.1 | Deep learning | Required for running IndicBERT model |
| **scikit-learn** | 1.3.2 | ML utilities | Cosine similarity for semantic search |
| **Pillow (PIL)** | 10.1.0 | Image processing | Image preprocessing for OCR |

### Frontend Technologies

| Technology | Version | Purpose | Why Use This? |
|------------|---------|---------|---------------|
| **React** | 19.1.0 | UI framework | Component-based, reactive, large ecosystem |
| **Vite** | 5.4.0 | Build tool | Fast development, optimized builds |
| **Tailwind CSS** | 4.1.11 | Styling | Utility-first CSS, rapid UI development |
| **Axios** | 1.10.0 | HTTP client | Promise-based, interceptors, error handling |

---

## Backend Files Explanation

### 1. `server/main.py` - FastAPI Application Entry Point

**Purpose:** Main API server that handles all HTTP requests

**Key Components:**

#### API Endpoints:
- `GET /` - Health check endpoint
- `GET /health` - Detailed health status
- `POST /upload-pdf` - Upload and process PDF files
- `POST /upload-image` - Upload and OCR images
- `POST /search` - Search for text in documents
- `POST /search-by-image` - Search using an image query
- `POST /download-highlighted` - Download highlighted PDF
- `POST /download-highlighted-image` - Download highlighted image
- `GET /pdfs` - List all uploaded PDFs

#### How It Works:
1. **CORS Middleware**: Allows React frontend (localhost:5173) to communicate with backend
2. **Model Initialization**: Loads IndicBERT model and OCR processor on startup
3. **File Upload Handling**: 
   - Validates file type and size
   - Saves to `uploads/` directory
   - Processes PDF/image using appropriate utilities
4. **Search Processing**:
   - First tries exact text matching (faster, more accurate)
   - Falls back to semantic search if no exact matches
   - Returns results with page numbers and relevance scores

#### Why FastAPI?
- **Automatic API Documentation**: Swagger UI at `/docs`
- **Type Safety**: Pydantic models for request validation
- **Async Support**: Better performance for I/O operations
- **Modern Python**: Uses Python 3.8+ features

---

### 2. `server/models/ocr_utils.py` - OCR Processing Module

**Purpose:** Handles Optical Character Recognition for scanned documents and images

**Key Features:**

#### OCRProcessor Class:
```python
class OCRProcessor:
    - __init__(): Configures Tesseract and EasyOCR
    - extract_text_with_advanced_ocr(): Multi-method OCR with fallbacks
    - process_scanned_pdf(): Processes entire PDF page by page
    - preprocess_image(): Enhances image quality for better OCR
```

#### How It Works:

1. **Tesseract Configuration**:
   - Detects Windows installation path
   - Sets up Gujarati language support
   - Tests installation on startup

2. **Advanced OCR Method**:
   - **Multiple Preprocessing**: Creates 3 different image versions:
     - Standard contrast enhancement
     - High contrast preprocessing
     - Inverted image (for dark text on light background)
   - **Multiple OCR Configurations**: Tries 6+ different Tesseract settings:
     - Different OCR engines (LSTM vs Neural)
     - Different page segmentation modes (PSM)
     - Gujarati-only vs Gujarati+English
   - **Result Scoring**: Selects best result based on:
     - Text length
     - Gujarati character count
     - Overall quality

3. **Text Cleaning**:
   - Fixes common OCR mistakes (e.g., `|` → `।`)
   - Converts English digits to Gujarati digits
   - Removes OCR artifacts
   - Normalizes Unicode characters

#### Why This Approach?
- **Robustness**: Multiple methods ensure text extraction even from poor quality images
- **Accuracy**: Different preprocessing helps with various image conditions
- **Language Support**: Specifically optimized for Gujarati characters
- **Fallback Strategy**: EasyOCR provides backup when Tesseract struggles

---

### 3. `server/models/model_utils.py` - AI Model and Search Logic

**Purpose:** Handles semantic search using IndicBERT model

**Key Components:**

#### IndicBERTModel Class:
```python
class IndicBERTModel:
    - __init__(): Initializes model (lazy loading)
    - _load_model(): Loads IndicBERT from HuggingFace
    - extract_text_from_pdf(): Extracts text with OCR fallback
    - get_embeddings(): Converts text to vector representations
    - search_text_sync(): Semantic search using cosine similarity
    - search_with_exact_matching(): Fast exact text matching
    - find_exact_matches(): Unicode-safe pattern matching
```

#### How It Works:

1. **Model Loading**:
   - Uses `ai4bharat/indic-bert` pre-trained model
   - Loads only when first search is performed (lazy loading)
   - Falls back to simple search if model unavailable

2. **Text Extraction**:
   - Primary: Direct text extraction from PDF text layer
   - Fallback: OCR for scanned pages with no text
   - Normalization: Unicode NFC normalization for consistent matching

3. **Semantic Search Process**:
   ```
   Query Text → IndicBERT → Embedding Vector (768 dimensions)
                                      ↓
   PDF Pages → IndicBERT → Page Embeddings
                                      ↓
   Cosine Similarity → Relevance Scores → Ranked Results
   ```

4. **Caching Strategy**:
   - Caches extracted text per PDF (keyed by file path + modification time)
   - Caches embeddings to avoid recomputation
   - Invalidates cache when PDF is updated

5. **Hybrid Search**:
   - **Exact Matching First**: Fast, precise for exact phrases
   - **Semantic Search Fallback**: Finds related content even with different wording
   - **Unicode-Safe**: Handles zero-width characters and normalization

#### Why IndicBERT?
- **Indic Language Support**: Specifically trained on Indian languages including Gujarati
- **Semantic Understanding**: Finds related content, not just exact matches
- **Pre-trained**: No need to train custom model
- **Efficient**: Can run on CPU (though GPU is faster)

---

### 4. `server/pdf/pdf_utils.py` - PDF Processing Module

**Purpose:** Handles PDF-specific operations like text extraction, highlighting, and rendering

**Key Features:**

#### PDFProcessor Class:
```python
class PDFProcessor:
    - process_pdf_sync(): Main PDF processing pipeline
    - extract_text_from_pdf(): Direct text extraction
    - highlight_text_in_pdf(): Creates highlighted PDF
    - highlight_text_in_image(): Highlights text in images
    - get_pdf_info(): Extracts metadata
```

#### How It Works:

1. **PDF Processing Pipeline**:
   ```
   Upload PDF → Detect Language → Check if Scanned
                                    
   ```

2. **Language Detection**:
   - Samples first 2 pages
   - Checks for Gujarati Unicode characters (0x0A80-0x0AFF)
   - Auto-configures OCR language

3. **Highlighting Process**:
   - **Method 1**: Native PDF text search (fastest)
   - **Method 2**: Word-level highlighting using text blocks
   - **Method 3**: OCR-based highlighting for image PDFs
   - Creates new PDF with yellow highlight annotations

4. **Image Support**:
   - Converts PDF pages to images
   - Processes images with OCR
   - Highlights text on images using bounding boxes

#### Why PyMuPDF?
- **Performance**: Faster than PyPDF2 for complex operations
- **Rendering**: Can convert PDF pages to images
- **Annotations**: Native support for highlights and annotations
- **OCR Integration**: Works well with Tesseract

---

### 5. `app.py` - Flask Alternative (Legacy)

**Purpose:** Alternative Flask-based server (simpler, for basic use cases)

**Note:** This is a simpler version using Flask instead of FastAPI. The main application uses FastAPI (`server/main.py`).

---

## Frontend Files Explanation

### 1. `client/src/App.jsx` - Main Application Component

**Purpose:** Root component that orchestrates the entire UI

**Structure:**
```jsx
<App>
  <Header />           - Title and description
  <Notifications />    - Success/error messages
  <Upload />          - File upload component
  <SearchBox />       - Search input and controls
  <PDFViewer />       - Document viewer with results
  <Footer />          - Footer information
</App>
```

**State Management:**
- `pdfData`: Currently loaded PDF information
- `searchResults`: Search results from backend
- `currentQuery`: Active search query
- `error`/`success`: User feedback messages

**Why This Structure?**
- **Component Separation**: Each section is independent
- **State Lifting**: Shared state at top level
- **Reusability**: Components can be used elsewhere

---

### 2. `client/src/api.js` - API Communication Layer

**Purpose:** Centralized HTTP client for backend communication

**Key Features:**

#### Axios Configuration:
- Base URL: `http://localhost:8000`
- Timeout: 5 minutes for uploads, 1 minute for searches
- Request/Response interceptors for logging
- Error handling with user-friendly messages

#### API Functions:
```javascript
uploadPDF(file)              - Upload PDF/image
searchPDF(query, filename)   - Text search
searchByImage(pdf, image)    - Image-based search
ocrImage(imageFile)          - Extract text from image
listPDFs()                   - Get uploaded files
downloadHighlightedPDF()    - Download highlighted PDF
```

#### Why Axios?
- **Promise-based**: Clean async/await syntax
- **Interceptors**: Centralized error handling
- **Progress Tracking**: Upload progress support
- **Request Cancellation**: Can cancel long-running requests

---

### 3. `client/src/components/Upload.jsx` - File Upload Component

**Purpose:** Handles file upload with drag-and-drop support

**Features:**
- **Drag & Drop**: Visual feedback when dragging files
- **File Validation**: Checks type, size, and validity
- **Progress Indicator**: Shows upload progress
- **Error Handling**: User-friendly error messages
- **Retry Logic**: Allows retrying failed uploads

**How It Works:**
1. User drags/drops or selects file
2. Validates file (type, size, name)
3. Shows progress bar
4. Uploads to `/upload-pdf` or `/upload-image`
5. Processes response and updates parent state

**Why This UX?**
- **Intuitive**: Drag-and-drop is familiar
- **Feedback**: Progress bars reduce anxiety
- **Error Recovery**: Retry option improves experience

---

### 4. `client/src/components/SearchBox.jsx` - Search Interface

**Purpose:** Search input with Gujarati keyboard and image search

**Features:**
- **Text Input**: Standard search box
- **Virtual Gujarati Keyboard**: On-screen keyboard for Gujarati input
- **Image Upload**: Upload image to extract search query
- **Search History**: Remembers recent searches
- **Real-time Feedback**: Shows extracted text from images

**How It Works:**
1. User enters text OR uploads image
2. If image: OCR extracts text first
3. Sends search request to backend
4. Displays results in PDFViewer
5. Saves to search history

**Why Virtual Keyboard?**
- **Accessibility**: Users without Gujarati keyboard can still search
- **Convenience**: No need to switch keyboard layouts
- **User-Friendly**: Visual representation of available characters

---

### 5. `client/src/components/PDFViewer.jsx` - Document Viewer

**Purpose:** Displays PDF content with search results and highlights

**Features:**
- **Page Navigation**: Previous/Next page buttons
- **Zoom Controls**: Adjust text size
- **Highlight Display**: Shows search matches highlighted
- **Match Navigation**: Navigate between matches (keyboard shortcuts)
- **Download**: Download highlighted PDF/image
- **Relevance Scores**: Shows how relevant each result is

**How It Works:**

1. **Text Highlighting**:
   ```javascript
   Text → Normalize Unicode → Find Matches → Wrap in <mark> tags
   ```

2. **Match Navigation**:
   - `←` / `→` or `P` / `N`: Navigate matches on current page
   - `Shift + ←` / `Shift + →`: Navigate across all pages
   - Auto-scrolls to current match

3. **Highlighting Methods**:
   - **Auto**: Uses exact match positions from backend
   - **Simple**: Regex-based highlighting
   - **Regex**: Advanced pattern matching

**Why Multiple Highlighting Methods?**
- **Flexibility**: Different methods work better for different queries
- **Fallback**: If one method fails, others can work
- **Performance**: Simple method is faster for exact matches

---

## How It Works - Complete Flow

### 1. Upload Flow

```
User uploads PDF
    ↓
Frontend validates file
    ↓
POST /upload-pdf with file
    ↓
Backend saves file to uploads/
    ↓
PDFProcessor.process_pdf():
    ├─ Detect language (Gujarati/English)
    ├─ Check if scanned
    ├─ Extract text (direct or OCR)
    └─ Return page data
    ↓
Frontend receives result
    ↓
Display PDF info and enable search
```

### 2. Search Flow

```
User enters search query
    ↓
POST /search with query + filename
    ↓
Backend:
    ├─ Extract text from PDF (cached)
    ├─ Try exact matching first
    │   └─ Find all occurrences
    ├─ If no exact matches:
    │   ├─ Get query embedding (IndicBERT)
    │   ├─ Get page embeddings (cached)
    │   ├─ Calculate cosine similarity
    │   └─ Rank by relevance
    └─ Return top 10 results
    ↓
Frontend receives results
    ↓
PDFViewer highlights matches
    ↓
User navigates through results
```

### 3. Image Search Flow

```
User uploads image query
    ↓
POST /upload-image
    ↓
Backend:
    ├─ OCR image (Gujarati + English)
    ├─ Extract text
    └─ Return extracted text
    ↓
Frontend receives text
    ↓
Use extracted text for search
    ↓
Continue with normal search flow
```

### 4. Highlight Download Flow

```
User clicks "Download Highlighted"
    ↓
POST /download-highlighted
    ↓
Backend:
    ├─ Load PDF
    ├─ Find all query matches
    ├─ Add highlight annotations
    ├─ Save new PDF
    └─ Return file
    ↓
Frontend downloads file
```

---

## Why These Technologies?

### Backend Choices

#### FastAPI vs Flask
- **FastAPI**: 
  - ✅ Automatic API documentation
  - ✅ Type validation with Pydantic
  - ✅ Native async support
  - ✅ Better performance
  - ✅ Modern Python features

#### PyMuPDF vs PyPDF2
- **PyMuPDF**: 
  - ✅ Better rendering capabilities
  - ✅ OCR integration
  - ✅ Highlight annotations
  - ✅ Faster for complex operations

#### Tesseract + EasyOCR
- **Tesseract**: 
  - ✅ Industry standard
  - ✅ Good Gujarati support
  - ✅ Multiple configuration options
  
- **EasyOCR**: 
  - ✅ Deep learning-based
  - ✅ Better for Indic languages
  - ✅ Fallback option

#### IndicBERT
- ✅ Pre-trained on Indian languages
- ✅ Semantic understanding
- ✅ No training required
- ✅ Good performance on CPU

### Frontend Choices

#### React
- ✅ Component reusability
- ✅ Large ecosystem
- ✅ Virtual DOM for performance
- ✅ Hooks for state management

#### Vite
- ✅ Fast development server
- ✅ Optimized production builds
- ✅ Hot Module Replacement
- ✅ Modern tooling

#### Tailwind CSS
- ✅ Rapid UI development
- ✅ Consistent design system
- ✅ Small bundle size (with purging)
- ✅ Responsive by default

#### Axios
- ✅ Promise-based
- ✅ Request/response interceptors
- ✅ Automatic JSON parsing
- ✅ Better error handling

---

## Key Design Decisions

### 1. Hybrid Search (Exact + Semantic)
**Why?** 
- Exact matching is faster and more accurate for exact phrases
- Semantic search finds related content
- Best of both worlds

### 2. Caching Strategy
**Why?**
- PDF text extraction is expensive
- Embeddings computation is slow
- Cache by file path + modification time ensures freshness

### 3. Multiple OCR Methods
**Why?**
- Different images need different preprocessing
- Multiple methods increase success rate
- Fallback ensures robustness

### 4. Unicode Normalization
**Why?**
- Gujarati text can have different Unicode representations
- Normalization ensures consistent matching
- Handles OCR artifacts (zero-width characters)

### 5. Lazy Model Loading
**Why?**
- IndicBERT is large (~400MB)
- Not all users may need semantic search
- Loads only when first search is performed

---

## Performance Optimizations

1. **Caching**: Text and embeddings cached per PDF
2. **Lazy Loading**: Model loads only when needed
3. **Async Operations**: FastAPI async endpoints
4. **Image Preprocessing**: Optimized for OCR speed
5. **Frontend**: React memoization, code splitting
6. **CDN**: Static assets can be served from CDN

---

## Security Considerations

1. **File Validation**: Type and size checks
2. **Path Sanitization**: Prevents directory traversal
3. **CORS**: Restricted to frontend origin
4. **Error Handling**: No sensitive info in errors
5. **File Cleanup**: Failed uploads are removed

---

## Future Enhancements

1. **User Authentication**: Multi-user support
2. **Database**: Store search history, user preferences
3. **Batch Processing**: Process multiple PDFs
4. **Advanced Search**: Boolean operators, filters
5. **Export Options**: Multiple formats (Word, HTML)
6. **Mobile App**: React Native version
7. **Cloud Storage**: Integration with S3, Google Drive

---

## Conclusion

This system combines:
- **Modern web technologies** for responsive UI
- **AI/ML models** for intelligent search
- **OCR technology** for scanned documents
- **Robust error handling** for reliability
- **Performance optimizations** for speed

The architecture is modular, allowing easy extension and maintenance. Each component has a clear purpose and can be improved independently.

---

**For Questions or Clarifications:**
- Check code comments in individual files
- Review API documentation at `http://localhost:8000/docs`
- Test scripts: `test_tesseract_gujarati.py`, `test_upload.py`

