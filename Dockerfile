
# Use Node.js as the base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build the React frontend
RUN npm run build

# Add backend dependencies
RUN npm install express cors

# Create data directory
RUN mkdir -p /data

# Expose port for the backend
EXPOSE 3000

# Start the Node.js server
CMD ["node", "server.js"]
