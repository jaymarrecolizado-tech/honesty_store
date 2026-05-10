# Build stage
FROM golang:1.21-alpine AS builder

# Install git and build dependencies
RUN apk add --no-cache git ca-certificates

# Clone PocketBase source
RUN git clone https://github.com/pocketbase/pocketbase.git /pocketbase
WORKDIR /pocketbase

# Build with MySQL driver
RUN go mod download
RUN CGO_ENABLED=1 go build \
    -tags="mysql" \
    -ldflags="-s -w" \
    -o /pb/pocketbase \
    ./core

# Runtime stage
FROM alpine:latest

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates tzdata

# Copy built binary
COPY --from=builder /pb/pocketbase /usr/local/bin/pocketbase

# Create non-root user
RUN addgroup -g 1001 -S pocketbase && \
    adduser -u 1001 -S pocketbase -G pocketbase

# Set permissions
RUN chmod +x /usr/local/bin/pocketbase

# Switch to non-root user
USER pocketbase

# Expose default port
EXPOSE 8090

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8090/api/health || exit 1

# Start PocketBase
CMD ["/usr/local/bin/pocketbase", "serve", "--http=0.0.0.0:8090"]