FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (uses lockfileVersion 3)
RUN npm ci

# Copy only the source needed to build/run (prevents copying host `node_modules`)
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

# Build TypeScript to JS
RUN npm run build

# Expose the application port
EXPOSE 3000

# Optionally run migrations before starting (set `RUN_MIGRATIONS=true`)
CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS\" = 'true' ]; then npm run migrate:js; fi; npm start"]
