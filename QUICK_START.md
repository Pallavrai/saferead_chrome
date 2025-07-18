# SafeRead Chrome Extension - Quick Start Guide

## 🚀 Quick Installation & Testing

### Step 1: Install the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `saferead_chrome` folder
5. The SafeRead extension should now be installed

### Step 2: Start the Mock API Server
```bash
cd /Users/pallavrai/Documents/saferead_chrome
python3 mock_api_server.py
```

The server will start on `http://localhost:8000` and provide mock analysis responses.

### Step 3: Test the Extension

#### Option A: Use Test Files
1. Open `test_privacy_policy.html` or `test_terms_of_service.html` in Chrome
2. Click the SafeRead extension icon
3. The extension should detect the legal document
4. Click "Analyze" to see the mock analysis

#### Option B: Test on Real Websites
1. Visit websites with terms of service or privacy policies (e.g., google.com/policies/privacy/)
2. Click the SafeRead extension icon
3. The extension should detect and analyze the content

## 🎨 UI Features

### Dark/Light Theme
- Toggle between themes using the moon/sun icon in the header
- Theme preference is automatically saved

### Analysis Display
- **Summary**: Blue-bordered card with document overview
- **Risk Points**: Red-bordered items highlighting concerning clauses
- **Favorable Points**: Green-bordered items showing user-friendly terms
- **Counters**: Badge counters showing number of risk/favorable points

### Visual Indicators
- **Badge**: Red "!" appears on extension icon when legal documents are detected
- **Loading States**: Smooth loading animations during analysis
- **Error Handling**: Clear error messages with retry options

## 🔧 Customization

### Modify Detection Keywords
Edit `content.js` and modify the `legalKeywords` object:
```javascript
this.legalKeywords = {
  'terms': ['your', 'custom', 'keywords'],
  'privacy': ['privacy', 'data', 'cookies'],
  'legal': ['legal', 'agreement', 'license']
};
```

### Change API Endpoint
Edit `background.js` and modify the `API_URL`:
```javascript
const API_URL = 'http://your-api-server.com/analyze/';
```

### Customize UI Colors
The extension uses DaisyUI themes. You can modify the theme in `popup.html` or add custom CSS.

## 📱 Extension Features

### Automatic Detection
- Scans page URLs for legal document patterns
- Analyzes page content for legal keywords
- Checks page titles for legal terminology
- Updates extension badge when documents are found

### Smart Analysis
- Sends document content to API for analysis
- Categorizes documents by type (terms, privacy, legal, other)
- Extracts key risk and favorable points
- Provides concise summaries

### User Experience
- Non-intrusive background scanning
- Click-to-analyze interface
- Persistent theme settings
- Clear visual feedback

## 🔒 Privacy & Security

- No data sent to external servers (uses local API)
- Content only analyzed when user clicks "Analyze"
- All processing happens locally
- No tracking or analytics

## 🛠️ Development

### File Structure
```
saferead_chrome/
├── manifest.json      # Extension configuration
├── popup.html         # Main UI
├── popup.js           # UI logic
├── content.js         # Page scanning
├── background.js      # API communication
├── icons/             # Extension icons
├── test_*.html        # Test pages
└── mock_api_server.py # Development server
```

### Testing Changes
1. Make your changes to the files
2. Go to `chrome://extensions/`
3. Click refresh icon on SafeRead extension
4. Test your changes

## 🔍 Troubleshooting

**Extension not loading?**
- Check that Developer mode is enabled
- Ensure all files are in the correct location
- Check browser console for errors

**No documents detected?**
- Check if the page actually contains legal content
- Try the manual scan button
- Verify keywords in content.js match the page content

**Analysis fails?**
- Ensure mock API server is running on localhost:8000
- Check browser console for network errors
- Verify API server logs for request issues

**Icons not showing?**
- Generate PNG icons using the provided script
- Or create 16x16, 48x48, and 128x128 PNG files manually

## 📈 Next Steps

1. **Connect Real API**: Replace mock server with actual legal document analysis API
2. **Add More Document Types**: Extend detection for GDPR notices, cookie policies, etc.
3. **Improve Detection**: Add ML-based content classification
4. **Export Results**: Add features to save or share analysis results
5. **Multi-language Support**: Add support for non-English legal documents

## 🎯 Ready to Use!

Your SafeRead Chrome extension is now ready to help users understand legal documents on the web. The extension provides a clean, professional interface for analyzing terms of service, privacy policies, and other legal agreements with AI-powered insights.
