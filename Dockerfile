FROM node:20-alpine

WORKDIR /app

COPY . .

# BAD PRACTICE AFTER MVP FIX IMMEDIATELY
# DANGEROUS
RUN npm ci --no-audit --no-fund

RUN npm run build

EXPOSE 5000
CMD ["node", "dist/index.js"]