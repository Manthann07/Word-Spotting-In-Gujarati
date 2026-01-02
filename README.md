# 🔍 Gujarati Word Spotting System

<div align="center">

**An AI-powered web application for intelligent search and analysis of Gujarati PDF documents**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Configuration](#-configuration)
- [How It Works](#-how-it-works)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Performance Optimization](#-performance-optimization)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

**Gujarati Word Spotting System** is a modern, full-stack web application designed to revolutionize how users search and interact with Gujarati language documents. The system combines cutting-edge AI technology with robust OCR capabilities to provide intelligent semantic search across PDF documents and images.

### Key Highlights

- 🤖 **AI-Powered Semantic Search** using IndicBERT model for understanding context and meaning
- 📄 **Advanced OCR Processing** with multiple preprocessing methods for scanned documents
- 🔤 **Multi-language Support** optimized for Gujarati and English
- 🎨 **Modern UI/UX** with responsive design and intuitive interactions
- ⚡ **Hybrid Search Strategy** combining exact matching and semantic search
- 🖼️ **Image-based Queries** - search using images of text

---

## ✨ Features

### Core Functionality

- **📤 Smart File Upload**
  - Drag-and-drop interface for PDFs and images
  - Automatic file validation and processing
  - Real-time upload progress tracking
  - Support for multiple file formats (PDF, PNG, JPG)

- **🔍 Intelligent Search**
  - **Exact Text Matching**: Fast, precise search for exact phrases
  - **Semantic Search**: AI-powered search that finds related content
  - **Hybrid Approach**: Automatically uses best method for optimal results
  - **Image Query Search**: Upload an image of text to search within documents

- **👁️ OCR Capabilities**
  - Automatic text extraction from scanned PDFs
  - Multiple preprocessing methods for better accuracy
  - Support for Gujarati and English languages
  - Handles low-quality scans with advanced image processing

- **📊 Results Visualization**
  - Highlighted matches in documents
  - Page-by-page navigation
  - Relevance scores for semantic search results
  - Match count and statistics
  - Download highlighted PDFs/images

- **🎨 User Interface**
  - Modern, responsive design
  - Virtual Gujarati keyboard for easy input
  - Real-time feedback and notifications
  - Search history tracking
  - Keyboard shortcuts for navigation
  - Zoom controls for better readability

---

## 🛠️ Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.104.1 | Modern, fast web framework with async support |
| **PyMuPDF (fitz)** | 1.26.3 | Advanced PDF processing and highlighting |
| **PyPDF2** | 3.0.1 | Text extraction from text-based PDFs |
| **Tesseract OCR** | Latest | Industry-standard OCR engine |
| **EasyOCR** | 1.7.0 | Deep learning-based OCR (fallback) |
| **Transformers** | 4.35.2 | IndicBERT model integration |
| **PyTorch** | 2.1.1 | Deep learning framework |
| **scikit-learn** | 1.3.2 | Cosine similarity for semantic search |
| **Pillow (PIL)** | 10.1.0 | Image preprocessing and manipulation |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.0 | Modern UI framework |
| **Vite** | 5.4.0 | Fast build tool and dev server |
| **Tailwind CSS** | 4.1.11 | Utility-first CSS framework |
| **Axios** | 1.10.0 | Promise-based HTTP client |

---

## 📁 Project Structure

```
SGP-2025/
│
├── client/                          # React Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload.jsx          # File upload component
│   │   │   ├── SearchBox.jsx       # Search interface with virtual keyboard
│   │   │   └── PDFViewer.jsx       # Document viewer with highlights
│   │   ├── App.jsx                 # Main application component
│   │   ├── App.css                 # Main app styles
│   │   ├── api.js                  # API client configuration
│   │   └── main.jsx                # React entry point
│   ├── package.json                # Frontend dependencies
│   └── vite.config.js              # Vite configuration
│
├── server/                          # FastAPI Backend
│   ├── models/
│   │   ├── __init__.py
│   │   ├── model_utils.py          # IndicBERT model & search logic
│   │   └── ocr_utils.py            # OCR processing with multiple methods
│   ├── pdf/
│   │   ├── __init__.py
│   │   └── pdf_utils.py            # PDF processing and highlighting
│   ├── uploads/                    # Uploaded files storage
│   ├── main.py                     # FastAPI application entry point
│   └── requirements.txt            # Python dependencies
│
├── templates/                       # HTML templates (if needed)
├── test_tesseract_gujarati.py      # OCR testing script
├── test_upload.py                  # Upload testing script
├── README.md                       # This file
├── COMPREHENSIVE_EXPLANATION.md    # Detailed technical documentation
├── QUICK_REFERENCE_GUIDE.md       # Quick reference guide
└── UI_DESIGN_GUIDE.md             # UI design documentation
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16+** - [Download Node.js](https://nodejs.org/)
- **Tesseract OCR** - Required for OCR functionality

### Installing Tesseract OCR

#### Windows
1. Download the installer from: [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
2. Install to `C:\Program Files\Tesseract-OCR\`
3. Add to PATH environment variable:
   - Add `C:\Program Files\Tesseract-OCR` to your system PATH
   - Or set in code: `pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'`

#### macOS
```bash
brew install tesseract
brew install tesseract-lang  # For additional language support
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-guj  # Gujarati language pack
```

#### Verify Installation
```bash
tesseract --version
```

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SGP-2025
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to client directory (from project root)
cd client

# Install dependencies
npm install
```

---

## ▶️ Running the Application

### Start the Backend Server

```bash
cd server

# Activate virtual environment (if not already activated)
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Run the FastAPI server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at:
- **API**: http://localhost:8000
- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

### Start the Frontend Development Server

Open a new terminal window:

```bash
cd client
npm run dev
```

The frontend will be available at: **http://localhost:5173**

> **Note**: The frontend runs on port 5173 (Vite default), not 3000. Make sure your backend CORS settings allow this origin.

---

## 📖 Usage Guide

### Basic Workflow

1. **Upload a Document**
   - Drag and drop a PDF file or image into the upload area
   - Or click to browse and select a file
   - Wait for processing to complete (progress bar will show status)

2. **Search for Text**
   - Enter your search query in the search box
   - Use the virtual Gujarati keyboard if needed
   - Or upload an image containing the text you want to search for
   - Click "Search" or press Enter

3. **View Results**
   - Search results will appear with highlighted matches
   - Navigate between pages using Previous/Next buttons
   - Use keyboard shortcuts:
     - `←` / `→` or `P` / `N`: Navigate matches on current page
     - `Shift + ←` / `Shift + →`: Navigate across all pages

4. **Download Highlighted Document**
   - Click "Download Highlighted PDF" button
   - A new PDF with all matches highlighted will be downloaded

### Advanced Features

- **Image-based Search**: Upload an image of text, and the system will extract the text using OCR and search for it
- **Search History**: Recent searches are saved for quick access
- **Zoom Controls**: Adjust text size for better readability
- **Match Navigation**: Jump between search results quickly

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Endpoints

#### Health Check
```http
GET /
GET /health
```
Returns API status and health information.

#### Upload PDF
```http
POST /upload-pdf
Content-Type: multipart/form-data

Body: file (PDF file)
```
Uploads and processes a PDF file. Returns page data and extracted text.

**Response:**
```json
{
  "success": true,
  "filename": "document.pdf",
  "total_pages": 10,
  "pages": [...],
  "processing_time": 2.5
}
```

#### Upload Image
```http
POST /upload-image
Content-Type: multipart/form-data

Body: file (PNG/JPG image)
```
Uploads and processes an image file with OCR.

#### Search
```http
POST /search
Content-Type: application/json

Body: {
  "query": "search text",
  "pdf_filename": "document.pdf"
}
```
Searches for text in a PDF. Returns ranked results with relevance scores.

**Response:**
```json
{
  "results": [
    {
      "page": 1,
      "text": "context around match...",
      "score": 0.95,
      "exact_matches": [...]
    }
  ],
  "query": "search text",
  "search_type": "exact_match"
}
```

#### Search by Image
```http
POST /search-by-image
Content-Type: multipart/form-data

Body: pdf_filename, image (file)
```
Searches in a PDF using an image query. OCRs the image first, then searches.

#### Download Highlighted PDF
```http
POST /download-highlighted
Content-Type: application/json

Body: {
  "query": "search text",
  "pdf_filename": "document.pdf"
}
```
Generates and returns a PDF with all matches highlighted.

#### List PDFs
```http
GET /pdfs
```
Returns list of all uploaded PDF files.

### Interactive API Documentation

Visit http://localhost:8000/docs for Swagger UI with interactive API testing.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000

# Model Configuration
MODEL_NAME=ai4bharat/indic-bert
DEVICE=cpu  # or cuda for GPU acceleration

# File Upload
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=uploads

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### Tesseract Configuration

The OCR processor automatically detects Tesseract installation. For custom paths, modify `server/models/ocr_utils.py`:

```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Your\Custom\Path\tesseract.exe'
```

### Frontend Configuration

Update API base URL in `client/src/api.js` if needed:

```javascript
const API_BASE_URL = 'http://localhost:8000';
```

---

## 🔄 How It Works

### System Architecture

```
┌─────────────────┐
│  React Frontend │  (Port 5173)
│   (Vite)        │
└────────┬────────┘
         │ HTTP/REST API
         ▼
┌─────────────────┐
│  FastAPI Server │  (Port 8000)
│   (Python)      │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬─────────────┐
    ▼         ▼          ▼             ▼
┌────────┐ ┌──────┐ ┌──────────┐ ┌──────────┐
│  PDF   │ │ OCR  │ │ IndicBERT│ │  File    │
│Processor│ │Engine│ │   Model  │ │ Storage  │
└────────┘ └──────┘ └──────────┘ └──────────┘
```

### Search Flow

1. **Upload Process**
   - User uploads PDF/image
   - Backend saves file and detects language
   - Text extraction (direct or OCR)
   - Text cached for future searches

2. **Search Process**
   - User enters query
   - Backend tries exact matching first (fast, precise)
   - If no exact matches, uses semantic search:
     - Query → IndicBERT → Embedding vector
     - PDF pages → Embeddings
     - Cosine similarity → Ranked results
   - Returns top results with context

3. **Highlighting Process**
   - Finds all match positions in PDF
   - Adds highlight annotations
   - Generates new PDF with highlights
   - Returns for download

### OCR Processing

The system uses multiple OCR methods for robustness:

1. **Multiple Preprocessing**:
   - Standard contrast enhancement
   - High contrast preprocessing
   - Inverted image processing

2. **Multiple OCR Configurations**:
   - Different Tesseract engines (LSTM vs Neural)
   - Various page segmentation modes
   - Gujarati-only and Gujarati+English modes

3. **Result Selection**:
   - Scores results based on text length
   - Considers Gujarati character count
   - Selects best quality result

---

## 💻 Development

### Adding New Features

#### Backend
1. Add new endpoints in `server/main.py`
2. Create utility functions in appropriate modules
3. Update API documentation

#### Frontend
1. Create new components in `client/src/components/`
2. Add API calls in `client/src/api.js`
3. Update routing in `client/src/App.jsx`

### Code Structure

- **Backend**: Follow FastAPI best practices, use type hints, add docstrings
- **Frontend**: Use React hooks, component-based architecture, Tailwind CSS

### Testing

```bash
# Backend tests (when implemented)
cd server
python -m pytest

# Frontend tests (when implemented)
cd client
npm test
```

### Code Quality

```bash
# Backend linting
cd server
flake8 .  # or your preferred linter

# Frontend linting
cd client
npm run lint
```

---

## 🚢 Deployment

### Backend Deployment

#### Option 1: Docker (Recommended)

```bash
cd server
docker build -t gujarati-word-spotting-backend .
docker run -p 8000:8000 gujarati-word-spotting-backend
```

#### Option 2: Direct Deployment

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Option 3: Production Server (Gunicorn)

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment

#### Build for Production

```bash
cd client
npm run build
```

The `dist/` folder contains production-ready files.

#### Deploy to Static Hosting

- **Netlify**: Connect GitHub repo, set build command: `npm run build`
- **Vercel**: Connect GitHub repo, automatic detection
- **GitHub Pages**: Use GitHub Actions for automated deployment

### Environment Setup

For production, ensure:
- Environment variables are set correctly
- CORS is configured for production domain
- File upload limits are appropriate
- Tesseract OCR is installed on server
- Sufficient disk space for uploads

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Tesseract Not Found
**Error**: `TesseractNotFoundError`

**Solution**:
- Verify Tesseract is installed: `tesseract --version`
- Check PATH environment variable
- For Windows, set custom path in `ocr_utils.py`

#### 2. Model Loading Fails
**Error**: `ConnectionError` or `ModelNotFoundError`

**Solution**:
- Check internet connection (model downloads from HuggingFace)
- Verify transformers library version
- Check available disk space (model is ~400MB)

#### 3. CORS Errors
**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
- Verify frontend URL in backend CORS settings
- Check `main.py` CORS middleware configuration
- Ensure frontend is running on correct port (5173)

#### 4. File Upload Fails
**Error**: `413 Request Entity Too Large` or upload timeout

**Solution**:
- Check file size limits in FastAPI configuration
- Verify upload directory permissions
- Increase timeout in frontend API client

#### 5. OCR Returns Empty Text
**Solution**:
- Verify image quality (try higher resolution)
- Check if Tesseract language packs are installed
- Try different preprocessing methods
- Verify image format is supported

#### 6. Search Returns No Results
**Solution**:
- Check if PDF was processed correctly
- Verify search query is in correct language
- Try exact match first, then semantic search
- Check Unicode normalization

### Debug Mode

Enable debug logging:

```python
# In server/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## ⚡ Performance Optimization

### Backend Optimizations

1. **Caching Strategy**
   - Text extraction results are cached per PDF
   - Embeddings are cached to avoid recomputation
   - Cache key includes file path and modification time

2. **Lazy Model Loading**
   - IndicBERT model loads only on first search
   - Reduces startup time and memory usage

3. **Async Operations**
   - FastAPI async endpoints for I/O operations
   - Non-blocking file processing

4. **OCR Optimization**
   - Multiple preprocessing methods run in parallel
   - Best result selected automatically

### Frontend Optimizations

1. **React Optimizations**
   - Component memoization where appropriate
   - Code splitting for better load times

2. **API Optimization**
   - Request timeouts configured
   - Error handling and retry logic

### For Large PDFs

- Consider chunking very large documents
- Implement pagination for search results
- Use background processing for heavy operations

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/SGP-2025.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow code style guidelines
   - Add comments and documentation
   - Write tests if applicable

4. **Commit Your Changes**
   ```bash
   git commit -m "Add: description of your feature"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Add screenshots if UI changes

### Contribution Guidelines

- Write clear, readable code
- Add docstrings to functions
- Update documentation as needed
- Test your changes thoroughly
- Follow existing code style

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

### Getting Help

1. **Check Documentation**
   - Read `COMPREHENSIVE_EXPLANATION.md` for detailed technical docs
   - Review `QUICK_REFERENCE_GUIDE.md` for quick tips
   - Check `UI_DESIGN_GUIDE.md` for UI-related questions

2. **Search Issues**
   - Check existing GitHub issues
   - Search for similar problems

3. **Create an Issue**
   - Provide detailed error messages
   - Include steps to reproduce
   - Add system information (OS, Python/Node versions)

### Resources

- **API Documentation**: http://localhost:8000/docs (when server is running)
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **IndicBERT Model**: https://huggingface.co/ai4bharat/indic-bert

---

## 🎓 Project Information

### Academic Context

This project is developed as part of **Semester 5 - Word Spotting in Gujarati** coursework, demonstrating:

- Full-stack web development
- AI/ML integration in web applications
- OCR technology for Indic languages
- Modern software engineering practices

### Key Achievements

- ✅ Hybrid search combining exact and semantic matching
- ✅ Robust OCR with multiple preprocessing methods
- ✅ Unicode-safe text processing for Gujarati
- ✅ Modern, responsive user interface
- ✅ Production-ready architecture

---

<div align="center">

**Made with ❤️ for Gujarati language processing**

[Report Bug](https://github.com/your-repo/issues) • [Request Feature](https://github.com/your-repo/issues) • [Documentation](COMPREHENSIVE_EXPLANATION.md)

</div>
