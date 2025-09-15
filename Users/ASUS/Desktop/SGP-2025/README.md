# PDF Search Application

A modern web application for uploading, processing, and searching through PDF documents using AI-powered semantic search. Built with React (Vite), FastAPI, and IndicBERT.

## Features

- **PDF Upload**: Drag-and-drop interface for uploading PDF files
- **OCR Support**: Automatic text extraction from scanned PDFs using Tesseract
- **Semantic Search**: AI-powered search using IndicBERT model
- **Multi-language Support**: Support for English and Indian languages
- **Modern UI**: Responsive design with beautiful animations
- **Real-time Processing**: Live upload progress and search results

## Project Structure

```
project-root/
│
├── client/                      # React Frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload.jsx       # PDF upload component
│   │   │   ├── SearchBox.jsx    # Word input component
│   │   │   ├── PDFViewer.jsx    # View PDF page-wise
│   │   │   ├── Upload.css       # Upload component styles
│   │   │   ├── SearchBox.css    # Search component styles
│   │   │   └── PDFViewer.css    # Viewer component styles
│   │   ├── App.jsx              # Main app layout
│   │   ├── App.css              # Main app styles
│   │   ├── api.js               # Axios instance for backend
│   │   └── main.jsx             # React entry point
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite configuration
│
├── server/                      # FastAPI Backend
│   ├── models/
│   │   ├── __init__.py          # Models package
│   │   ├── model_utils.py       # IndicBERT model loading & inference
│   │   └── ocr_utils.py         # OCR for scanned PDFs
│   ├── pdf/
│   │   ├── __init__.py          # PDF package
│   │   └── pdf_utils.py         # PDF processing and highlighting
│   ├── uploads/                 # Temp uploaded PDFs
│   ├── main.py                  # FastAPI entry point
│   └── requirements.txt         # Backend dependencies
│
└── README.md                    # Project documentation
```

## Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **Tesseract OCR** (for scanned PDF support)

### Installing Tesseract OCR

#### Windows:
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to `C:\Program Files\Tesseract-OCR\`
3. Add to PATH environment variable

#### macOS:
```bash
brew install tesseract
```

#### Ubuntu/Debian:
```bash
sudo apt-get install tesseract-ocr
```

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd SGP-2025
```

### 2. Backend Setup
```bash
cd server
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd client
npm install
```

## Running the Application

### 1. Start the Backend Server
```bash
cd server
# Activate virtual environment if not already activated

.\venv\Scripts\Activate.ps1
pip install -r requirements_flask.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

```

The backend will be available at: http://localhost:8000

### 2. Start the Frontend Development Server
```bash
cd client
npm run dev
```

The frontend will be available at: http://localhost:3000

## API Endpoints

### Backend API (FastAPI)

- `GET /` - Health check
- `POST /upload-pdf` - Upload and process PDF file
- `POST /search` - Search for text in PDF
- `GET /pdfs` - List uploaded PDFs

### Frontend Routes

- `/` - Main application with upload, search, and viewer

## Usage

1. **Upload PDF**: Drag and drop a PDF file or click to browse
2. **Search**: Enter your search query in the search box
3. **View Results**: Browse through search results and view highlighted text
4. **Navigate**: Use page controls to navigate through the PDF

## Technologies Used

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **CSS3** - Styling with modern features

### Backend
- **FastAPI** - Web framework
- **PyPDF2** - PDF text extraction
- **PyMuPDF (fitz)** - PDF processing and OCR
- **Tesseract** - OCR for scanned documents
- **Transformers** - IndicBERT model
- **PyTorch** - Deep learning framework
- **scikit-learn** - Machine learning utilities

## Features in Detail

### PDF Processing
- **Text-based PDFs**: Direct text extraction using PyPDF2
- **Scanned PDFs**: OCR processing using Tesseract
- **Multi-language**: Support for English and Indian languages
- **Metadata extraction**: Title, author, page count, etc.

### AI-Powered Search
- **IndicBERT Model**: Pre-trained transformer for semantic understanding
- **Semantic Similarity**: Cosine similarity for relevance scoring
- **Fallback Support**: Graceful degradation when model unavailable
- **Multi-language**: Support for English and Indian language queries

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Drag & Drop**: Intuitive file upload interface
- **Real-time Feedback**: Progress indicators and notifications
- **Search History**: Recent searches for quick access
- **Page Navigation**: Easy browsing through PDF pages
- **Zoom Controls**: Adjustable text size for better readability

## Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000

# Model Configuration
MODEL_NAME=ai4bharat/indic-bert
DEVICE=cpu  # or cuda for GPU

# File Upload
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=uploads

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

### Tesseract Configuration

The OCR processor automatically detects Tesseract installation. For custom paths, modify `server/models/ocr_utils.py`:

```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Your\Custom\Path\tesseract.exe'
```

## Development

### Adding New Features

1. **Backend**: Add new endpoints in `server/main.py`
2. **Frontend**: Create new components in `client/src/components/`
3. **Styling**: Add CSS files alongside components

### Testing

```bash
# Backend tests
cd server
python -m pytest

# Frontend tests
cd client
npm test
```

## Deployment

### Backend Deployment

1. **Docker** (recommended):
```bash
cd server
docker build -t pdf-search-backend .
docker run -p 8000:8000 pdf-search-backend
```

2. **Direct deployment**:
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Deployment

1. **Build for production**:
```bash
cd client
npm run build
```

2. **Deploy to static hosting** (Netlify, Vercel, etc.)

## Troubleshooting

### Common Issues

1. **Tesseract not found**: Install Tesseract OCR and ensure it's in PATH
2. **Model loading fails**: Check internet connection for model download
3. **CORS errors**: Ensure backend CORS settings match frontend URL
4. **File upload fails**: Check file size limits and upload directory permissions

### Performance Optimization

1. **Large PDFs**: Consider chunking for very large documents
2. **Model caching**: The IndicBERT model is cached after first load
3. **OCR optimization**: Adjust image preprocessing for better accuracy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ using React, FastAPI, and AI** 