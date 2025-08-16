# Development stage
FROM node:18-alpine as development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Expose development port
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM node:18-alpine as deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies with legacy peer deps
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Build stage
FROM node:18-alpine as builder
WORKDIR /app

# Add this line to accept the build argument
ARG NEXT_PUBLIC_API_URL

# Copy package files
COPY package*.json ./
# Install all dependencies (including devDependencies for build) with legacy peer deps
RUN npm ci --legacy-peer-deps
# Copy source code
COPY . .

# Set environment variable for Next.js build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine as production

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY package*.json ./

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
