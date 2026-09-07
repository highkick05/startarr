FROM node:20-alpine

WORKDIR /app

# Copy package management files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose the Vite port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]
