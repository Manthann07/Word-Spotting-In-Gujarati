import React, { useState, useRef } from 'react';
import { searchPDF, searchByImage } from '../api';

const SearchBox = ({ selectedPDF, onSearchResults, onSearchError }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [queryImage, setQueryImage] = useState(null);
  const [queryImageName, setQueryImageName] = useState('');
  const [ocrPreview, setOcrPreview] = useState('');
  const [pressedKey, setPressedKey] = useState(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const insertAtCursor = (textToInsert, keyId = null) => {
    // Visual feedback for pressed key
    if (keyId !== null) {
      setPressedKey(keyId);
      setTimeout(() => setPressedKey(null), 200);
    }
    
    const input = inputRef.current;
    if (!input) {
      setQuery(prev => prev + textToInsert);
      return;
    }
    const start = input.selectionStart || query.length;
    const end = input.selectionEnd || query.length;
    const newValue = query.slice(0, start) + textToInsert + query.slice(end);
    setQuery(newValue);
    // Move caret after inserted text on next tick
    requestAnimationFrame(() => {
      input.focus();
      const pos = start + textToInsert.length;
      input.setSelectionRange(pos, pos);
    });
  };

  const handleBackspace = () => {
    // Visual feedback
    setPressedKey('backspace');
    setTimeout(() => setPressedKey(null), 200);
    
    const input = inputRef.current;
    if (!input) {
      setQuery(prev => prev.slice(0, -1));
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    if (start !== end) {
      // Delete selection
      const newValue = query.slice(0, start) + query.slice(end);
      setQuery(newValue);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start, start);
      });
    } else if (start > 0) {
      const pos = start - 1;
      const newValue = query.slice(0, pos) + query.slice(end);
      setQuery(newValue);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(pos, pos);
      });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!selectedPDF) {
      onSearchError('Please upload a PDF first');
      return;
    }
    setIsSearching(true);
    try {
      if (queryImage) {
        const isPdf = /\.pdf$/i.test(selectedPDF || '');
        if (!isPdf) {
          onSearchError('Please select a PDF to search in. You uploaded an image as the document.');
          return;
        }
        const response = await searchByImage(selectedPDF, queryImage);
        const normalized = (response?.extracted_query || response?.query || '').replace(/\s+/g, ' ').trim();
        if (normalized) {
          setOcrPreview(normalized);
          setQuery(normalized);
          setSearchHistory(prev => {
            const newHistory = [normalized, ...prev.filter(item => item !== normalized)].slice(0, 5);
            return newHistory;
          });
        } else {
          setOcrPreview('');
        }
        onSearchResults(response);
      } else {
        if (!query.trim()) {
          onSearchError('Please enter a search query or upload an image');
          return;
        }
        const trimmed = query.trim();
        const results = await searchPDF(trimmed, selectedPDF);
        setSearchHistory(prev => {
          const newHistory = [trimmed, ...prev.filter(item => item !== trimmed)].slice(0, 5);
          return newHistory;
        });
        onSearchResults(results);
      }
    } catch (error) {
      onSearchError(error.response?.data?.detail || 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
      // Reset image selection so the same/new image can be chosen again without refresh
      setQueryImage(null);
      setQueryImageName('');
      if (fileInputRef.current) {
        try { fileInputRef.current.value = null; } catch (e) {}
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setQueryImage(file || null);
    setQueryImageName(file ? (file.name || 'image') : '');
    setOcrPreview('');
  };

  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Search Your Document</h2>
        <p className="text-slate-300 text-lg">Find specific words, phrases, or content in your Gujarati PDF</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative group">
          {/* Glow effect behind search bar */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative flex gap-3 items-center bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-600/30 p-2 shadow-2xl">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your search query in Gujarati or English..."
                className="w-full pl-12 pr-4 py-4 bg-transparent border-none text-white placeholder-slate-400 text-lg focus:outline-none focus:ring-0"
                disabled={isSearching}
                ref={inputRef}
              />
            </div>
              <button
              type="button"
              onClick={() => setShowKeyboard(v => !v)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
              title="Toggle Gujarati Keyboard"
            >
              ગુજરાતી કીબોર્ડ
            </button>
            <label className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer">
              Upload Image
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                onChange={handleImageChange} 
                onClick={(e) => { e.target.value = null; }}
                ref={fileInputRef}
                className="hidden" 
              />
            </label>
            
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:from-purple-600 hover:to-blue-600"
              disabled={isSearching || (!queryImage && !query.trim())}
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Searching...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  Search
                </div>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Virtual Gujarati Keyboard */}
      {showKeyboard && (
        <div className="mb-6 relative group animate-fade-in">
          {/* Glow effect behind keyboard */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition duration-1000"></div>
          
          <div className="relative bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-purple-500/30 px-3 py-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h4 className="text-white font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Gujarati Keyboard</h4>
              </div>
              <button 
                onClick={() => setShowKeyboard(false)} 
                className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 hover:bg-red-500/20 hover:border-red-500/50 hover:text-white transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Keys */}
            <div className="space-y-2">
              {/* Row 1 - Vowels and Modifiers */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['ં','ઁ','ઃ','અ','આ','ઇ','ઈ','ઉ','ઊ','ઋ','એ','ઐ','ઓ','ઔ','અં','અઃ'].map((k, idx) => {
                  const keyId = `row1-${idx}-${k}`;
                  const isPressed = pressedKey === keyId;
                  return (
                    <button 
                      key={keyId} 
                      type="button" 
                      onClick={() => insertAtCursor(k, keyId)} 
                      className={`relative px-3 py-2 rounded-lg text-white font-medium border transition-all duration-200 overflow-hidden
                        ${isPressed 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400 scale-90 shadow-lg shadow-purple-500/50' 
                          : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-slate-600/50 hover:from-purple-500/60 hover:to-purple-600/60 hover:border-purple-500/70 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 active:scale-90'
                        }`}
                    >
                      <span className="relative z-10">{k}</span>
                      {isPressed && (
                        <span className="absolute inset-0 bg-white/20 rounded-lg animate-ping"></span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Row 2 - Consonants */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['ક','ખ','ગ','ઘ','ચ','છ','જ','ઝ','ઞ','ટ','ઠ','ડ','ઢ','ણ','ત','થ','દ','ધ','ન'].map((k, idx) => {
                  const keyId = `row2-${idx}-${k}`;
                  const isPressed = pressedKey === keyId;
                  return (
                    <button 
                      key={keyId} 
                      type="button" 
                      onClick={() => insertAtCursor(k, keyId)} 
                      className={`relative px-3 py-2 rounded-lg text-white font-medium border transition-all duration-200 overflow-hidden
                        ${isPressed 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 scale-90 shadow-lg shadow-blue-500/50' 
                          : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-slate-600/50 hover:from-blue-500/60 hover:to-blue-600/60 hover:border-blue-500/70 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 active:scale-90'
                        }`}
                    >
                      <span className="relative z-10">{k}</span>
                      {isPressed && (
                        <span className="absolute inset-0 bg-white/20 rounded-lg animate-ping"></span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Row 3 - More Consonants */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['પ','ફ','બ','ભ','મ','ય','ર','લ','વ','શ','ષ','સ','હ','ળ','ક્ષ','જ્ઞ'].map((k, idx) => {
                  const keyId = `row3-${idx}-${k}`;
                  const isPressed = pressedKey === keyId;
                  return (
                    <button 
                      key={keyId} 
                      type="button" 
                      onClick={() => insertAtCursor(k, keyId)} 
                      className={`relative px-3 py-2 rounded-lg text-white font-medium border transition-all duration-200 overflow-hidden
                        ${isPressed 
                          ? 'bg-gradient-to-br from-pink-500 to-pink-600 border-pink-400 scale-90 shadow-lg shadow-pink-500/50' 
                          : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-slate-600/50 hover:from-pink-500/60 hover:to-pink-600/60 hover:border-pink-500/70 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/30 active:scale-90'
                        }`}
                    >
                      <span className="relative z-10">{k}</span>
                      {isPressed && (
                        <span className="absolute inset-0 bg-white/20 rounded-lg animate-ping"></span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Row 4 - Matras and Special Keys */}
              <div className="flex flex-wrap gap-1.5 justify-center items-center">
                {['ા','િ','ી','ુ','ૂ','ૃ','ે','ૈ','ો','ૌ','્','ં','ઃ','઼'].map((k, idx) => {
                  const keyId = `matra-${idx}-${k}`;
                  const isPressed = pressedKey === keyId;
                  return (
                    <button 
                      key={keyId} 
                      type="button" 
                      onClick={() => insertAtCursor(k, keyId)} 
                      className={`relative px-3 py-2 rounded-lg text-white font-medium border transition-all duration-200 overflow-hidden
                        ${isPressed 
                          ? 'bg-gradient-to-br from-purple-500 to-blue-500 border-purple-400 scale-90 shadow-lg shadow-purple-500/50' 
                          : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-slate-600/50 hover:from-purple-500/60 hover:to-blue-500/60 hover:border-purple-500/70 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 active:scale-90'
                        }`}
                    >
                      <span className="relative z-10">{k}</span>
                      {isPressed && (
                        <span className="absolute inset-0 bg-white/20 rounded-lg animate-ping"></span>
                      )}
                    </button>
                  );
                })}
                
                {/* Numbers Row */}
                <div className="flex gap-1.5 ml-2">
                  {['૦','૧','૨','૩','૪','૫','૬','૭','૮','૯'].map((k, idx) => {
                    const keyId = `num-${idx}-${k}`;
                    const isPressed = pressedKey === keyId;
                    return (
                      <button 
                        key={keyId} 
                        type="button" 
                        onClick={() => insertAtCursor(k, keyId)} 
                        className={`relative px-3 py-2 rounded-lg text-white font-medium border transition-all duration-200 overflow-hidden
                          ${isPressed 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500 border-blue-400 scale-90 shadow-lg shadow-blue-500/50' 
                            : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-slate-600/50 hover:from-blue-500/60 hover:to-purple-500/60 hover:border-blue-500/70 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 active:scale-90'
                          }`}
                      >
                        <span className="relative z-10">{k}</span>
                        {isPressed && (
                          <span className="absolute inset-0 bg-white/20 rounded-lg animate-ping"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Punctuation */}
                <div className="flex gap-1.5 ml-2">
                  {['.', ',', ';', ':'].map((k, idx) => {
                    const keyId = `punc-${idx}-${k}`;
                    const isPressed = pressedKey === keyId;
                    return (
                      <button 
                        key={keyId} 
                        type="button" 
                        onClick={() => insertAtCursor(k, keyId)} 
                        className={`relative px-3 py-2 rounded-lg text-white font-medium border transition-all duration-200 overflow-hidden
                          ${isPressed 
                            ? 'bg-gradient-to-br from-slate-600 to-slate-700 border-slate-500 scale-90 shadow-lg' 
                            : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 border-slate-600/50 hover:from-slate-600/80 hover:to-slate-700/80 hover:border-slate-500/70 hover:scale-105 active:scale-90'
                          }`}
                      >
                        <span className="relative z-10">{k}</span>
                        {isPressed && (
                          <span className="absolute inset-0 bg-white/20 rounded-lg animate-ping"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Space Button */}
                <button 
                  type="button" 
                  onClick={() => insertAtCursor(' ', 'space')} 
                  className={`relative px-5 py-2 ml-1.5 rounded-lg text-white font-semibold border transition-all duration-200 flex items-center gap-2 overflow-hidden
                    ${pressedKey === 'space'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 border-purple-400 scale-95 shadow-lg shadow-purple-500/50'
                      : 'bg-gradient-to-r from-purple-500/60 to-blue-500/60 border-purple-400/50 hover:from-purple-500 hover:to-blue-500 hover:border-purple-400 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/40 active:scale-95'
                    }`}
                >
                  <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                  <span className="relative z-10">Space</span>
                  {pressedKey === 'space' && (
                    <span className="absolute inset-0 bg-white/20 rounded-lg animate-ping"></span>
                  )}
                </button>
                
                {/* Backspace Button */}
                <button 
                  type="button" 
                  onClick={handleBackspace} 
                  className={`relative px-5 py-2 ml-1.5 rounded-lg text-white font-semibold border transition-all duration-200 flex items-center gap-2 overflow-hidden
                    ${pressedKey === 'backspace'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 border-red-400 scale-95 shadow-lg shadow-red-500/50'
                      : 'bg-gradient-to-r from-red-500/60 to-pink-500/60 border-red-400/50 hover:from-red-500 hover:to-pink-500 hover:border-red-400 hover:scale-105 hover:shadow-lg hover:shadow-red-500/40 active:scale-95'
                    }`}
                >
                  <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"></path>
                  </svg>
                  <span className="relative z-10 hidden sm:inline">Delete</span>
                  {pressedKey === 'backspace' && (
                    <span className="absolute inset-0 bg-white/20 rounded-lg animate-ping"></span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {queryImage && (
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-4 mb-4 flex items-center justify-between">
          <div className="text-slate-200">
            <div className="text-sm">Query image selected. Click Search to use OCR.</div>
            <div className="font-semibold truncate max-w-[70vw]">{queryImageName}</div>
          </div>
          <button
            onClick={() => { setQueryImage(null); setQueryImageName(''); }}
            className="px-3 py-2 bg-slate-700/60 text-slate-200 rounded-lg hover:bg-red-500/30 border border-slate-600/40"
          >
            Remove
          </button>
        </div>
      )}
      {ocrPreview && (
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-600/30 p-4 mb-4 text-slate-200">
          <div className="text-sm">Extracted from image:</div>
          <div className="font-semibold">{ocrPreview}</div>
        </div>
      )}
      {searchHistory.length > 0 && (
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-600/30 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h4 className="text-white font-semibold text-lg">Recent Searches</h4>
            </div>
            <button 
              onClick={handleClearHistory} 
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-300 border border-red-500/30"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(item)}
                className="group px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-white transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  {item}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current PDF Info */}
      {selectedPDF && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium">Currently searching in:</p>
              <p className="text-white font-semibold text-lg">{selectedPDF}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Tips */}
      <div className="mt-8 bg-slate-800/20 backdrop-blur-xl rounded-2xl border border-slate-600/20 p-6">
        <h4 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Search Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>Search in Gujarati, English, or mixed languages</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>Use exact phrases for better results</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>AI-powered semantic search included</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>Results show page numbers and relevance scores</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBox; 