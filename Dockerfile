FROM node:20-alpine AS builder

WORKDIR /app

COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN cd server && npm ci --only=production
RUN cd client && npm ci

COPY . .

RUN cd client && npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/*.js ./server/
COPY --from=builder /app/server/controllers ./server/controllers
COPY --from=builder /app/server/middleware ./server/middleware
COPY --from=builder /app/server/models ./server/models
COPY --from=builder /app/server/routes ./server/routes
COPY --from=builder /app/server/config ./server/config
COPY --from=builder /app/server/services ./server/services
COPY --from=builder /app/server/utils ./server/utils
COPY --from=builder /app/server/validators ./server/validators
COPY --from=builder /app/server/scripts ./server/scripts
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/.env.example ./server/.env.example
COPY --from=builder /app/.env.example ./.env.example

RUN mkdir -p uploads logs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["node", "server/server.production.js"]
