// Dynamically determine the API URL based on the environment

const hostname = window.location.hostname;
const port = window.location.port;

let API_BASE_URL;

// Check if running on localhost or a local network IP (development)
// We assume development runs on port 3000 (React default)
if (hostname === 'localhost' || hostname === '127.0.0.1' || port === '3000' || hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    // Local Development: Backend is expected to be on port 5001
    // Use the same protocol (http/https) and hostname
    API_BASE_URL = `${window.location.protocol}//${hostname}:5001/api`;
} else {
    // Production (Vercel): Use relative path
    API_BASE_URL = '/api';
}

export { API_BASE_URL };
