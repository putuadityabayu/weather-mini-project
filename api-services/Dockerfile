# --- STAGE 1: Builder ---
FROM node:20.18.0-alpine3.19 AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install all dependencies, including devDependencies, as TypeScript compilation is needed.
RUN npm ci

# Copy all source code.
COPY . .

# Build the TypeScript application.
RUN npm run build

# --- STAGE 2: Runner ---
FROM node:20.18.0-alpine3.19 AS runner

WORKDIR /app

# Copy only package.json and package-lock.json again.
COPY package.json ./
COPY package-lock.json ./

# Install only production dependencies.
RUN npm ci --omit=dev

# Copy the compiled application from the 'builder' stage.
COPY --from=builder /app/dist ./dist

# Expose the port that Express.js listens on.
EXPOSE 3000

# Command to run the application.
CMD ["node", "dist/src/app.js"]
