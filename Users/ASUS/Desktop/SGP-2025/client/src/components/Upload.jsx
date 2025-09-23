import React, { useState, useCallback } from 'react';
import { uploadPDF } from '../api';

const Upload = ({ onUploadSuccess, onUploadError }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const resetUploadState = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setRetryCount(0);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const supported = files.find(file => (
      file.type === 'application/pdf' || /image\/(png|jpe?g)/i.test(file.type)
    ));
    if (supported) {
      handleFileUpload(supported);
    } else {
      const errorMsg = 'Please drop a PDF or PNG/JPG image';
      setUploadError(errorMsg);
      onUploadError(errorMsg);
    }
  }, [onUploadError]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const validateFile = useCallback((file) => {
    // Check file type
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
    const isImg = /image\/(png|jpe?g)/i.test(file.type) || /\.(png|jpe?g)$/i.test(file.name || '');
    if (!isPdf && !isImg) {
      return 'Please select a PDF or PNG/JPG image';
    }
    
    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return 'File size should be less than 50MB';
    }
    
    // Check if file is empty
    if (file.size === 0) {
      return 'File is empty. Please select a valid file.';
    }
    
    // Check filename
    if (!file.name || file.name.trim() === '') {
      return 'Invalid filename. Please select a valid file.';
    }
    
    return null; // No error
  }, []);

  const handleFileUpload = async (file, isRetry = false) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      onUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadPDF(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Success
      setTimeout(() => {
        resetUploadState();
        onUploadSuccess(result);
      }, 500);
      
    } catch (error) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const detail = error.response.data?.detail || error.response.data?.message;
        
        switch (status) {
          case 400:
            errorMessage = detail || 'Invalid file format. Please upload a valid PDF.';
            break;
          case 413:
            errorMessage = 'File too large. Please upload a smaller PDF file.';
            break;
          case 500:
            errorMessage = detail || 'Server error. Please try again later.';
            break;
          default:
            errorMessage = detail || `Upload failed (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        errorMessage = error.message || 'Upload failed. Please try again.';
      }
      
      setUploadError(errorMessage);
      onUploadError(errorMessage);
    }
  };

  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      // Re-upload the same file
      const fileInput = document.getElementById('file-input');
      if (fileInput && fileInput.files[0]) {
        handleFileUpload(fileInput.files[0], true);
      }
    } else {
      setUploadError('Maximum retry attempts reached. Please try uploading a different file.');
    }
  }, [retryCount]);

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Upload Your PDF</h2>
        <p className="text-slate-300 text-lg">Drag and drop your Gujarati PDF document to get started</p>
      </div>

      <div
        className={`relative group transition-all duration-500 ease-out ${
          isDragOver ? 'scale-105' : 'scale-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 ${
            isDragOver 
              ? 'border-purple-400 bg-purple-500/10 shadow-2xl shadow-purple-500/25' 
              : uploadError 
                ? 'border-red-400 bg-red-500/10 shadow-2xl shadow-red-500/25' 
                : isUploading 
                  ? 'border-green-400 bg-green-500/10 shadow-2xl shadow-green-500/25' 
                  : 'border-slate-400/50 bg-slate-500/10 hover:border-purple-400/50 hover:bg-purple-500/10'
          }`}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-blue-400 to-pink-400 animate-pulse"></div>
          </div>

          <div className="relative p-12">
            {isUploading ? (
              <div className="space-y-6">
                {/* Animated upload icon */}
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-green-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-3">
                  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-300 ease-out shadow-lg"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-green-400 font-semibold text-lg">Uploading... {uploadProgress}%</p>
                  {retryCount > 0 && (
                    <p className="text-slate-400 text-sm">
                      Retry attempt: {retryCount}/3
                    </p>
                  )}
                </div>
              </div>
            ) : uploadError ? (
              <div className="space-y-6">
                {/* Error icon */}
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-red-400">Upload Failed</h3>
                  <p className="text-red-300 text-lg max-w-md mx-auto">{uploadError}</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {retryCount < 3 && (
                      <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Retry Upload
                      </button>
                    )}
                    <button
                      onClick={resetUploadState}
                      className="px-6 py-3 bg-slate-600/50 text-slate-300 rounded-xl font-semibold hover:bg-slate-600/70 transition-all duration-300 border border-slate-500/50"
                    >
                      Try Different File
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Upload icon with glow effect */}
                <div className="relative mx-auto w-32 h-32 mb-8 group-hover:scale-110 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-blue-400 to-pink-400 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                  <div className="absolute inset-2 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Drop your PDF or Image here</h3>
                    <p className="text-slate-300 text-lg">or click to browse files</p>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    id="file-input"
                  />
                  
                  <label 
                    htmlFor="file-input" 
                    className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:from-purple-600 hover:to-blue-600"
                  >
                    Choose PDF/Image File
                  </label>

                  {/* File requirements */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </div>
                      <p className="text-slate-300 text-sm text-center">PDF / PNG / JPG</p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                      </div>
                      <p className="text-slate-300 text-sm text-center">Max 50MB</p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                      </div>
                      <p className="text-slate-300 text-sm text-center">No Password</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload; 