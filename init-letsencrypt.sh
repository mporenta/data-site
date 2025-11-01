#!/bin/bash

set -e

echo "======================================"
echo "Let's Encrypt SSL Initialization"
echo "======================================"
echo ""

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found. Please create one from .env.example"
  exit 1
fi

# Configuration
domains=($DOMAIN)
rsa_key_size=4096
data_path="./certbot"
email=$EMAIL
staging=${STAGING:-0}

# Validate required variables
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Error: DOMAIN and EMAIL must be set in .env file"
  exit 1
fi

if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed.' >&2
  exit 1
fi

echo "Configuration:"
echo "  Domain: $DOMAIN"
echo "  Email: $EMAIL"
echo "  Staging: $staging"
echo ""

# Create directory structure
echo "### Creating directory structure..."
mkdir -p "$data_path/conf/live/$DOMAIN"
mkdir -p "$data_path/www"
echo ""

# Download recommended TLS parameters
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo "TLS parameters downloaded successfully"
  echo ""
fi

# Create dummy certificate for initial Nginx startup
echo "### Creating dummy certificate for $DOMAIN..."
path="/etc/letsencrypt/live/$DOMAIN"
mkdir -p "$data_path/conf/live/$DOMAIN"
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo "Dummy certificate created"
echo ""

# Start nginx with dummy certificate
echo "### Starting nginx..."
docker compose up --force-recreate -d nginx
echo "Nginx started"
echo ""

# Wait for nginx to start
echo "### Waiting for nginx to start..."
sleep 10

# Check if nginx is running
if ! docker compose ps nginx | grep -q "running"; then
  echo "Error: Nginx failed to start. Check logs with: docker compose logs nginx"
  exit 1
fi
echo "Nginx is running"
echo ""

# Delete dummy certificate
echo "### Deleting dummy certificate for $DOMAIN..."
docker compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$DOMAIN && \
  rm -Rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot
echo "Dummy certificate removed"
echo ""

# Request Let's Encrypt certificate
echo "### Requesting Let's Encrypt certificate for $DOMAIN..."
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

if [ $staging != "0" ]; then
  staging_arg="--staging"
  echo "Using staging environment (test certificates)"
else
  staging_arg=""
  echo "Using production environment (real certificates)"
fi
echo ""

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

if [ $? -eq 0 ]; then
  echo ""
  echo "### Certificate obtained successfully!"
  echo ""
else
  echo ""
  echo "Error: Certificate request failed. Check the output above for details."
  echo "Common issues:"
  echo "  - DNS not pointing to this server"
  echo "  - Port 80 not accessible from internet"
  echo "  - Domain validation failed"
  exit 1
fi

# Reload nginx with real certificate
echo "### Reloading nginx..."
docker compose exec nginx nginx -s reload
echo "Nginx reloaded"
echo ""

echo "======================================"
echo "SSL Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Start all services: docker compose up -d"
echo "  2. Check status: docker compose ps"
echo "  3. View logs: docker compose logs -f"
echo "  4. Access your site: https://$DOMAIN"
echo ""
echo "Certificate will be automatically renewed every 90 days."
echo ""
