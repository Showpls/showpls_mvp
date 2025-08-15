# runtime-only image (expects host ./dist present)
FROM node:20-alpine
WORKDIR /app

# only install prod deps for the server runtime
COPY package*.json ./
RUN npm ci --production --no-audit --no-fund

# copy only built artifacts (host build)
COPY dist /app/dist
COPY attached_assets /app/attached_assets

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "dist/index.js"]
