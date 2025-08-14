# Single-stage production build
FROM node:20-alpine

WORKDIR /app

# Install dependencies (including Vite)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy and build
COPY . .
RUN npm run build

# Runtime setup
EXPOSE 5000
CMD ["node", "dist/index.js"]