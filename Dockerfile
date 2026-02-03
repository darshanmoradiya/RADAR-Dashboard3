# Frontend Dockerfile - Production Ready with Runtime ENV Support
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Set default build-time environment (will be overridden by docker-compose)
ARG VITE_BACKEND_URL=http://localhost:3001
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Install envsubst for runtime environment variable substitution
RUN apk add --no-cache gettext

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create startup script for runtime environment variable injection
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'echo "Injecting runtime environment variables..."' >> /docker-entrypoint.sh && \
    echo 'export VITE_BACKEND_URL="${VITE_BACKEND_URL:-http://localhost:3001}"' >> /docker-entrypoint.sh && \
    echo 'echo "VITE_BACKEND_URL=${VITE_BACKEND_URL}"' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx with environment variable support
ENTRYPOINT ["/docker-entrypoint.sh"]
