# ================================
# OnWapp Painel - Frontend (Next.js)
# ================================
# Build: docker build -t onwapp-painel:latest .
# Run: docker run -p 3000:3000 onwapp-painel:latest

# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Remove local env file (use container env vars)
RUN rm -f .env.local

# Build Next.js app
RUN npm run build

# Stage 3: Runner (minimal)
FROM node:20-alpine AS runner

WORKDIR /app

# Set Node environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -D -u 1001 -G nodejs nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose frontend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Run with Node.js (Node 20+ has proper signal handling built-in)
CMD ["node", "server.js"]
