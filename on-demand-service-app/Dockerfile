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

# Run migrations (compiled) then start
CMD ["sh", "-c", "npm run migrate:js && npm start"]
