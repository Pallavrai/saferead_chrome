#!/usr/bin/env python3
"""
Mock API server for testing SafeRead Chrome Extension
Run this with: python3 mock_api_server.py
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class MockAPIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        """Handle POST requests to /scanner/quick-analyze/"""
        if self.path == '/scanner/quick-analyze/':
            try:
                # Read request body
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                # Mock analysis based on document type
                response = self.generate_mock_analysis(data.get('document_type', 'legal'))
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
            except Exception as e:
                self.send_error(500, f'Server error: {str(e)}')
        else:
            self.send_error(404, 'Not Found')

    def generate_mock_analysis(self, document_type):
        """Generate mock analysis based on document type"""
        
        if document_type == 'privacy':
            return {
                "short_summary": "This Privacy Policy outlines how the company collects, uses, and protects user data, including personal information, usage analytics, and third-party sharing practices. The policy covers data security measures, user rights, and notification procedures for policy changes.",
                "risky_points": [
                    "The company reserves the right to share your personal information with trusted third parties without explicit consent for each sharing instance.",
                    "Data security measures are described as 'appropriate' but no specific security standards or certifications are mentioned.",
                    "The policy can be updated at any time with notification only via email or service announcement, potentially binding users to new terms without explicit consent."
                ],
                "favourable_points": [
                    "Users have the right to access, update, or delete their personal information upon request.",
                    "The company does not sell personal information to third parties for commercial purposes.",
                    "Users can opt out of marketing communications at any time through a simple process."
                ]
            }
        elif document_type == 'terms':
            return {
                "short_summary": "The Terms of Service establish the legal framework for using the company's services, covering user licenses, prohibited activities, liability limitations, account termination policies, and dispute resolution procedures. The agreement emphasizes the company's broad discretionary powers.",
                "risky_points": [
                    "The company can terminate your account at any time for any reason without prior notice or explanation.",
                    "The service is provided 'as is' with no warranties, and the company disclaims liability for damages including data loss or business interruption.",
                    "Users grant the company broad rights to use, modify, and distribute any content they submit through the service."
                ],
                "favourable_points": [
                    "Users retain ownership of their original content while granting necessary licenses for service operation.",
                    "The terms include clear guidelines on acceptable use, helping maintain a safe environment for all users.",
                    "A structured dispute resolution process is provided, offering some legal recourse for conflicts."
                ]
            }
        else:  # legal or other
            return {
                "short_summary": "This legal agreement establishes the binding terms between the user and the service provider, covering service usage, intellectual property rights, user obligations, and legal remedies. The document emphasizes compliance requirements and limitation of liability.",
                "risky_points": [
                    "The agreement includes broad indemnification clauses requiring users to defend the company against third-party claims arising from user activities.",
                    "Liability limitations are extensive, potentially leaving users with limited recourse for service failures or damages.",
                    "The agreement can be modified unilaterally by the company with minimal notice requirements."
                ],
                "favourable_points": [
                    "Clear explanation of user rights and responsibilities helps prevent misunderstandings.",
                    "The agreement includes provisions for data portability and account closure procedures.",
                    "Specific performance standards and service level expectations are outlined for transparency."
                ]
            }

    def log_message(self, format, *args):
        """Custom logging to make output cleaner"""
        print(f"[{self.address_string()}] {format % args}")

def run_server():
    server_address = ('localhost', 8000)
    httpd = HTTPServer(server_address, MockAPIHandler)
    print(f"Mock API server running on http://{server_address[0]}:{server_address[1]}")
    print("Endpoint available at: http://localhost:8000/scanner/quick-analyze/")
    print("Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
