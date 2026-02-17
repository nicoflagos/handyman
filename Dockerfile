# Multi-stage Dockerfile to build client (Vite) and backend, then serve compiled backend + static client

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
RUN npm install
RUN npm audit fix --force || true
COPY on-demand-service-app/ .
# Copy built client into backend folder
COPY --from=client_builder /app/client/dist ./client/dist
# Build backend TS
RUN npm run build

# Final runtime image
FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=backend_builder /app/backend/package*.json ./
COPY --from=backend_builder /app/backend/dist ./dist
COPY --from=backend_builder /app/backend/node_modules ./node_modules
COPY --from=backend_builder /app/backend/client/dist ./client/dist
ENV SERVE_STATIC=true
EXPOSE 3000
CMD ["sh", "-c", "node dist/src/app.js"]

