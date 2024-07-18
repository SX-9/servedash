#! /bin/bash

set -e
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root" >&2
  exit 1
fi

INSTALLATION_PATH="/opt/servedash"
CONFIGURATION_PATH="/etc/servedash"

echo "Installing ServeDash files..."
[ ! -d "./build" ] && npx vite build
[ ! -d "/opt/servedash" ] && mkdir -p $INSTALLATION_PATH
rm -rf $INSTALLATION_PATH/*
cp -r ./package.json ./package-lock.json ./node_modules ./build/* $INSTALLATION_PATH

echo "Installing ServeDash services..."
sed -i "s|{{ installation_config_path }}|$CONFIGURATION_PATH|g" ./systemd/servedash.service
cp ./systemd/* /etc/systemd/system

echo "Setting up Nginx..."
[ -f "/etc/nginx/nginx.conf" ] && mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.old
cp ./nginx.conf /etc/nginx/nginx.conf

echo "Creating configuration directory..."
[ ! -d "$CONFIGURATION_PATH" ] && mkdir -p $CONFIGURATION_PATH
if [[ ! -f "$CONFIGURATION_PATH/htpasswd" ]]; then
  echo "Enter a username:"
  read username
  htpasswd -c $CONFIGURATION_PATH/htpasswd $username
fi

echo "Starting ServeDash services..."
systemctl daemon-reload
systemctl enable --now servedash.socket nginx
systemctl restart nginx

echo "Installation Complete!"
echo "Files: /opt/servedash"
echo "Service: servedash.socket"
echo "Dashboard (nginx proxy): http://localhost:8197"
echo "Login with your username and the password you set"