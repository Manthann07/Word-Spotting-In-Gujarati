import axios from 'axios';

// Create axios instance for API calls
const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 300000, // 5 minutes timeout for large file uploads and processing
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable upload progress tracking
  onUploadProgress: (progressEvent) => {
    if (progressEvent.total) {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log('Upload progress:', percentCompleted + '%');
    }
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Log request for debugging
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API] Response error:', error);
    
    if (error.response) {
      // Server responded with error status
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received - possible network issue');
    } else {
      // Something else happened
      console.error('Error message:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API functions
export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const isImage = /image\/(png|jpe?g)/i.test(file.type) || /\.(png|jpe?g)$/i.test(file.name || '');
  const endpoint = isImage ? '/upload-image' : '/upload-pdf';

  const response = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes for upload + processing
    // Add retry logic for network issues
    validateStatus: (status) => {
      return status < 500; // Don't retry on 4xx errors
    },
  });
  return response.data;
};

export const searchPDF = async (query, pdfFilename) => {
  const response = await api.post('/search', {
    query,
    pdf_filename: pdfFilename,
  }, {
    timeout: 60000, // 1 minute for search
  });
  return response.data;
};

export const searchByImage = async (pdfFilename, imageFile) => {
  const formData = new FormData();
  formData.append('pdf_filename', pdfFilename);
  formData.append('image', imageFile);
  try {
    const response = await api.post('/search-by-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return response.data;
  } catch (err) {
    // Fallback path if the endpoint doesn't exist on the server (404)
    if (err?.response?.status === 404) {
      // 1) OCR the image first using /upload-image
      const ocrForm = new FormData();
      ocrForm.append('file', imageFile);
      const ocrRes = await api.post('/upload-image', ocrForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      const extracted = (ocrRes?.data?.pages?.[0]?.text || '').trim();
      const query = extracted.replace(/\s+/g, ' ').trim();
      if (!query) {
        throw new Error('Could not read any text from the image');
      }

      // 2) Run the standard text search using the extracted query
      const searchRes = await api.post('/search', {
        query,
        pdf_filename: pdfFilename,
      }, { timeout: 60000 });

      // Attach metadata similar to /search-by-image response
      return { ...searchRes.data, extracted_query: query, search_type: 'fallback_from_image' };
    }
    throw err;
  }
};

export const ocrImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  const res = await api.post('/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  const text = (res?.data?.pages?.[0]?.text || '').trim();
  return text;
};

export const listPDFs = async () => {
  const response = await api.get('/pdfs', {
    timeout: 10000, // 10 seconds for listing files
  });
  return response.data;
};

export const getAPIStatus = async () => {
  const response = await api.get('/', {
    timeout: 5000, // 5 seconds for health check
  });
  return response.data;
};

export const downloadHighlightedPDF = async (query, pdfFilename) => {
  try {
    const response = await api.post(
      '/download-highlighted',
      { query, pdf_filename: pdfFilename },
      { responseType: 'blob', timeout: 120000 }
    );
    return response.data; // Blob
  } catch (err) {
    // Fallback to GET if POST route not found (older server)
    if (err?.response?.status === 404) {
      const response = await api.get(
        `/download-highlighted`,
        {
          params: { query, pdf_filename: pdfFilename },
          responseType: 'blob',
          timeout: 120000,
        }
      );
      return response.data;
    }
    throw err;
  }
};

export const downloadHighlightedImage = async (query, imageFilename) => {
  const response = await api.post(
    '/download-highlighted-image',
    { query, pdf_filename: imageFilename },
    { responseType: 'blob', timeout: 120000 }
  );
  return response.data;
};

export default api; 