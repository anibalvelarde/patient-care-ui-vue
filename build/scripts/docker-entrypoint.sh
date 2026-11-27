#!/bin/sh
set -e

# Generate runtime config from environment variables
cat <<EOF > /usr/share/nginx/html/config.js
window.__APP_CONFIG__ = {
  apiBaseUrl: "${VITE_API_BASE_URL:-http://localhost:5245}"
};
EOF

echo "Runtime config generated (API: ${VITE_API_BASE_URL:-http://localhost:5245})"

# WP-51: the maintenance valve. /maintenance.json is proxied to the CloudFront copy so the single
# "Maintenance mode" GitHub Action covers K3s too. Set MAINTENANCE_FLAG_URL="" to disable (the
# location then always answers OFF). The URL is validated before it goes into nginx config.
MAINTENANCE_FLAG_URL="${MAINTENANCE_FLAG_URL-https://d26wxxuffdufr.cloudfront.net/maintenance.json}"
FLAG_CONF=/etc/nginx/maintenance-flag.conf
NO_CACHE='add_header Cache-Control "no-cache, no-store, must-revalidate" always;'

if [ -n "$MAINTENANCE_FLAG_URL" ] && \
   echo "$MAINTENANCE_FLAG_URL" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]+)?/[A-Za-z0-9._/-]*$'; then
  # Resolve per request through the pod's DNS server (a variable proxy_pass), so a DNS failure
  # never stops nginx from starting — it just yields a 502 for this one path (= OFF in the SPA).
  RESOLVER="$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)"
  case "$RESOLVER" in *:*) RESOLVER="[$RESOLVER]" ;; esac
  cat <<EOF > "$FLAG_CONF"
location = /maintenance.json {
    resolver ${RESOLVER:-8.8.8.8} valid=30s ipv6=off;
    resolver_timeout 3s;
    set \$maintenance_flag_url "$MAINTENANCE_FLAG_URL";
    proxy_pass \$maintenance_flag_url;
    proxy_ssl_server_name on;
    proxy_connect_timeout 3s;
    proxy_read_timeout 3s;
    proxy_send_timeout 3s;
    proxy_buffering off;
    proxy_hide_header Cache-Control;
    proxy_hide_header Set-Cookie;
    proxy_hide_header Expires;
    $NO_CACHE
}
EOF
  echo "Maintenance flag proxied from $MAINTENANCE_FLAG_URL (resolver ${RESOLVER:-8.8.8.8})"
else
  [ -n "$MAINTENANCE_FLAG_URL" ] && echo "WARNING: MAINTENANCE_FLAG_URL rejected (not a plain http(s) URL) — valve disabled"
  cat <<EOF > "$FLAG_CONF"
location = /maintenance.json {
    default_type application/json;
    $NO_CACHE
    return 200 '{"enabled":false}';
}
EOF
  echo "Maintenance flag disabled on this host"
fi

# Start nginx
exec nginx -g "daemon off;"
