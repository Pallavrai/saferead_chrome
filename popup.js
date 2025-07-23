// Popup script for SafeRead Chrome Extension
class SafeReadPopup {
  constructor() {
    this.currentTab = null;
    this.analysisData = null;
    this.documentType = null;
    this.documentContent = '';
    this.isDarkMode = false;
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.setupTheme();
    await this.getCurrentTab();
    await this.checkPageForLegalDocuments();
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Analyze button
    document.getElementById('analyze-btn').addEventListener('click', () => {
      this.analyzeDocument();
    });

    // Retry button
    document.getElementById('retry-btn').addEventListener('click', () => {
      this.analyzeDocument();
    });

    // Manual scan button
    document.getElementById('manual-scan-btn').addEventListener('click', () => {
      this.manualScan();
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'documentDetected') {
        this.handleDocumentDetected(request);
      } else if (request.action === 'noDocumentFound') {
        this.showNoDocuments();
      }
    });
  }

  async setupTheme() {
    // Load saved theme preference
    const result = await chrome.storage.local.get(['theme']);
    this.isDarkMode = result.theme === 'dark';
    this.updateThemeUI();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.updateThemeUI();
    chrome.storage.local.set({ theme: this.isDarkMode ? 'dark' : 'light' });
  }

  updateThemeUI() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (this.isDarkMode) {
      body.classList.add('dark');
      themeIcon.className = 'fas fa-sun';
    } else {
      body.classList.remove('dark');
      themeIcon.className = 'fas fa-moon';
    }
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tab;
  }

  async checkPageForLegalDocuments() {
    this.showLoading();
    
    try {
      // Check if we can communicate with the content script
      if (!this.currentTab || !this.currentTab.id) {
        throw new Error('No active tab found');
      }

      // Check if the URL is a chrome:// or extension:// page where content scripts can't run
      if (this.currentTab.url.startsWith('chrome://') || 
          this.currentTab.url.startsWith('chrome-extension://') ||
          this.currentTab.url.startsWith('edge://') ||
          this.currentTab.url.startsWith('about:')) {
        this.showNoDocuments();
        return;
      }

      // Try to inject content script if it's not already there
      await this.ensureContentScriptLoaded();

      // Send message to content script with timeout
      const response = await this.sendMessageWithTimeout(this.currentTab.id, {
        action: 'getPageContent'
      }, 5000); // 5 second timeout

      if (response && response.isLegalPage) {
        this.handleDocumentDetected(response);
      } else {
        this.showNoDocuments();
      }
    } catch (error) {
      console.error('Error checking page:', error);
      
      // Check if it's a connection error
      if (error.message.includes('Could not establish connection') || 
          error.message.includes('Receiving end does not exist')) {
        // Try to inject content script and retry
        try {
          await this.injectContentScript();
          // Wait a bit for the script to initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Retry the check
          await this.retryCheckPageForLegalDocuments();
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          this.showError('Unable to scan this page. Please refresh and try again.');
        }
      } else {
        this.showError('Failed to scan page. Please refresh and try again.');
      }
    }
  }

  async ensureContentScriptLoaded() {
    try {
      // Try to ping the content script
      await chrome.tabs.sendMessage(this.currentTab.id, { action: 'ping' });
    } catch (error) {
      // If ping fails, inject the content script
      await this.injectContentScript();
    }
  }

  async injectContentScript() {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        files: ['content.js']
      });
      console.log('Content script injected successfully');
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw new Error('Cannot inject content script on this page');
    }
  }

  async sendMessageWithTimeout(tabId, message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Message timeout'));
      }, timeout);

      chrome.tabs.sendMessage(tabId, message, (response) => {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  async retryCheckPageForLegalDocuments() {
    try {
      const response = await this.sendMessageWithTimeout(this.currentTab.id, {
        action: 'getPageContent'
      }, 3000);

      if (response && response.isLegalPage) {
        this.handleDocumentDetected(response);
      } else {
        this.showNoDocuments();
      }
    } catch (error) {
      throw new Error('Retry failed: ' + error.message);
    }
  }

  handleDocumentDetected(data) {
    this.documentType = data.type;
    this.documentContent = data.content;
    
    this.hideLoading();
    this.showDetectionResults(data.type);
  }

  showDetectionResults(type) {
    const typeMap = {
      'terms': 'Terms & Conditions',
      'privacy': 'Privacy Policy',
      'legal': 'Legal Agreement',
      'other': 'Other Document'
    };

    const detectionResults = document.getElementById('detection-results');
    detectionResults.classList.remove('hidden');
    detectionResults.classList.add('scale-in');
    
    document.getElementById('document-type').textContent = typeMap[type] || 'Legal Document';
    document.getElementById('no-documents').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
    
    this.updateStatus('Legal document detected', 'fas fa-check-circle', 'var(--success-color)');
  }

  async analyzeDocument() {
    if (!this.documentContent) {
      this.showError('No document content available for analysis');
      return;
    }

    this.showAnalyzing();

    try {
      // Send content to background script for API analysis
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeDocument',
        content: this.documentContent,
        type: this.documentType
      });

      if (response.success) {
        this.analysisData = response.data;
        this.showAnalysisResults();
      } else {
        this.showError(response.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      this.showError('Network error. Please check if the API server is running.');
    }
  }

  showAnalysisResults() {
    if (!this.analysisData) return;

    this.hideLoading();
    
    const analysisResults = document.getElementById('analysis-results');
    analysisResults.classList.remove('hidden');
    analysisResults.classList.add('fade-in');
    
    document.getElementById('error-state').classList.add('hidden');

    // Update summary
    document.getElementById('summary-text').textContent = this.analysisData.short_summary;

    // Update risk points
    this.renderRiskPoints();

    // Update favorable points
    this.renderFavorablePoints();

    this.updateStatus('Analysis complete', 'fas fa-check-circle', 'var(--success-color)');
  }

  renderRiskPoints() {
    const riskItems = document.getElementById('risk-items');
    const riskCount = document.getElementById('risk-count');
    
    riskItems.innerHTML = '';
    riskCount.textContent = this.analysisData.risky_points.length;

    this.analysisData.risky_points.forEach((point, index) => {
      const item = document.createElement('div');
      item.className = 'point-item risk-point';
      item.innerHTML = `
        <i class="fas fa-exclamation-triangle point-icon"></i>
        <p class="point-text">${point}</p>
      `;
      riskItems.appendChild(item);
    });
  }

  renderFavorablePoints() {
    const favorableItems = document.getElementById('favorable-items');
    const favorableCount = document.getElementById('favorable-count');
    
    favorableItems.innerHTML = '';
    favorableCount.textContent = this.analysisData.favourable_points.length;

    this.analysisData.favourable_points.forEach((point, index) => {
      const item = document.createElement('div');
      item.className = 'point-item favorable-point';
      item.innerHTML = `
        <i class="fas fa-check-circle point-icon"></i>
        <p class="point-text">${point}</p>
      `;
      favorableItems.appendChild(item);
    });
  }

  async manualScan() {
    this.showLoading();
    
    try {
      await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'manualScan'
      });
      
      // Re-check after manual scan
      setTimeout(() => {
        this.checkPageForLegalDocuments();
      }, 1000);
    } catch (error) {
      console.error('Manual scan error:', error);
      this.showError('Failed to perform manual scan');
    }
  }

  showLoading() {
    document.getElementById('loading-spinner').classList.remove('hidden');
    document.getElementById('status-icon').classList.add('hidden');
    document.getElementById('progress-bar').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading-spinner').classList.add('hidden');
    document.getElementById('status-icon').classList.remove('hidden');
    document.getElementById('progress-bar').classList.add('hidden');
  }

  showAnalyzing() {
    this.showLoading();
    this.updateStatus('Analyzing document...', 'fas fa-brain pulse', 'var(--primary-color)');
  }

  showNoDocuments() {
    this.hideLoading();
    
    const noDocuments = document.getElementById('no-documents');
    noDocuments.classList.remove('hidden');
    noDocuments.classList.add('fade-in');
    
    document.getElementById('detection-results').classList.add('hidden');
    document.getElementById('analysis-results').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
    
    this.updateStatus('No legal documents found', 'fas fa-info-circle', 'var(--info-color)');
  }

  showError(message) {
    this.hideLoading();
    
    const errorState = document.getElementById('error-state');
    errorState.classList.remove('hidden');
    errorState.classList.add('fade-in');
    
    document.getElementById('error-message').textContent = message;
    document.getElementById('detection-results').classList.add('hidden');
    document.getElementById('analysis-results').classList.add('hidden');
    document.getElementById('no-documents').classList.add('hidden');
    
    this.updateStatus('Error occurred', 'fas fa-exclamation-circle', 'var(--error-color)');
  }

  updateStatus(text, iconClass, color = 'var(--primary-color)') {
    const statusText = document.getElementById('status-text');
    const statusIcon = document.getElementById('status-icon');
    
    statusText.textContent = text;
    statusIcon.className = `${iconClass} status-icon`;
    statusIcon.style.color = color;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SafeReadPopup();
});
