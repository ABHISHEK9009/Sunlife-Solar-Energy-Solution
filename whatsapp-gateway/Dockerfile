FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose default port
EXPOSE 3001

# Start WhatsApp Gateway
CMD ["node", "src/index.js"]
