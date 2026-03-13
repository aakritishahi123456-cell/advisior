FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build shared types first
RUN npm run build --workspace=packages/shared-types

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["npm", "start"]
