FROM node:18-alpine

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Set environment variable
ENV NODE_ENV=production

# Build the client application
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Go back to root and prepare server
WORKDIR /app
RUN mkdir -p dist/public
RUN cp -r client/dist/* dist/public/

# Expose port
EXPOSE 5000

# Start the simplified server
CMD ["node", "server/simple.js"]