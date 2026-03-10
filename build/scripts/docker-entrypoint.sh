#!/bin/sh
set -e

# Generate runtime config from environment variables
cat <<EOF > /usr/share/nginx/html/config.js
window.__APP_CONFIG__ = {
  apiBaseUrl: "${VITE_API_BASE_URL:-http://localhost:5245}"
};
EOF

echo "Runtime config generated (API: ${VITE_API_BASE_URL:-http://localhost:5245})"

# Start nginx
exec nginx -g "daemon off;"
