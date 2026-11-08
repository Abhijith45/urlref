# ----------------------------------------------------
# Stage 1: Build & Dependencies
# ----------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install build essentials for native addons (e.g. argon2)
RUN apk add --no-cache python3 make g++

# Copy root manifests and lockfiles
COPY package*.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies across all monorepo packages
RUN npm ci

# Copy full source trees
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate Prisma Client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build shared package then API
RUN npm run build -w packages/shared
RUN npm run build -w apps/api

# ----------------------------------------------------
# Stage 2: Minimal Production Runtime
# ----------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install dumb-init for proper signal handling (SIGTERM/SIGINT)
RUN apk add --no-cache dumb-init

# Copy root manifests
COPY package*.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy generated prisma client and built artifacts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Drop privileges to non-root node user
USER node

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/server.js"]
