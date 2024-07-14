#! /bin/bash

set -e
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root" >&2
  exit 1
fi

echo "Installing ServeDash files..."
[ ! -d "./build" ] && npx vite build
[ ! -d "/opt/servedash" ] && mkdir /opt/servedash
rm -rf /opt/servedash/*
cp -r ./package.json ./package-lock.json ./node_modules ./build/* /opt/servedash

echo "Installing ServeDash service..."
cp ./systemd/* /etc/systemd/system
systemctl daemon-reload
systemctl enable --now servedash.socket

echo "Setting up Nginx..."
[ -f "/etc/nginx/nginx.conf" ] && mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.old
cp ./nginx.conf /etc/nginx/nginx.conf
[ -d "/etc/nginx/.htpasswd" ] && mv /etc/nginx/.htpasswd /etc/nginx/.htpasswd.old
echo "Enter a username:"
read username
htpasswd -c /etc/nginx/.htpasswd $username
systemctl restart nginx
systemctl enable nginx

echo "Installation Complete!"
echo "Files: /opt/servedash"
echo "Service: servedash.socket"
echo "Dashboard (nginx proxy): http://localhost:8197"
echo "Login with your username and the password you set"