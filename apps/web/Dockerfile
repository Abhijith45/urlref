# ----------------------------------------------------
# Stage 1: Build & Bundle Frontend
# ----------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy monorepo manifests
COPY package*.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install monorepo dependencies
RUN npm ci

# Copy sources
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build shared contracts package then Vite frontend
RUN npm run build -w packages/shared
RUN npm run build -w apps/web

# ----------------------------------------------------
# Stage 2: Minimal High-Performance Nginx Runtime
# ----------------------------------------------------
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
