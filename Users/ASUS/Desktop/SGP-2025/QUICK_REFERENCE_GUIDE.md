# Quick Reference Guide - Gujarati Word Spotting System

## 🎯 What This System Does

A web application that allows users to:
1. **Upload** PDF documents or images containing Gujarati text
2. **Search** for specific words/phrases using text or images
3. **View** results with highlighted matches
4. **Download** highlighted versions of documents

---

## 📁 File Structure Overview

```
SGP-2025/
├── server/                    # Backend (Python/FastAPI)
│   ├── main.py               # Main API server
│   ├── models/
│   │   ├── ocr_utils.py      # OCR processing
│   │   └── model_utils.py    # AI model (IndicBERT)
│   └── pdf/
│       └── pdf_utils.py      # PDF operations
│
├── client/                    # Frontend (React)
│   └── src/
│       ├── App.jsx           # Main app component
│       ├── api.js             # API communication
│       └── components/
│           ├── Upload.jsx     # File upload
│           ├── SearchBox.jsx  # Search interface
│           └── PDFViewer.jsx  # Document viewer
│
└── uploads/                   # Uploaded files storage
```

---

## 🔧 Technologies Used

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Web framework (API server) |
| **PyMuPDF** | PDF processing & highlighting |
| **Tesseract OCR** | Text recognition from images |
| **EasyOCR** | Alternative OCR (better for Gujarati) |
| **IndicBERT** | AI model for semantic search |
| **PyTorch** | Deep learning framework |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **Axios** | HTTP client |

---

## 📄 Key Files Explained

### Backend Files

#### 1. `server/main.py`
**What it does:** Main API server
- Handles all HTTP requests
- Routes: `/upload-pdf`, `/search`, `/download-highlighted`
- Manages file uploads and processing

**Key Functions:**
- `upload_pdf()` - Receives and processes PDF files
- `search_pdf()` - Searches for text in documents
- `download_highlighted()` - Generates highlighted PDFs

---

#### 2. `server/models/ocr_utils.py`
**What it does:** Optical Character Recognition
- Extracts text from scanned PDFs/images
- Supports Gujarati + English
- Uses Tesseract + EasyOCR

**Key Functions:**
- `extract_text_with_advanced_ocr()` - Multi-method OCR
- `process_scanned_pdf()` - Processes entire PDF
- `preprocess_image()` - Enhances image quality

**Why Multiple Methods?**
- Different images need different preprocessing
- Increases success rate
- Fallback ensures robustness

---

#### 3. `server/models/model_utils.py`
**What it does:** AI-powered semantic search
- Uses IndicBERT model for understanding meaning
- Converts text to vectors (embeddings)
- Finds similar content using cosine similarity

**Key Functions:**
- `search_text_sync()` - Semantic search
- `search_with_exact_matching()` - Fast exact match
- `get_embeddings()` - Text to vector conversion

**How Semantic Search Works:**
```
Query → IndicBERT → Vector (768 numbers)
PDF Pages → IndicBERT → Vectors
Compare vectors → Similarity scores → Ranked results
```

---

#### 4. `server/pdf/pdf_utils.py`
**What it does:** PDF-specific operations
- Extracts text from PDFs
- Detects if PDF is scanned
- Creates highlighted PDFs

**Key Functions:**
- `process_pdf_sync()` - Main processing pipeline
- `highlight_text_in_pdf()` - Adds highlights
- `get_pdf_info()` - Extracts metadata

---

### Frontend Files

#### 1. `client/src/App.jsx`
**What it does:** Main application component
- Orchestrates entire UI
- Manages global state
- Handles user feedback

**Components:**
- Header (title, description)
- Upload section
- Search section
- PDF Viewer section
- Footer

---

#### 2. `client/src/api.js`
**What it does:** Backend communication
- Centralized HTTP client
- Error handling
- Request/response interceptors

**Functions:**
- `uploadPDF()` - Upload files
- `searchPDF()` - Search documents
- `downloadHighlightedPDF()` - Download results

---

#### 3. `client/src/components/Upload.jsx`
**What it does:** File upload interface
- Drag & drop support
- File validation
- Progress indicator
- Error handling with retry

**Features:**
- Visual feedback during upload
- File type/size validation
- Retry mechanism

---

#### 4. `client/src/components/SearchBox.jsx`
**What it does:** Search interface
- Text input
- Virtual Gujarati keyboard
- Image upload for query
- Search history

**Features:**
- On-screen Gujarati keyboard
- OCR from image queries
- Recent searches memory

---

#### 5. `client/src/components/PDFViewer.jsx`
**What it does:** Document viewer
- Displays PDF content
- Highlights search matches
- Page navigation
- Match navigation (keyboard shortcuts)

**Features:**
- Zoom controls
- Highlight toggle
- Match counter
- Download highlighted PDF

---

## 🔄 How It Works - Step by Step

### Upload Process
1. User drags/drops PDF → Frontend validates
2. Frontend sends to `/upload-pdf` → Backend saves file
3. Backend processes PDF:
   - Detects language (Gujarati/English)
   - Checks if scanned
   - Extracts text (direct or OCR)
4. Returns page data → Frontend displays

### Search Process
1. User enters query → Frontend sends to `/search`
2. Backend:
   - Extracts text from PDF (cached)
   - Tries exact matching first
   - If no matches, uses semantic search (IndicBERT)
3. Returns results → Frontend highlights matches

### Highlight Download
1. User clicks download → Frontend requests `/download-highlighted`
2. Backend:
   - Finds all matches
   - Adds highlight annotations
   - Creates new PDF
3. Returns file → Frontend downloads

---

## 🎨 Design Decisions

### 1. Hybrid Search
- **Exact Match First**: Fast, accurate for exact phrases
- **Semantic Search Fallback**: Finds related content
- **Result**: Best of both worlds

### 2. Multiple OCR Methods
- **3 Preprocessing Methods**: Different image enhancements
- **6+ OCR Configurations**: Various Tesseract settings
- **EasyOCR Fallback**: When Tesseract fails
- **Result**: High success rate

### 3. Caching Strategy
- **Text Caching**: Avoid re-extraction
- **Embedding Caching**: Avoid re-computation
- **Cache Key**: File path + modification time
- **Result**: Faster repeated searches

### 4. Unicode Normalization
- **NFC Normalization**: Consistent text representation
- **Zero-width Handling**: Removes OCR artifacts
- **Result**: Accurate matching

---

## 🚀 Performance Features

1. **Lazy Model Loading**: IndicBERT loads only when needed
2. **Caching**: Text and embeddings cached
3. **Async Operations**: FastAPI async endpoints
4. **Optimized OCR**: Image preprocessing for speed
5. **Frontend Optimization**: React memoization

---

## 🔒 Security Features

1. **File Validation**: Type and size checks
2. **Path Sanitization**: Prevents directory traversal
3. **CORS**: Restricted to frontend origin
4. **Error Handling**: No sensitive info exposed

---

## 📊 System Flow Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────┐      HTTP      ┌─────────────┐
│   React     │ ◄─────────────► │   FastAPI   │
│  Frontend   │   Requests      │   Backend   │
└─────────────┘                 └──────┬──────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
            │   PDF       │   │     OCR     │   │   IndicBERT │
            │ Processor   │   │  Processor  │   │    Model    │
            └─────────────┘   └─────────────┘   └─────────────┘
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                                       ▼
                              ┌─────────────┐
                              │   Results   │
                              └─────────────┘
```

---

## 💡 Key Features

✅ **Multi-language Support**: Gujarati + English
✅ **OCR for Scanned Docs**: Handles image-based PDFs
✅ **AI Semantic Search**: Finds related content
✅ **Exact Matching**: Fast, precise results
✅ **Highlighting**: Visual match indicators
✅ **Download Results**: Get highlighted PDFs
✅ **Virtual Keyboard**: Gujarati input support
✅ **Image Queries**: Search using images
✅ **Modern UI**: Responsive, beautiful interface

---

## 🛠️ Setup Instructions

### Backend
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd client
npm install
npm run dev
```

### Prerequisites
- Python 3.8+
- Node.js 16+
- Tesseract OCR installed

---

## 📝 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/upload-pdf` | Upload PDF file |
| POST | `/upload-image` | Upload image file |
| POST | `/search` | Search in PDF |
| POST | `/search-by-image` | Search using image |
| POST | `/download-highlighted` | Download highlighted PDF |
| GET | `/pdfs` | List uploaded PDFs |
| GET | `/health` | Health check |

---

## 🎓 For Faculty Presentation

### Key Points to Highlight:

1. **Problem Solved**: 
   - Searching Gujarati documents is challenging
   - OCR for Indic languages is complex
   - Semantic search improves results

2. **Technical Innovation**:
   - Hybrid search (exact + semantic)
   - Multiple OCR methods
   - Unicode-safe matching

3. **Technologies Used**:
   - Modern web stack (React + FastAPI)
   - AI/ML (IndicBERT)
   - OCR (Tesseract + EasyOCR)

4. **Performance**:
   - Caching strategy
   - Lazy loading
   - Async operations

5. **User Experience**:
   - Drag & drop upload
   - Virtual keyboard
   - Real-time highlighting
   - Download results

---

## 📚 Additional Resources

- **Full Documentation**: See `COMPREHENSIVE_EXPLANATION.md`
- **API Docs**: Visit `http://localhost:8000/docs` when server is running
- **Test Scripts**: `test_tesseract_gujarati.py`, `test_upload.py`

---

**Questions?** Check the comprehensive explanation document or review code comments in individual files.

