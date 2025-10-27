# Backend-only Dockerfile for Railway deployment
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy only server package files
COPY server/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy server source code
COPY server ./

# Create necessary directories
RUN mkdir -p uploads temp && chown -R appuser:nodejs uploads temp

# Switch to non-root user
USER appuser

# Expose port (Railway will override with $PORT)
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "index.js"]