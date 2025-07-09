# --- STAGE 1: Builder ---
FROM node:20.18.0-alpine3.19 AS builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY email-worker/package.json ./email-worker/package.json

RUN npm ci --workspace=email-worker

COPY email-worker ./email-worker

WORKDIR /app/email-worker

RUN npm run build:prod

# --- STAGE 2: Deps ---
FROM node:20.18.0-alpine3.19 AS deps

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY email-worker/package.json ./email-worker/package.json

RUN npm ci --omit=dev --workspace=email-worker

# --- STAGE 3: Runner ---
FROM node:20.18.0-alpine3.19 AS runner

WORKDIR /app/email-worker

COPY email-worker/package.json ./package.json
COPY --from=deps /app/email-worker/node_modules ./node_modules
COPY --from=builder /app/email-worker/dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]