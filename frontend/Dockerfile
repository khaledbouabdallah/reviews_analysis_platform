# Development stage - Use newer Node version
FROM node:20-alpine as development
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force
RUN npm ci

# Copy source code
COPY . .

# Expose development port
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM node:20-alpine as deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM node:20-alpine as builder
WORKDIR /app
ARG VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage
FROM node:20-alpine as production
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 viteuser
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
RUN npm install -g serve
RUN chown -R viteuser:nodejs /app
USER viteuser
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
