# Production Multi-Stage Dockerfile for JBIT Campus ERP Backend
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production Runner
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 8000

CMD ["node", "dist/src/main"]
