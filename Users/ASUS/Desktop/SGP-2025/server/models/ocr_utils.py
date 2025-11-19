import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import os
from typing import List, Dict, Any
import numpy as np
import io

# Import EasyOCR for better Indic language support
# Note: Catch any exception (not just ImportError) to avoid crashing on
# mismatched torch/torchvision/safetensors installations during import.
try:
    import easyocr
    EASYOCR_AVAILABLE = True
    print("✅ EasyOCR available for enhanced OCR")
except Exception:
    EASYOCR_AVAILABLE = False
    print("⚠️  EasyOCR not available, using Tesseract only")

class OCRProcessor:
    def __init__(self):
        """Initialize OCR processor for scanned PDFs"""
        # Configure Tesseract path for Windows
        if os.name == 'nt':  # Windows
            tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
            tessdata_path = r'C:\Program Files\Tesseract-OCR\tessdata'
            
            # Check if Tesseract is installed
            if os.path.exists(tesseract_path):
                os.environ['TESSDATA_PREFIX'] = tessdata_path
                pytesseract.pytesseract.tesseract_cmd = tesseract_path
                print(f"✅ Tesseract configured: {tesseract_path}")
                
                # Test if Tesseract is working
                try:
                    version = pytesseract.get_tesseract_version()
                    print(f"✅ Tesseract version: {version}")
                    
                    # Check available languages
                    languages = pytesseract.get_languages()
                    print(f"✅ Available languages: {languages}")
                    
                    # Check for Gujarati support
                    if 'guj' in languages:
                        print("✅ Gujarati language support available!")
                    else:
                        print("⚠️  Gujarati language support not found")
                        print("   Available languages:", languages)
                        
                except Exception as e:
                    print(f"⚠️  Tesseract test failed: {e}")
                    print("   OCR functionality may not work properly")
            else:
                print(f"❌ Tesseract not found at {tesseract_path}")
                print("   OCR functionality will not work")
                print("   Please install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki")
        
        # Initialize EasyOCR if available
        self.easyocr_reader = None
        if EASYOCR_AVAILABLE:
            try:
                print("🔄 Initializing EasyOCR for Gujarati...")
                self.easyocr_reader = easyocr.Reader(['gu', 'en'], gpu=False)
                print("✅ EasyOCR initialized successfully!")
            except Exception as e:
                print(f"❌ EasyOCR initialization failed: {e}")
                self.easyocr_reader = None
        
        self.supported_languages = ['eng', 'hin', 'tam', 'tel', 'kan', 'mal', 'ben', 'guj', 'mar', 'ori', 'pan']
    
    def pdf_to_images(self, pdf_path: str) -> List[Image.Image]:
        """Convert PDF pages to PIL Images"""
        images = []
        try:
            doc = fitz.open(pdf_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                images.append(img)
            doc.close()
        except Exception as e:
            print(f"Error converting PDF to images: {e}")
        return images
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image for better OCR results"""
        try:
            # Convert to grayscale
            if image.mode != 'L':
                image = image.convert('L')
            
            # Enhance contrast for better text recognition
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(3.0)  # Increased contrast for better text separation
            
            # Enhance sharpness
            sharpness_enhancer = ImageEnhance.Sharpness(image)
            image = sharpness_enhancer.enhance(2.0)  # Increased sharpness
            
            # Enhance brightness
            brightness_enhancer = ImageEnhance.Brightness(image)
            image = brightness_enhancer.enhance(1.2)  # Slightly brighter
            
            # Resize if too small (better for OCR)
            if image.size[0] < 1500 or image.size[1] < 1200:
                scale_factor = max(1500 / image.size[0], 1200 / image.size[1])
                new_width = int(image.size[0] * scale_factor)
                new_height = int(image.size[1] * scale_factor)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            return image
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return image
    
    def advanced_preprocess_for_gujarati(self, image: Image.Image) -> List[Image.Image]:
        """Advanced preprocessing specifically for Gujarati OCR"""
        processed_images = []
        
        try:
            # Convert to grayscale
            if image.mode != 'L':
                image = image.convert('L')
            
            # Method 1: Standard preprocessing
            img1 = image.copy()
            from PIL import ImageEnhance, ImageFilter
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img1)
            img1 = enhancer.enhance(3.5)
            
            # Enhance sharpness
            sharpness_enhancer = ImageEnhance.Sharpness(img1)
            img1 = sharpness_enhancer.enhance(2.5)
            
            # Apply slight blur to reduce noise
            img1 = img1.filter(ImageFilter.GaussianBlur(radius=0.5))
            
            # Resize for better OCR
            if img1.size[0] < 2000 or img1.size[1] < 1500:
                scale_factor = max(2000 / img1.size[0], 1500 / img1.size[1])
                new_width = int(img1.size[0] * scale_factor)
                new_height = int(img1.size[1] * scale_factor)
                img1 = img1.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            processed_images.append(img1)
            
            # Method 2: High contrast preprocessing
            img2 = image.copy()
            
            # Apply very high contrast
            enhancer = ImageEnhance.Contrast(img2)
            img2 = enhancer.enhance(4.0)
            
            # Enhance brightness
            brightness_enhancer = ImageEnhance.Brightness(img2)
            img2 = brightness_enhancer.enhance(1.3)
            
            # Apply edge enhancement
            img2 = img2.filter(ImageFilter.EDGE_ENHANCE_MORE)
            
            # Resize
            if img2.size[0] < 2000 or img2.size[1] < 1500:
                scale_factor = max(2000 / img2.size[0], 1500 / img2.size[1])
                new_width = int(img2.size[0] * scale_factor)
                new_height = int(img2.size[1] * scale_factor)
                img2 = img2.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            processed_images.append(img2)
            
            # Method 3: Inverted preprocessing (for dark text on light background)
            img3 = image.copy()
            
            # Invert the image
            img3 = Image.eval(img3, lambda x: 255 - x)
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img3)
            img3 = enhancer.enhance(3.0)
            
            # Resize
            if img3.size[0] < 2000 or img3.size[1] < 1500:
                scale_factor = max(2000 / img3.size[0], 1500 / img3.size[1])
                new_width = int(img3.size[0] * scale_factor)
                new_height = int(img3.size[1] * scale_factor)
                img3 = img3.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            processed_images.append(img3)
            
        except Exception as e:
            print(f"Error in advanced preprocessing: {e}")
            processed_images.append(image)
        
        return processed_images

    def extract_text_with_advanced_ocr(self, image: Image.Image, languages: List[str] = None) -> str:
        """Advanced OCR extraction with multiple preprocessing methods and EasyOCR fallback"""
        if languages is None:
            languages = ['eng']
        
        try:
            # Get multiple preprocessed versions
            processed_images = self.advanced_preprocess_for_gujarati(image)
            
            all_results = []
            
            for i, processed_image in enumerate(processed_images):
                print(f"Trying preprocessing method {i+1}...")
                
                # Try different OCR configurations for each preprocessed image
                configs = [
                    ('--oem 1 --psm 6 -l guj+eng --dpi 300', f'LSTM Gujarati+English (Method {i+1})'),
                    ('--oem 3 --psm 6 -l guj+eng --dpi 300', f'Neural Gujarati+English (Method {i+1})'),
                    ('--oem 1 --psm 3 -l guj+eng --dpi 300', f'LSTM PSM3 Gujarati+English (Method {i+1})'),
                    ('--oem 3 --psm 3 -l guj+eng --dpi 300', f'Neural PSM3 Gujarati+English (Method {i+1})'),
                    ('--oem 1 --psm 6 -l guj --dpi 300', f'LSTM Gujarati Only (Method {i+1})'),
                    ('--oem 3 --psm 6 -l guj --dpi 300', f'Neural Gujarati Only (Method {i+1})'),
                ]
                
                for config, description in configs:
                    try:
                        text = pytesseract.image_to_string(processed_image, config=config)
                        if text.strip():
                            cleaned_text = self.clean_ocr_text(text.strip())
                            if cleaned_text and len(cleaned_text) > 10:  # Only keep substantial results
                                all_results.append((cleaned_text, description))
                                print(f"✅ {description}: {len(cleaned_text)} characters")
                    except Exception as e:
                        print(f"❌ {description} failed: {e}")
            
            # If no good results, try EasyOCR as fallback
            if not all_results and 'guj' in languages:
                print("🔄 No good Tesseract results, trying EasyOCR...")
                for i, processed_image in enumerate(processed_images):
                    try:
                        easyocr_text = self.extract_text_with_easyocr(processed_image)
                        if easyocr_text and len(easyocr_text) > 10:
                            all_results.append((easyocr_text, f'EasyOCR (Method {i+1})'))
                            print(f"✅ EasyOCR (Method {i+1}): {len(easyocr_text)} characters")
                    except Exception as e:
                        print(f"❌ EasyOCR (Method {i+1}) failed: {e}")
            
            # If still no good results, try with English only
            if not all_results:
                print("🔄 No good Gujarati results, trying English...")
                for processed_image in processed_images:
                    try:
                        text = pytesseract.image_to_string(processed_image, config='--oem 3 --psm 6 -l eng --dpi 300')
                        if text.strip():
                            cleaned_text = self.clean_ocr_text(text.strip())
                            if cleaned_text and len(cleaned_text) > 10:
                                all_results.append((cleaned_text, "English Fallback"))
                    except Exception as e:
                        print(f"English OCR failed: {e}")
            
            # Return the best result (longest text with most Gujarati characters)
            if all_results:
                # Score each result based on length and Gujarati character count
                scored_results = []
                for text, description in all_results:
                    gujarati_chars = sum(1 for char in text if '\u0A80' <= char <= '\u0AFF')
                    score = len(text) + (gujarati_chars * 3)  # Weight Gujarati characters more heavily
                    scored_results.append((text, score, description))
                
                # Sort by score and return the best
                scored_results.sort(key=lambda x: x[1], reverse=True)
                best_text, score, description = scored_results[0]
                print(f"🏆 Best result: {description} (score: {score})")
                return best_text
            
            return ""
        
        except Exception as e:
            print(f"Error in advanced OCR: {e}")
            return ""

    def clean_ocr_text(self, text: str) -> str:
        """Enhanced text cleaning for Gujarati OCR results"""
        if not text:
            return text
        
        # Remove common OCR artifacts
        cleaned_text = text
        
        # Remove excessive whitespace
        cleaned_text = ' '.join(cleaned_text.split())
        
        # Fix common OCR mistakes for Gujarati
        replacements = {
            '|': '।',  # Fix vertical bar to Gujarati danda
            '॥': '॥',  # Fix double danda
            '0': '૦',  # Fix English 0 to Gujarati 0
            '1': '૧',  # Fix English 1 to Gujarati 1
            '2': '૨',  # Fix English 2 to Gujarati 2
            '3': '૩',  # Fix English 3 to Gujarati 3
            '4': '૪',  # Fix English 4 to Gujarati 4
            '5': '૫',  # Fix English 5 to Gujarati 5
            '6': '૬',  # Fix English 6 to Gujarati 6
            '7': '૭',  # Fix English 7 to Gujarati 7
            '8': '૮',  # Fix English 8 to Gujarati 8
            '9': '૯',  # Fix English 9 to Gujarati 9
            '¥': 'ય',  # Fix common OCR mistake
            '¢': 'ચ',  # Fix common OCR mistake
            '£': 'ળ',  # Fix common OCR mistake
            '§': 'સ',  # Fix common OCR mistake
            '©': 'ગ',  # Fix common OCR mistake
            '®': 'ર',  # Fix common OCR mistake
            '°': 'દ',  # Fix common OCR mistake
            '±': 'પ',  # Fix common OCR mistake
            '²': 'બ',  # Fix common OCR mistake
            '³': 'ભ',  # Fix common OCR mistake
            '´': 'મ',  # Fix common OCR mistake
            'µ': 'ન',  # Fix common OCR mistake
            '¶': 'વ',  # Fix common OCR mistake
            '·': 'શ',  # Fix common OCR mistake
            '¸': 'ષ',  # Fix common OCR mistake
            '¹': 'હ',  # Fix common OCR mistake
            'º': 'જ',  # Fix common OCR mistake
            '»': 'ઝ',  # Fix common OCR mistake
            '¼': 'ઞ',  # Fix common OCR mistake
            '½': 'ટ',  # Fix common OCR mistake
            '¾': 'ઠ',  # Fix common OCR mistake
            '¿': 'ડ',  # Fix common OCR mistake
        }
        
        # Apply replacements
        for old, new in replacements.items():
            cleaned_text = cleaned_text.replace(old, new)
        
        # Remove lines with only numbers or special characters
        lines = cleaned_text.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if line:
                # Keep lines that have actual text content
                if any(char.isalpha() for char in line) or len(line) > 2:
                    cleaned_lines.append(line)
        
        cleaned_text = '\n'.join(cleaned_lines)
        
        return cleaned_text

    def extract_text_with_ocr(self, image: Image.Image, languages: List[str] = None) -> str:
        """Extract text from image using advanced OCR"""
        if languages is None:
            languages = ['eng']
        
        # Use the advanced OCR method for better results
        return self.extract_text_with_advanced_ocr(image, languages)
    
    def process_scanned_pdf(self, pdf_path: str, languages: List[str] = None) -> List[Dict[str, Any]]:
        """Process a scanned PDF and extract text using OCR"""
        if languages is None:
            languages = ['eng']
        
        results = []
        try:
            # Convert PDF to images
            images = self.pdf_to_images(pdf_path)
            
            for page_num, image in enumerate(images):
                print(f"Processing page {page_num + 1}...")
                
                # Try multiple language combinations for better results
                text = ""
                
                # First try with Gujarati + English
                if 'guj' in languages:
                    text = self.extract_text_with_ocr(image, ['guj', 'eng'])
                
                # If no text found, try with all specified languages
                if not text.strip():
                    text = self.extract_text_with_ocr(image, languages)
                
                # If still no text, try with English only
                if not text.strip():
                    text = self.extract_text_with_ocr(image, ['eng'])
                
                if text.strip():  # Only add pages with extracted text
                    results.append({
                        'page': page_num + 1,
                        'text': text,
                        'confidence': 0.8  # Placeholder confidence score
                    })
                    print(f"Page {page_num + 1}: Extracted {len(text)} characters")
                else:
                    print(f"Page {page_num + 1}: No text extracted")
        
        except Exception as e:
            print(f"Error processing scanned PDF: {e}")
        
        return results
    
    def detect_language(self, text: str) -> str:
        """Detect the language of the text (simple implementation)"""
        # This is a simple implementation - could be enhanced with proper language detection
        # For now, return English as default
        return 'eng'
    
    def is_scanned_pdf(self, pdf_path: str) -> bool:
        """Check if PDF is scanned (contains images rather than text)"""
        try:
            doc = fitz.open(pdf_path)
            scanned = True
            
            for page_num in range(min(3, len(doc))):  # Check first 3 pages
                page = doc.load_page(page_num)
                text = page.get_text()
                if len(text.strip()) > 50:  # If significant text found
                    scanned = False
                    break
            
            doc.close()
            return scanned
        
        except Exception as e:
            print(f"Error checking if PDF is scanned: {e}")
            return False
    
    def detect_gujarati_text(self, text: str) -> bool:
        """Detect if text contains Gujarati characters"""
        if not text:
            return False
        
        # Gujarati Unicode range: 0x0A80-0x0AFF
        gujarati_chars = 0
        total_chars = 0
        
        for char in text:
            if '\u0A80' <= char <= '\u0AFF':
                gujarati_chars += 1
            if char.isalpha():
                total_chars += 1
        
        # If more than 10% of alphabetic characters are Gujarati, consider it Gujarati text
        if total_chars > 0 and (gujarati_chars / total_chars) > 0.1:
            return True
        
        return False
    
    def auto_detect_language(self, pdf_path: str) -> List[str]:
        """Automatically detect the language of the PDF content"""
        try:
            # First try to extract text directly from PDF
            import PyPDF2
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                sample_text = ""
                for page in pdf_reader.pages[:2]:  # Check first 2 pages
                    text = page.extract_text()
                    if text:
                        sample_text += text[:1000]  # First 1000 chars
            
            # If we found text, check if it's Gujarati
            if sample_text and self.detect_gujarati_text(sample_text):
                print("Detected Gujarati text in PDF")
                return ['guj', 'eng']
            
            # If no text or not Gujarati, try OCR on a sample page
            images = self.pdf_to_images(pdf_path)
            if images:
                # Try OCR on first page with English first
                sample_text = self.extract_text_with_ocr(images[0], ['eng'])
                if sample_text and self.detect_gujarati_text(sample_text):
                    print("Detected Gujarati text via OCR")
                    return ['guj', 'eng']
            
            # Default to English
            return ['eng']
            
        except Exception as e:
            print(f"Error in language detection: {e}")
            return ['eng']

    def extract_text_with_easyocr(self, image: Image.Image) -> str:
        """Extract text using EasyOCR (often better for Indic languages)"""
        if not self.easyocr_reader:
            return ""
        
        try:
            # Convert PIL image to numpy array
            img_array = np.array(image)
            
            # Perform OCR
            results = self.easyocr_reader.readtext(img_array)
            
            # Extract text from results
            texts = []
            for (bbox, text, confidence) in results:
                if confidence > 0.3:  # Filter low confidence results
                    texts.append(text)
            
            # Join all text
            full_text = ' '.join(texts)
            
            if full_text.strip():
                print(f"✅ EasyOCR extracted {len(full_text)} characters")
                return full_text.strip()
            
            return ""
            
        except Exception as e:
            print(f"❌ EasyOCR failed: {e}")
            return ""

    def normalize_gujarati_text(self, text: str) -> str:
        """Normalize Gujarati text for better search and matching"""
        if not text:
            return text
        
        # Normalize Unicode characters
        import unicodedata
        normalized_text = unicodedata.normalize('NFC', text)
        
        # Remove common OCR artifacts and normalize spacing
        normalized_text = ' '.join(normalized_text.split())
        
        # Fix common Gujarati OCR mistakes
        replacements = {
            '|': '।',  # Fix vertical bar to Gujarati danda
            '॥': '॥',  # Fix double danda
            '0': '૦',  # Fix English 0 to Gujarati 0
            '1': '૧',  # Fix English 1 to Gujarati 1
            '2': '૨',  # Fix English 2 to Gujarati 2
            '3': '૩',  # Fix English 3 to Gujarati 3
            '4': '૪',  # Fix English 4 to Gujarati 4
            '5': '૫',  # Fix English 5 to Gujarati 5
            '6': '૬',  # Fix English 6 to Gujarati 6
            '7': '૭',  # Fix English 7 to Gujarati 7
            '8': '૮',  # Fix English 8 to Gujarati 8
            '9': '૯',  # Fix English 9 to Gujarati 9
        }
        
        # Apply replacements
        for old, new in replacements.items():
            normalized_text = normalized_text.replace(old, new)
        
        return normalized_text

    def find_gujarati_matches(self, text: str, query: str) -> List[Dict[str, Any]]:
        """Find all matches of Gujarati text in the given text"""
        if not text or not query:
            return []
        
        matches = []
        normalized_text = self.normalize_gujarati_text(text)
        normalized_query = self.normalize_gujarati_text(query)
        
        # Find all occurrences of the query in the text
        start_pos = 0
        while True:
            pos = normalized_text.find(normalized_query, start_pos)
            if pos == -1:
                break
            
            # Extract context around the match
            context_start = max(0, pos - 50)
            context_end = min(len(normalized_text), pos + len(normalized_query) + 50)
            context = normalized_text[context_start:context_end]
            
            # Add ellipsis if we're not at the beginning/end
            if context_start > 0:
                context = "..." + context
            if context_end < len(normalized_text):
                context = context + "..."
            
            matches.append({
                'position': pos,
                'context': context,
                'query': normalized_query,
                'context_start': context_start,
                'context_end': context_end
            })
            
            start_pos = pos + 1
        
        return matches 