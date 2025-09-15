import React, { useState, useEffect, useRef } from 'react';
import { downloadHighlightedPDF } from '../api';

const PDFViewer = ({ pdfData, searchResults, currentQuery }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [showSearchHighlights, setShowSearchHighlights] = useState(true);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [highlightMethod, setHighlightMethod] = useState('auto'); // 'auto', 'simple', 'regex'
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (searchResults?.results?.length > 0) {
      setCurrentPage(searchResults.results[0].page);
      resetMatchNavigation();
    }
  }, [searchResults]);

  useEffect(() => {
    resetMatchNavigation();
  }, [currentPage, currentQuery]);

  const pageTextRef = useRef(null);

  useEffect(() => {
    // Scroll to the current match when it changes (scoped to page text area)
    if (currentQuery && showSearchHighlights && getMatchCountForCurrentPage() > 0 && pageTextRef.current) {
      const marks = pageTextRef.current.querySelectorAll('mark');
      if (marks.length > currentMatchIndex) {
        marks[currentMatchIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchIndex, currentQuery, showSearchHighlights]);

  useEffect(() => {
    // Add keyboard shortcuts for match navigation
    const handleKeyDown = (e) => {
      if (currentQuery && showSearchHighlights && getMatchCountForCurrentPage() > 1) {
        if (e.key === 'ArrowRight' || e.key === 'n') {
          e.preventDefault();
          navigateToNextMatch();
        } else if (e.key === 'ArrowLeft' || e.key === 'p') {
          e.preventDefault();
          navigateToPreviousMatch();
        }
      }
      
      // Global navigation shortcuts
      if (currentQuery && showSearchHighlights && getTotalMatchCount() > 1) {
        if (e.shiftKey && e.key === 'ArrowRight') {
          e.preventDefault();
          navigateToNextGlobalMatch();
        } else if (e.shiftKey && e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateToPreviousGlobalMatch();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentQuery, showSearchHighlights]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pdfData?.total_pages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const handleZoomChange = (newZoom) => {
    const clampedZoom = Math.max(0.5, Math.min(3, newZoom));
    setZoom(clampedZoom);
  };

  const highlightText = (text, query) => {
    if (!query || !showSearchHighlights) return text;
    
    // Handle Gujarati and other Unicode text properly
    // Escape special regex characters in the query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a more robust regex that handles Unicode properly
    // Use Unicode property escapes for better language support
    const regex = new RegExp(`(${escapedQuery})`, 'giu');
    
    // Replace with highlighted version
    const highlightedText = text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 rounded px-1 font-semibold">$1</mark>');
    
    return highlightedText;
  };

  const highlightSearchResult = (text, query) => {
    if (!query) return text;
    
    // Handle Gujarati and other Unicode text properly
    // Escape special regex characters in the query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a more robust regex that handles Unicode properly
    const regex = new RegExp(`(${escapedQuery})`, 'giu');
    
    // Replace with highlighted version
    const highlightedText = text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 rounded px-1 font-semibold">$1</mark>');
    
    return highlightedText;
  };

  const highlightAllMatches = (text, query) => {
    if (!query || !showSearchHighlights) return text;
    
    console.log('🔍 Regex highlighting:', { query, textLength: text.length });
    
    // Normalize to NFC and build regex tolerant to zero-width and whitespace
    const textNorm = text.normalize('NFC');
    const queryNorm = query.normalize('NFC');
    const spacer = "[\\s\\u200B\\u200C\\u200D\\uFEFF]*";
    const parts = Array.from(queryNorm).map(ch => ch.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'));
    const regex = new RegExp(parts.join(spacer), 'giu');
    
    console.log('🔍 Regex pattern:', regex);
    
    // Replace with highlighted version - use different colors for multiple matches
    let matchCount = 0;
    const highlightedText = textNorm.replace(regex, (match) => {
      matchCount++;
      console.log('🎯 Found match:', match, 'at position', matchCount);
      const baseStyle = 'padding:0 2px;border-radius:2px;';
      let style;
      if (matchCount === currentMatchIndex + 1) {
        style = `${baseStyle}background-color:#fca5a5;color:#7f1d1d;border:2px solid #ef4444;`;
      } else if (matchCount % 2 === 0) {
        style = `${baseStyle}background-color:#fed7aa;color:#7c2d12;`;
      } else {
        style = `${baseStyle}background-color:#fde68a;color:#78350f;`;
      }
      return `<mark style="${style}">${match}</mark>`;
    });
    
    console.log('🎯 Total matches found:', matchCount);
    return highlightedText;
  };

  const simpleHighlight = (text, query) => {
    if (!query || !showSearchHighlights) return text;
    
    console.log('🔍 Simple highlighting for:', query);
    
    // Zero-width + whitespace tolerant simple regex with NFC normalization
    const textNorm = text.normalize('NFC');
    const queryNorm = query.normalize('NFC');
    const spacer = "[\\s\\u200B\\u200C\\u200D\\uFEFF]*";
    const parts = Array.from(queryNorm).map(ch => ch.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'));
    const regex = new RegExp(parts.join(spacer), 'giu');
    const highlightedText = textNorm.replace(regex, 
      '<mark style="background-color:#fde68a;color:#78350f;padding:0 2px;border-radius:2px;">$&</mark>'
    );
    
    console.log('🎯 Simple highlighting result length:', highlightedText.length);
    return highlightedText;
  };

  const highlightWithExactMatches = (text, query, exactMatches = []) => {
    if (!query || !showSearchHighlights) return text;

    // Escape HTML helper to render raw PDF text safely
    const escapeHtml = (s) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // If we have exact match data, build the HTML from raw text using positions
    if (exactMatches && exactMatches.length > 0) {
      const sorted = [...exactMatches].sort((a, b) => a.position - b.position);
      let html = '';
      let cursor = 0;
      let count = 0;

      for (const m of sorted) {
        if (m.position == null || m.length == null || m.position < cursor) continue;
        // Append safe text before match
        html += escapeHtml(text.slice(cursor, m.position));
        count += 1;
        const isCurrent = count === (currentMatchIndex + 1);
        const colorClass = isCurrent
          ? 'bg-red-300 text-red-900 border-2 border-red-500'
          : (count % 2 === 0 ? 'bg-orange-200 text-orange-900' : 'bg-yellow-200 text-yellow-900');
        const matchText = text.slice(m.position, m.position + m.length);
        html += `<mark class="${colorClass} rounded px-1 font-semibold">${escapeHtml(matchText)}</mark>`;
        cursor = m.position + m.length;
      }
      // Append the tail
      html += escapeHtml(text.slice(cursor));
      return html;
    }

    // Fallback: zero-width tolerant regex highlighting on escaped text
    const textNorm = text.normalize('NFC');
    const queryNorm = query.normalize('NFC');
    const base = escapeHtml(textNorm);
    const spacer = "[\\s\\u200B\\u200C\\u200D\\uFEFF]*";
    const parts = Array.from(queryNorm).map(ch => ch.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'));
    const regex = new RegExp(parts.join(spacer), 'giu');
    return base.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 rounded px-1 font-semibold">$&</mark>');
  };

  const getCurrentPageData = () => {
    if (!pdfData?.pages) return null;
    return pdfData.pages.find(page => page.page === currentPage);
  };

  const getSearchResultsForCurrentPage = () => {
    if (!searchResults?.results) return [];
    return searchResults.results.filter(result => result.page === currentPage);
  };

  const getMatchCountForCurrentPage = () => {
    if (!currentQuery || !currentPageData) return 0;
    // Prefer exact match counts when available
    const exact = getSearchResultsForCurrentPage().flatMap(r => (r.exact_matches || []));
    if (exact.length > 0) return exact.length;
    const escapedQuery = currentQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'giu');
    const matches = currentPageData.text.match(regex);
    return matches ? matches.length : 0;
  };

  const getTotalMatchCount = () => {
    if (!currentQuery || !searchResults?.results) return 0;
    // Prefer exact match counts when available
    const exactTotal = searchResults.results.reduce((acc, r) => acc + (r.exact_matches ? r.exact_matches.length : 0), 0);
    if (exactTotal > 0) return exactTotal;
    let totalMatches = 0;
    searchResults.results.forEach(result => {
      if (result.full_text) {
        const escapedQuery = currentQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedQuery, 'giu');
        const matches = result.full_text.match(regex);
        if (matches) totalMatches += matches.length;
      }
    });
    return totalMatches;
  };

  const getCurrentMatchGlobalPosition = () => {
    if (!currentQuery || !searchResults?.results) return { current: 0, total: 0 };
    
    let currentPosition = 0;
    let totalMatches = 0;
    
    for (let i = 0; i < searchResults.results.length; i++) {
      const result = searchResults.results[i];
      const pageMatchCount = result.exact_matches ? result.exact_matches.length : (() => {
        if (!result.full_text) return 0;
        const escapedQuery = currentQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedQuery, 'giu');
        const m = result.full_text.match(regex);
        return m ? m.length : 0;
      })();
      if (pageMatchCount > 0) {
        totalMatches += pageMatchCount;
        if (result.page === currentPage) {
          currentPosition += currentMatchIndex + 1;
          break;
        } else {
          currentPosition += pageMatchCount;
        }
      }
    }
    
    return { current: currentPosition, total: totalMatches };
  };

  const navigateToPreviousMatch = () => {
    const matchCount = getMatchCountForCurrentPage();
    if (matchCount > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matchCount) % matchCount);
    }
  };

  const navigateToNextMatch = () => {
    const matchCount = getMatchCountForCurrentPage();
    if (matchCount > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matchCount);
    }
  };

  const navigateToNextGlobalMatch = () => {
    const globalPos = getCurrentMatchGlobalPosition();
    if (globalPos.total > 0) {
      const nextGlobalPos = globalPos.current % globalPos.total;
      
      // Find the page and match index for the next global position
      let currentCount = 0;
      for (let i = 0; i < searchResults.results.length; i++) {
        const result = searchResults.results[i];
        const pageMatchCount = result.exact_matches ? result.exact_matches.length : (() => {
          if (!result.full_text) return 0;
          const escapedQuery = currentQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedQuery, 'giu');
          const m = result.full_text.match(regex);
          return m ? m.length : 0;
        })();
        if (pageMatchCount > 0) {
          if (currentCount + pageMatchCount > nextGlobalPos) {
            setCurrentPage(result.page);
            setCurrentMatchIndex(nextGlobalPos - currentCount);
            break;
          }
          currentCount += pageMatchCount;
        }
      }
    }
  };

  const navigateToPreviousGlobalMatch = () => {
    const globalPos = getCurrentMatchGlobalPosition();
    if (globalPos.total > 0) {
      let prevGlobalPos = globalPos.current - 2; // -2 because current is 1-indexed
      if (prevGlobalPos < 0) {
        prevGlobalPos = globalPos.total - 1;
      }
      
      // Find the page and match index for the previous global position
      let currentCount = 0;
      for (let i = 0; i < searchResults.results.length; i++) {
        const result = searchResults.results[i];
        const pageMatchCount = result.exact_matches ? result.exact_matches.length : (() => {
          if (!result.full_text) return 0;
          const escapedQuery = currentQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedQuery, 'giu');
          const m = result.full_text.match(regex);
          return m ? m.length : 0;
        })();
        if (pageMatchCount > 0) {
          if (currentCount + pageMatchCount > prevGlobalPos) {
            setCurrentPage(result.page);
            setCurrentMatchIndex(prevGlobalPos - currentCount);
            break;
          }
          currentCount += pageMatchCount;
        }
      }
    }
  };

  const resetMatchNavigation = () => {
    setCurrentMatchIndex(0);
  };

  const handleDownloadHighlightedPDF = async () => {
    if (!pdfData || !currentQuery) {
      alert('Please upload a PDF and perform a search first.');
      return;
    }

    // Check if we have any search results or if we're currently viewing a page with matches
    const hasSearchResults = searchResults?.results && searchResults.results.length > 0;
    const currentPageData = getCurrentPageData();
    const hasCurrentPageContent = currentPageData && currentPageData.text;
    
    if (!hasSearchResults && !hasCurrentPageContent) {
      alert('No content to download. Please perform a search or navigate to a page with content.');
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await downloadHighlightedPDF(currentQuery, pdfData.filename);
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(pdfData.filename || 'document').replace('.pdf', '')}_highlighted.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading highlighted PDF:', error);
      const serverDetail = error?.response?.data?.detail;
      const msg = serverDetail || (error?.message ? `Download failed: ${error.message}` : 'Failed to download highlighted PDF');
      alert(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentPageData = getCurrentPageData();
  const pageSearchResults = getSearchResultsForCurrentPage();

  if (!pdfData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-slate-800/30 rounded-3xl border border-slate-600/30">
        <div className="text-center text-slate-400">
          <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-300 mb-3">No PDF Loaded</h3>
          <p className="text-slate-400 text-lg">Upload a PDF document to start viewing and searching</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Document Viewer</h2>
        <p className="text-slate-300 text-lg">Navigate through pages and view search results with highlights</p>
      </div>

      {/* Navigation and Controls Bar */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-600/30 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Page Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-6 py-3 bg-slate-700/50 rounded-xl font-semibold text-slate-300 hover:bg-purple-500/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-slate-600/50 hover:border-purple-500/50"
            >
              ← Previous
            </button>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                Page {currentPage} of {pdfData.total_pages}
              </div>
              {currentQuery && (
                <div className="text-purple-400 text-sm mt-1">
                  Searching for "{currentQuery}"
                </div>
              )}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pdfData.total_pages}
              className="px-6 py-3 bg-slate-700/50 rounded-xl font-semibold text-slate-300 hover:bg-purple-500/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-slate-600/50 hover:border-purple-500/50"
            >
              Next →
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleZoomChange(zoom - 0.1)}
              disabled={zoom <= 0.5}
              className="w-10 h-10 bg-slate-700/50 rounded-xl font-bold text-lg text-slate-300 hover:bg-blue-500/20 hover:text-white disabled:opacity-50 transition-all duration-300 border border-slate-600/50 hover:border-blue-500/50"
            >
              -
            </button>
            <span className="font-medium text-white text-lg min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => handleZoomChange(zoom + 0.1)}
              disabled={zoom >= 3}
              className="w-10 h-10 bg-slate-700/50 rounded-xl font-bold text-lg text-slate-300 hover:bg-blue-500/20 hover:text-white disabled:opacity-50 transition-all duration-300 border border-slate-600/50 hover:border-blue-500/50"
            >
              +
            </button>
          </div>

          {/* Search Controls */}
          {currentQuery && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 text-white cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showSearchHighlights}
                    onChange={(e) => setShowSearchHighlights(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 ${
                    showSearchHighlights 
                      ? 'bg-purple-500 border-purple-500' 
                      : 'bg-transparent border-slate-400'
                  }`}>
                    {showSearchHighlights && (
                      <svg className="w-4 h-4 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium">Show Highlights</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Method:</span>
                <select
                  value={highlightMethod}
                  onChange={(e) => setHighlightMethod(e.target.value)}
                  className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                >
                  <option value="auto">Auto</option>
                  <option value="simple">Simple</option>
                  <option value="regex">Regex</option>
                </select>
              </div>

              {/* Download Highlighted PDF Button */}
              <button
                onClick={handleDownloadHighlightedPDF}
                disabled={isDownloading}
                className={`px-4 py-2 rounded-lg font-medium shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${
                  isDownloading
                    ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-purple-500/25 hover:from-purple-600 hover:to-blue-600'
                }`}
                                  title="Download PDF with search results"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                                          Download Search Results PDF
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Search Results Summary */}
        {currentQuery && showSearchHighlights && (
          <div className="mt-6 pt-6 border-t border-slate-600/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  <span className="text-purple-300 font-semibold">
                    {getMatchCountForCurrentPage()} matches found on this page
                  </span>
                </div>
                
                {getTotalMatchCount() > 0 && (
                  <div className="text-blue-300 text-sm">
                    Total: {getTotalMatchCount()} matches across all pages
                  </div>
                )}
              </div>

              {/* Match Navigation */}
              {getMatchCountForCurrentPage() > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={navigateToPreviousMatch}
                    className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors duration-300 border border-blue-500/30 flex items-center justify-center"
                    title="Previous match on this page (← or P)"
                  >
                    ←
                  </button>
                  <span className="text-white font-medium">
                    {currentMatchIndex + 1} of {getMatchCountForCurrentPage()}
                  </span>
                  <button
                    onClick={navigateToNextMatch}
                    className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors duration-300 border border-blue-500/30 flex items-center justify-center"
                    title="Next match on this page (→ or N)"
                  >
                    →
                  </button>
                </div>
              )}

              {/* Global Navigation */}
              {getTotalMatchCount() > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={navigateToPreviousGlobalMatch}
                    className="w-10 h-10 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors duration-300 border border-green-500/30 flex items-center justify-center"
                    title="Previous match across all pages (Shift + ←)"
                  >
                    ⟵
                  </button>
                  <button
                    onClick={navigateToNextGlobalMatch}
                    className="w-10 h-10 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors duration-300 border border-green-500/30 flex items-center justify-center"
                    title="Next match across all pages (Shift + →)"
                  >
                    ⟶
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Document Content */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-600/30 p-8 overflow-hidden">
        <div 
          className="min-h-[500px] overflow-x-auto relative"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {currentPageData ? (
            <div className="whitespace-pre-wrap break-words text-slate-200 text-lg leading-relaxed">
              {/* No Results Message */}
              {currentQuery && pageSearchResults.length === 0 && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <div>
                      <p className="font-semibold">No search results found for "{currentQuery}" on this page.</p>
                      <p className="text-sm opacity-80">Try navigating to other pages or refining your search.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Page Text with Highlights */}
              <div 
                ref={pageTextRef}
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    if (highlightMethod === 'simple') {
                      return simpleHighlight(currentPageData.text, currentQuery);
                    } else if (highlightMethod === 'regex') {
                      return highlightAllMatches(currentPageData.text, currentQuery);
                    } else {
                      // Use exact match positions from the server when available
                      const exactMatches = pageSearchResults.flatMap(r => (r.exact_matches || []));
                      const sourceText = (pageSearchResults.find(r => r.full_text)?.full_text || currentPageData.text).normalize('NFC');
                      return highlightWithExactMatches(sourceText, currentQuery, exactMatches);
                    }
                  })()
                }}
              />

              {/* Page Search Results */}
              {pageSearchResults.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-600/30">
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    Search Results for "{currentQuery}" on this Page
                  </h4>
                  
                  <div className="space-y-4">
                    {pageSearchResults.map((result, index) => (
                      <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/30">
                              Similarity: {Math.round(result.score * 100)}%
                            </span>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30">
                              Score: {result.score.toFixed(3)}
                            </span>
                            {result.exact_matches && (
                              <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30">
                                {result.exact_matches.length} exact matches
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div 
                          className="text-slate-200 text-base leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchResult(result.text, currentQuery)
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Navigation Help */}
                  {getMatchCountForCurrentPage() > 1 && (
                    <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>
                          <strong>Navigation:</strong> Use ← → arrow keys or P/N keys to navigate between matches on this page.
                          {getTotalMatchCount() > 1 && (
                            <span className="ml-2">
                              Use Shift + ← → to navigate across all pages.
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400 text-lg">Page {currentPage} not found</div>
          )}
        </div>
      </div>

      {/* Search Summary */}
      {searchResults?.results?.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Search Summary
              </h4>
              
              <p className="text-blue-200 text-lg">
                Found {searchResults.results.length} results for "{currentQuery}" across {searchResults.total_pages} pages
                {getTotalMatchCount() > 0 && (
                  <span className="ml-2 text-blue-300 font-semibold">
                    ({getTotalMatchCount()} total matches)
                  </span>
                )}
              </p>
            </div>

            {/* Download Section */}
            <div className="flex flex-col gap-3">
              <div className="text-center">
                <h5 className="text-white font-semibold mb-2">Download Results</h5>
                <button
                  onClick={handleDownloadHighlightedPDF}
                  disabled={isDownloading}
                  className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto ${
                    isDownloading
                      ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-purple-500/25 hover:from-purple-600 hover:to-blue-600'
                  }`}
                  title="Download PDF with search results"
                >
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Download Search Results PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {searchResults.results.map((result, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(result.page)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  currentPage === result.page 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                    : 'bg-white/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50'
                }`}
              >
                Page {result.page} ({Math.round(result.score * 100)}%)
              </button>
            ))}
          </div>
          
          <div className="text-blue-300 text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Click on a page number to jump to that page and see the matches highlighted.
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer; 