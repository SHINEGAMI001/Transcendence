FROM nginx:alpine

# Install openssl to generate self-signed certificates
RUN apk add --no-cache openssl

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed certificate for rarcade.io domain
RUN openssl req -x509 -newkey rsa:2048 -days 365 -nodes \
    -keyout /etc/nginx/ssl/rarcade.io.key \
    -out /etc/nginx/ssl/rarcade.io.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=rarcade.io"
