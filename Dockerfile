# --- Build stage ---
    FROM node:20-alpine AS build
    WORKDIR /app
    
    # Copy package files
    COPY package*.json ./
    
    # Install all deps (including dev)
    RUN npm ci --no-audit --no-fund
    
    # Copy source
    COPY . .
    
    # Build frontend + server
    RUN npm run build
    
    # --- Production runtime stage ---
    FROM node:20-alpine AS runtime
    WORKDIR /app
    ENV NODE_ENV=production
    
    # Copy only runtime dependencies
    COPY package*.json ./
    RUN npm ci --omit=dev --no-audit --no-fund
    
    # Copy built files
    COPY --from=build /app/dist ./dist
    COPY --from=build /app/public ./public
    
    EXPOSE 5000
    CMD ["node", "dist/index.js"]
    