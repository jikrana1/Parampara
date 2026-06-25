/**
 * Parses Markdown content safely into sanitized HTML.
 * Uses 'marked' for parsing and 'DOMPurify' for sanitization.
 *
 * @param {string} markdownText - The raw Markdown text to parse.
 * @param {boolean} inline - Whether to parse as inline markdown (no block elements).
 * @returns {string} The sanitized HTML string.
 */
function renderMarkdown(markdownText, inline = false) {
  if (!markdownText) return '';
  
  if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
    // Parse the markdown using 'marked' library
    const rawHtml = inline 
      ? marked.parseInline(markdownText) 
      : marked.parse(markdownText, { breaks: true });
    
    // Sanitize the resulting HTML using DOMPurify to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true }
    });
    
    return sanitizedHtml;
  } else {
    // Fallback if libraries are not loaded
    console.warn('Markdown parsing libraries (marked, DOMPurify) are not loaded.');
    // Simple fallback to escape HTML and preserve newlines
    if (typeof window.escapeHtml === 'function') {
      return inline ? window.escapeHtml(markdownText) : window.escapeHtml(markdownText).replace(/\n/g, '<br>');
    }
    // Very basic fallback
    return markdownText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// Ensure escapeHtml exists globally if it doesn't already
if (typeof window.escapeHtml !== 'function') {
  window.escapeHtml = function(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };
}
