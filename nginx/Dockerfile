FROM nginx:alpine

RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -newkey rsa:2048 -days 365 -nodes \
    -keyout /etc/nginx/ssl/ponghub.com.key \
    -out /etc/nginx/ssl/ponghub.com.crt
