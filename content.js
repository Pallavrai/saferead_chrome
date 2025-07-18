// Content script with enhanced logging
console.log('🔍 SafeRead Content Script Loading...');

// Enhanced logging function
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📄 SafeRead Content:`, message, data || '');
}

function logError(message, error = null) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ SafeRead Content Error:`, message, error || '');
}

class LegalDocumentDetector {
  constructor() {
    this.legalKeywords = {
      'terms': ['terms of service', 'terms of use', 'user agreement', 'service agreement', 'terms and conditions'],
      'privacy': ['privacy policy', 'privacy notice', 'data protection', 'cookie policy', 'privacy statement'],
      'legal': ['legal agreement', 'license agreement', 'end user license', 'eula', 'legal notice', 'disclaimer']
    };
    
    this.init();
  }

  init() {
    log('Initializing legal document detector on:', window.location.href);
    
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        log('DOM loaded, starting detection');
        this.detectLegalDocuments();
      });
    } else {
      log('DOM already loaded, starting detection');
      this.detectLegalDocuments();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      log('Received message from popup:', request);
      
      if (request.action === 'getPageContent') {
        this.getPageContent()
          .then(result => {
            log('Sending page content response:', result);
            sendResponse(result);
          })
          .catch(error => {
            logError('Error getting page content:', error);
            sendResponse({ isLegalPage: false, error: error.message });
          });
        return true;
      }
      
      if (request.action === 'manualScan') {
        log('Manual scan requested');
        this.detectLegalDocuments();
        sendResponse({ success: true });
        return true;
      }
      
      sendResponse({ success: false, error: 'Unknown action' });
    });
  }

  async detectLegalDocuments() {
    try {
      log('Starting legal document detection');
      
      const url = window.location.href;
      const title = document.title;
      
      log('Page details:', { url, title });

      // Check URL for legal indicators
      const urlType = this.detectFromUrl(url);
      if (urlType) {
        log('Legal document detected from URL:', urlType);
        this.notifyLegalDocumentFound(urlType);
        return;
      }

      // Check page title
      const titleType = this.detectFromTitle(title);
      if (titleType) {
        log('Legal document detected from title:', titleType);
        this.notifyLegalDocumentFound(titleType);
        return;
      }

      // Check page content
      const contentType = this.detectFromContent();
      if (contentType) {
        log('Legal document detected from content:', contentType);
        this.notifyLegalDocumentFound(contentType);
        return;
      }

      log('No legal documents detected');
      this.notifyNoLegalDocument();
      
    } catch (error) {
      logError('Error in detectLegalDocuments:', error);
    }
  }

  detectFromUrl(url) {
    const urlLower = url.toLowerCase();
    
    for (const [type, keywords] of Object.entries(this.legalKeywords)) {
      for (const keyword of keywords) {
        if (urlLower.includes(keyword.replace(/\s+/g, '-')) || 
            urlLower.includes(keyword.replace(/\s+/g, '_')) ||
            urlLower.includes(keyword.replace(/\s+/g, ''))) {
          return type;
        }
      }
    }
    
    return null;
  }

  detectFromTitle(title) {
    const titleLower = title.toLowerCase();
    
    for (const [type, keywords] of Object.entries(this.legalKeywords)) {
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) {
          return type;
        }
      }
    }
    
    return null;
  }

  detectFromContent() {
    const content = document.body.innerText.toLowerCase();
    const contentSnippet = content.substring(0, 2000); // Check first 2000 chars
    
    log('Content snippet length:', contentSnippet.length);
    
    for (const [type, keywords] of Object.entries(this.legalKeywords)) {
      let matchCount = 0;
      for (const keyword of keywords) {
        if (contentSnippet.includes(keyword)) {
          matchCount++;
        }
      }
      
      // If we find multiple keywords of same type, it's likely a legal document
      if (matchCount >= 2) {
        log('Content match found:', { type, matchCount });
        return type;
      }
    }
    
    return null;
  }

  async getPageContent() {
    log('Getting page content for analysis');
    
    try {
      const url = window.location.href;
      const title = document.title;
      
      // Detect document type
      const type = this.detectFromUrl(url) || 
                  this.detectFromTitle(title) || 
                  this.detectFromContent();
      
      if (!type) {
        log('No legal document type detected');
        return { isLegalPage: false };
      }
      
      // Get page content
      const content = this.extractContent();
      
      log('Page content extracted:', {
        type,
        contentLength: content.length,
        url: url.substring(0, 100) + '...'
      });
      
      return {
        isLegalPage: true,
        type: type,
        content: content,
        url: url,
        title: title
      };
      
    } catch (error) {
      logError('Error getting page content:', error);
      throw error;
    }
  }

  extractContent() {
    // Try to find main content area
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.content',
      '.main-content',
      '.page-content',
      '.legal-content',
      '.terms-content',
      '.privacy-content'
    ];
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        log('Found content using selector:', selector);
        return element.innerText.trim();
      }
    }
    
    // Fallback to body content
    log('Using body content as fallback');
    return document.body.innerText.trim();
  }

  notifyLegalDocumentFound(type) {
    log('Notifying legal document found:', type);
    
    // Set blinking badge on extension icon
    chrome.runtime.sendMessage({
      action: 'setBadge',
      text: '!',
      color: '#ef4444'
    });
    
    // Send message to popup if it's open
    chrome.runtime.sendMessage({
      action: 'documentDetected',
      type: type,
      url: window.location.href
    });
  }

  notifyNoLegalDocument() {
    log('Notifying no legal document found');
    
    // Stop blinking badge
    chrome.runtime.sendMessage({
      action: 'stopBadge'
    });
    
    chrome.runtime.sendMessage({
      action: 'noDocumentFound'
    });
  }
}

// Initialize detector
try {
  const detector = new LegalDocumentDetector();
  log('Legal document detector initialized successfully');
} catch (error) {
  logError('Failed to initialize legal document detector:', error);
}
