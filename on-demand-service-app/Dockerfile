# Full-stack Dockerfile (builds `client/` + backend, then serves static frontend from backend)

# Build client
FROM node:18 AS client_builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Build backend
FROM node:18 AS backend_builder
WORKDIR /app/backend
COPY on-demand-service-app/package*.json ./
RUN npm ci
COPY on-demand-service-app/ .
COPY --from=client_builder /app/client/dist ./client/dist
RUN npm run build

# Final runtime image
FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=backend_builder /app/backend/package*.json ./
COPY --from=backend_builder /app/backend/node_modules ./node_modules
COPY --from=backend_builder /app/backend/dist ./dist
COPY --from=backend_builder /app/backend/client/dist ./client/dist
ENV SERVE_STATIC=true
EXPOSE 3000

# Optionally run migrations before starting (set `RUN_MIGRATIONS=true`)
CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS\" = 'true' ]; then node dist/scripts/migrate.js; fi; node dist/src/app.js"]
