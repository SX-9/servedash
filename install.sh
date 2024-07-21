#! /bin/bash

set -e

check_root() {
  if [ "$EUID" -ne 0 ]; then
    echo "Please run as root" >&2
    exit 1
  fi
}

install_files() {
  echo "Installing ServeDash files..."
  [ ! -d "./node_modules" ] && npm install
  [ ! -d "./build" ] && npx vite build
  [ ! -d "/opt/servedash" ] && mkdir -p $INSTALLATION_PATH
  rm -rf $INSTALLATION_PATH/*
  cp -r ./package.json ./package-lock.json ./node_modules ./build/* $INSTALLATION_PATH
}

install_services() {
  echo "Installing ServeDash services..."
  cp ./systemd/* /etc/systemd/system
}

setup_nginx() {
  echo "Setting up Nginx..."
  [ -f "/etc/nginx/nginx.conf" ] && mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.old
  cp ./nginx.conf /etc/nginx/nginx.conf
}

create_configuration() {
  echo "Creating configuration directory..."
  [ ! -d "$CONFIGURATION_PATH" ] && mkdir -p $CONFIGURATION_PATH
  if [[ ! -f "$CONFIGURATION_PATH/htpasswd" ]]; then
    echo -n "Enter a username: "
    read username
    htpasswd -c $CONFIGURATION_PATH/htpasswd $username
  fi
  cp -n ./config/* $CONFIGURATION_PATH
  touch $CONFIGURATION_PATH/config.yaml
  chmod 666 $CONFIGURATION_PATH/config.yaml
  chmod 644 $CONFIGURATION_PATH/htpasswd
}

start_services() {
  echo "Starting ServeDash services..."
  systemctl daemon-reload
  systemctl enable --now servedash.socket nginx
  systemctl restart nginx
}

main() {
  INSTALLATION_PATH="/opt/servedash"
  CONFIGURATION_PATH="/etc/servedash"

  check_root
  install_files
  install_services
  setup_nginx
  create_configuration
  start_services

  echo "Installation Complete!"
  echo "Files: /opt/servedash"
  echo "Service: servedash.socket"
  echo "Dashboard (nginx proxy): http://localhost:8197"
  echo "Login with your username and the password you set"
}

main