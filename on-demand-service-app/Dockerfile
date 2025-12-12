FROM node:14

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Fix vulnerabilities
RUN npm audit fix --force || true

# Copy the rest of the application code
COPY . .

# Build TypeScript to JS
RUN npm run build

# Expose the application port
EXPOSE 3000

# Run migrations (compiled) then start
CMD ["sh", "-c", "npm run migrate:js && npm start"]