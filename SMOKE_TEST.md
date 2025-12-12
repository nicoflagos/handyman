# End-to-End Smoke Test Guide

This guide walks through running a quick smoke test of the full-stack app (client + backend + MongoDB).

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and npm (for client dev test)
- Git

## Option A: Full Docker Compose Test (Recommended)

1. **Create `docker-compose.test.yml` at the repo root:**

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:5
    ports:
      - '27017:27017'
    environment:
      MONGO_INITDB_DATABASE: on_demand_service

  app:
    build:
      context: .
      dockerfile: Dockerfile.full
    ports:
      - '3000:3000'
    environment:
      MONGO_URI: mongodb://mongo:27017/on_demand_service
      JWT_SECRET: test-secret-key
      PORT: 3000
      SERVE_STATIC: 'true'
    depends_on:
      - mongo
    healthcheck:
      test: [ 'CMD', 'curl', '-f', 'http://localhost:3000/health' ]
      interval: 10s
      timeout: 5s
      retries: 5
```

2. **Run the stack:**

```bash
docker-compose -f docker-compose.test.yml up --build
```

3. **Wait for health check to pass:**

```bash
# In another terminal, poll the health endpoint
while ! curl http://localhost:3000/health; do sleep 2; done
echo "Health check passed!"
```

## Option B: Manual Test with Docker Only

1. **Build the image:**

```bash
docker build -f Dockerfile.full -t on-demand-full:latest .
```

2. **Run MongoDB locally (if not containerized):**

```bash
# Using Docker
docker run -d --name mongo-test -p 27017:27017 mongo:5
```

3. **Run the app container:**

```bash
docker run -it \
  -e MONGO_URI='mongodb://host.docker.internal:27017/on_demand_service' \
  -e JWT_SECRET='test-secret' \
  -e PORT=3000 \
  -e SERVE_STATIC=true \
  -p 3000:3000 \
  on-demand-full:latest
```

4. **Test endpoints in another terminal:**

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test123!","username":"testuser"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Access frontend
open http://localhost:3000
# or
curl http://localhost:3000
```

## Option C: Local Dev Test (Backend + Client Separately)

### Backend

```bash
cd on-demand-service-app
npm install
npm run build

# Start MongoDB (if not running)
# docker run -d -p 27017:27017 mongo:5

# Run backend
MONGO_URI=mongodb://localhost:27017/on_demand_service npm start
```

### Client (in another terminal)

```bash
cd client
npm install
npm run dev
# Opens http://localhost:5173
```

### Test Flow

1. Backend health: `curl http://localhost:3000/health`
2. Navigate to http://localhost:5173
3. Click "Register" and create a user
4. Check MongoDB for the new user (hash should be visible)
5. Click "Login" and verify the JWT is stored in localStorage

## Cleanup

```bash
# Stop Docker Compose
docker-compose -f docker-compose.test.yml down

# Or stop containers
docker stop on-demand-full mongo-test
docker rm on-demand-full mongo-test
```

## Expected Results

✅ Health endpoint returns `{ "status": "ok" }`
✅ Register endpoint creates a hashed user in MongoDB
✅ Login endpoint returns a JWT token
✅ Client loads and can register/login
✅ Frontend is served by the backend at `http://localhost:3000`

## Troubleshooting

- **MongoDB connection refused:** Ensure MongoDB is running and `MONGO_URI` is correct.
- **JWT_SECRET not set:** Set `JWT_SECRET` env var.
- **Client not loading:** Ensure `SERVE_STATIC=true` and client/dist exists in backend.
- **Port already in use:** Change port or kill the process using 3000.

