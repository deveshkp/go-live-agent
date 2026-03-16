# Multi-stage build for Go-live
# Stage 1: Build the frontend
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Include any local patches required by pnpm (e.g., patches/wouter@3.7.1.patch)
COPY patches ./patches

# Install pnpm via Corepack and install dependencies
# Corepack is included with Node 16+ and ensures the lockfile's package manager
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate \
  && apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    git \
    curl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && pnpm install --frozen-lockfile --unsafe-perm

# Copy source code
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY vite.config.ts tsconfig.json tsconfig.node.json ./

# Build the frontend
RUN pnpm run build
# Remove dev dependencies so we can copy only production modules to runtime
RUN pnpm prune --prod || true

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules

# Expose port (Cloud Run uses PORT env var, defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "dist/index.js"]
