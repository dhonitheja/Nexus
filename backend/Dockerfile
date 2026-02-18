
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go.mod first (go.sum will be generated)
COPY go.mod ./

# Download dependencies and generate go.sum
RUN go mod download || true

# Copy source
COPY . .

# Tidy and build
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o nexus-api .

# Run stage - use alpine for CA certs (needed for HTTPS calls)
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/nexus-api .
EXPOSE 8080
CMD ["./nexus-api"]
