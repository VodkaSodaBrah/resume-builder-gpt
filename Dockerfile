# Multi-stage build for Resume Builder GPT

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend and widget
RUN npm run build:all

# Stage 2: Build API
FROM node:20-alpine AS api-builder

WORKDIR /app/api

# Copy API package files
COPY api/package*.json ./

# Install dependencies
RUN npm ci

# Copy API source code
COPY api/ ./

# Build API (compile TypeScript)
RUN npm run build 2>/dev/null || npx tsc

# Stage 3: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install Azure Functions Core Tools
RUN apk add --no-cache curl && \
    npm install -g azure-functions-core-tools@4

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Copy API
COPY --from=api-builder /app/api ./api

# Install production API dependencies
WORKDIR /app/api
RUN npm ci --omit=dev

WORKDIR /app

# Expose ports
EXPOSE 3000 7071

# Start script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
