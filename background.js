// Background script for SafeRead Chrome Extension
console.log('🚀 SafeRead Background Script Starting...');

const API_URL = 'http://localhost:8000/scanner/quick-analyze/';

// Enhanced logging function
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📋 SafeRead Background:`, message, data || '');
}

// Error logging function
function logError(message, error = null) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ SafeRead Background Error:`, message, error || '');
}

chrome.runtime.onInstalled.addListener(() => {
  log('Extension installed successfully');
});

chrome.runtime.onStartup.addListener(() => {
  log('Extension started');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('Received message:', request);
  
  if (request.action === 'analyzeDocument') {
    analyzeDocument(request.content, request.type)
      .then(result => {
        log('Analysis successful:', result);
        sendResponse(result);
      })
      .catch(error => {
        logError('Analysis failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
  
  sendResponse({ success: false, error: 'Unknown action' });
});

async function analyzeDocument(content, documentType) {
  log('Starting document analysis', { 
    contentLength: content.length, 
    type: documentType 
  });

  try {
    const requestBody = {
      content: content,
      document_type: documentType || 'legal'
    };

    log('Sending API request to:', API_URL);
    log('Request body:', requestBody);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    log('API response status:', response.status);
    log('API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      logError('API request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    log('API response data:', data);

    return {
      success: true,
      data: data
    };

  } catch (error) {
    logError('Document analysis error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to API server. Please ensure it\'s running on localhost:8000');
    }
    
    throw error;
  }
}

// Listen for tab updates to detect legal pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    log('Tab updated:', { tabId, url: tab.url });
    
    // Check if URL contains legal document indicators
    const legalIndicators = ['terms', 'privacy', 'legal', 'policy', 'agreement'];
    const hasLegalIndicator = legalIndicators.some(indicator => 
      tab.url.toLowerCase().includes(indicator)
    );
    
    if (hasLegalIndicator) {
      log('Legal document detected in URL:', tab.url);
      chrome.action.setBadgeText({
        tabId: tabId,
        text: '!'
      });
      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#ef4444'
      });
    }
  }
});

log('Background script loaded successfully');
