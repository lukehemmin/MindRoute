FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy project files
COPY . .

# Build for production
RUN npm run build

EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "start"]
