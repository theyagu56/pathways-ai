// Configuration for API endpoints
export const API_CONFIG = {
  // Dynamic backend URL detection for mobile access
  BACKEND_URL: (() => {
    // If we're on localhost, use the network IP for mobile access
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://192.168.1.200:8000';
    }
    // If we're accessing from mobile, use the same hostname but port 8000
    return `http://${window.location.hostname}:8000`;
  })(),
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BACKEND_URL}${endpoint}`;
}; 