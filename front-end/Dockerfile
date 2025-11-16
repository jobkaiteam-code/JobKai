# Multi-stage build for optimized production image

# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL=http://localhost:8000
ARG VITE_PUBLIC_FIREBASE_API_KEY
ARG VITE_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG VITE_PUBLIC_FIREBASE_PROJECT_ID
ARG VITE_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_PUBLIC_FIREBASE_APP_ID
ARG VITE_MEASUREMENT_ID
ARG VITE_VAPI_PUBLIC_KEY

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PUBLIC_FIREBASE_API_KEY=$VITE_PUBLIC_FIREBASE_API_KEY
ENV VITE_PUBLIC_FIREBASE_AUTH_DOMAIN=$VITE_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV VITE_PUBLIC_FIREBASE_PROJECT_ID=$VITE_PUBLIC_FIREBASE_PROJECT_ID
ENV VITE_PUBLIC_FIREBASE_STORAGE_BUCKET=$VITE_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_PUBLIC_FIREBASE_APP_ID=$VITE_PUBLIC_FIREBASE_APP_ID
ENV VITE_MEASUREMENT_ID=$VITE_MEASUREMENT_ID
ENV VITE_VAPI_PUBLIC_KEY=$VITE_VAPI_PUBLIC_KEY

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
