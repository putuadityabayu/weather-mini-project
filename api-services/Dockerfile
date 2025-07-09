# --- STAGE 1: Builder ---
FROM node:20.18.0-alpine3.19 AS builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY api-services/package.json ./api-services/package.json

RUN npm ci --workspace=api-services

COPY api-services ./api-services

WORKDIR /app/api-services

RUN npm run build:prod

# --- STAGE 2: Deps ---
FROM node:20.18.0-alpine3.19 AS deps

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY api-services/package.json ./api-services/package.json

RUN npm ci --omit=dev

# --- STAGE 3: Runner ---
FROM node:20.18.0-alpine3.19 AS runner

WORKDIR /app

COPY package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

WORKDIR /app/api-services

COPY api-services/package.json ./package.json
COPY --from=deps /app/api-services/node_modules ./node_modules
COPY --from=builder /app/api-services/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]