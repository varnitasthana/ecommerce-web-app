FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the client
RUN npm run build --prefix client

# Production image, copy all the files and run the server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built client files
COPY --from=builder --chown=nodejs:nodejs /client/dist ./client/dist
# Copy server files
COPY --chown=nodejs:nodejs server ./server
COPY --chown=nodejs:nodejs package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Create uploads directory
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

EXPOSE 5000

ENV PORT 5000
ENV HOST 0.0.0.0

CMD ["node", "server/server.production.js"]
