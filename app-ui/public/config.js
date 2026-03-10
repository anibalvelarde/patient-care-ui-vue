// Runtime config — overridden by Docker entrypoint in production.
// For local dev, update this file or use VITE_API_BASE_URL in a .env file.
window.__APP_CONFIG__ = {
  apiBaseUrl: "http://localhost:5245"
};
