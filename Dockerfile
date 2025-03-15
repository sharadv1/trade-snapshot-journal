
# Use Node.js as the base image
FROM node:18-alpine as builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build the React frontend
RUN npm run build

# Production image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install only production dependencies for the server
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Create data directory
RUN mkdir -p /data

# Expose port for the backend
EXPOSE 3000

# Start the Node.js server
CMD ["node", "server.js"]
