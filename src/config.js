// Dynamically determine the API URL based on the current hostname
const hostname = window.location.hostname;
const PORT = 5001; // The port your backend is running on

// If we are on localhost, use localhost. Otherwise use the IP.
// This assumes the backend is on the same device as the frontend host.
export const API_BASE_URL = `http://${hostname}:${PORT}/api`;
