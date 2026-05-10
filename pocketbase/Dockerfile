FROM alpine:latest

RUN apk add --no-cache \
    unzip \
    ca-certificates

# Download Pocketbase v0.20.7 (matches the JS SDK version in package.json)
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.20.7/pocketbase_0.20.7_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Expose the default port
EXPOSE 8090

# Start Pocketbase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--migrationsDir=/pb/pb_migrations"]