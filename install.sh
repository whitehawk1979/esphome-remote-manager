#!/bin/bash

# ESPHome Remote Manager - Unified Installer
# ===========================================
# This script installs ESPHome Dashboard and ESPHome Remote Manager
# using Docker and docker-compose.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}  ESPHome Remote Manager - Installer${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_step() {
    echo -e "${BLUE}→ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    exit 1
fi

print_header

# Check Docker
print_step "Checking Docker..."
if ! command -v docker &> /dev/null; then
    print_info "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    print_success "Docker installed"
else
    print_success "Docker already installed"
fi

# Check docker-compose
print_step "Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_info "Docker Compose not found. Installing..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
else
    print_success "Docker Compose already installed"
fi

# Get installation directory
INSTALL_DIR="${1:-/opt/esphome-remote-manager}"
print_info "Installation directory: $INSTALL_DIR"

# Create directory
print_step "Creating installation directory..."
mkdir -p "$INSTALL_DIR"
print_success "Directory created"

# Download docker-compose.yml
print_step "Downloading docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml "$INSTALL_DIR/"
    print_success "docker-compose.yml copied from local"
else
    curl -fsSL "https://raw.githubusercontent.com/whitehawk1979/esphome-remote-manager/master/docker-compose.yml" -o "$INSTALL_DIR/docker-compose.yml"
    print_success "docker-compose.yml downloaded"
fi

# Download .env.example
print_step "Downloading .env.example..."
if [ -f ".env.example" ]; then
    cp .env.example "$INSTALL_DIR/"
    print_success ".env.example copied from local"
else
    curl -fsSL "https://raw.githubusercontent.com/whitehawk1979/esphome-remote-manager/master/.env.example" -o "$INSTALL_DIR/.env.example"
    print_success ".env.example downloaded"
fi

# Create .env file if not exists
if [ ! -f "$INSTALL_DIR/.env" ]; then
    print_step "Creating .env file..."
    cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
    
    # Ask for MQTT password if not set
    read -p "Enter MQTT password (default: 2009December16): " mqtt_pass
    mqtt_pass=${mqtt_pass:-2009December16}
    
    # Update .env with password
    sed -i "s/your_mqtt_password/$mqtt_pass/" "$INSTALL_DIR/.env"
    
    print_success ".env file created"
else
    print_info ".env file already exists, skipping"
fi

# Create systemd service
print_step "Creating systemd service..."
cat > /etc/systemd/system/esphome-remote-manager.service << EOF
[Unit]
Description=ESPHome Remote Manager
After=docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service created"

# Enable and start service
print_step "Enabling and starting service..."
systemctl daemon-reload
systemctl enable esphome-remote-manager.service
systemctl start esphome-remote-manager.service
print_success "Service started"

# Wait for services to start
print_step "Waiting for services to start..."
sleep 10

# Check status
print_step "Checking service status..."
if systemctl is-active --quiet esphome-remote-manager.service; then
    print_success "Service is running"
else
    print_error "Service failed to start"
    journalctl -u esphome-remote-manager.service -n 20
    exit 1
fi

# Get IP address
IP_ADDR=$(hostname -I | awk '{print $1}')
IP_ADDR=${IP_ADDR:-"your-server-ip"}

# Print success message
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}ESPHome Dashboard:${NC}"
echo -e "  URL: ${YELLOW}http://$IP_ADDR:6052${NC}"
echo ""
echo -e "${BLUE}ESPHome Remote Manager:${NC}"
echo -e "  URL: ${YELLOW}http://$IP_ADDR:8082${NC}"
echo ""
echo -e "${BLUE}Configuration:${NC}"
echo -e "  Config dir: ${YELLOW}$INSTALL_DIR${NC}"
echo -e "  Edit config: ${YELLOW}nano $INSTALL_DIR/.env${NC}"
echo ""
echo -e "${BLUE}Commands:${NC}"
echo -e "  View logs:   ${YELLOW}journalctl -u esphome-remote-manager -f${NC}"
echo -e "  Restart:     ${YELLOW}systemctl restart esphome-remote-manager${NC}"
echo -e "  Stop:        ${YELLOW}systemctl stop esphome-remote-manager${NC}"
echo -e "  Status:      ${YELLOW}systemctl status esphome-remote-manager${NC}"
echo ""
echo -e "${GREEN}Enjoy! 🍞${NC}"