# Use official Node.js image matching your engines field (Node 22)
FROM node:22

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the full app source code
COPY . .

# Create directories for file processing
RUN mkdir -p /app/public/upload && \
    chmod 755 /app/public/upload

# Expose the port your app runs on (according to your .env it's likely 3001)
EXPOSE 3001

# Start the app
CMD ["sh", "-c", "npm run migrate && npm run start"]
