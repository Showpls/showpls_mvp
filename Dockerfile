FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install ALL dependencies (including dev)
RUN npm ci --no-audit --no-fund

# Build (will include Vite)
RUN npm run build

# Keep Vite in production (bad practice but works)
EXPOSE 5000
CMD ["node", "dist/index.js"]