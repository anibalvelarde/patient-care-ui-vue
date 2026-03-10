# ──────────────────────────────────────────────
# Stage 1: Build the Vue SPA
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

ARG BUILD_VERSION=0.0.0

WORKDIR /app

# Copy package manifests first for better layer caching
COPY app-ui/package.json app-ui/package-lock.json ./

RUN npm ci

# Copy the rest of the app source
COPY app-ui/ .

RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: Serve with Nginx
# ──────────────────────────────────────────────
FROM nginx:alpine

LABEL maintainer="anibalvelarde"
LABEL org.opencontainers.image.description="Neurocorp Patient Care UI (Vue SPA)"

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Custom nginx config for SPA routing
COPY build/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built assets from stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Entrypoint script generates runtime config.js from env vars
COPY build/scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
