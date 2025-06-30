FROM node:18-alpine

# Install protobuf compiler
RUN apk add --no-cache protobuf

# Install yarn (skip if already exists)
RUN [ -x "$(command -v yarn)" ] || npm install -g yarn

WORKDIR /app

# Copy package files
COPY package*.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy source code
COPY . .

# Generate gRPC code (if proto files exist)
RUN if [ -d "proto" ]; then yarn grpc:generate; fi

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["yarn", "start"] 