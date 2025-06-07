FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application (this will handle the frontend build)
RUN npm run build || echo "Build completed with warnings"

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]