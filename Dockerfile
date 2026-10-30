FROM node:20-bookworm-slim

WORKDIR /app

# Install native compilation dependencies for sqlite3 and ssh2
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install packages
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server.cjs"]

