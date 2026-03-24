FROM python:3.11-slim

LABEL maintainer="Morzsa (OpenClaw Assistant)"
LABEL description="ESPHome Remote Manager - Web interface for managing ESPHome devices"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/whitehawk1979/esphome-remote-manager"

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    mosquitto-clients \
    avahi-daemon \
    avahi-utils \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY backend/app.py ./app.py
COPY backend/app/static ./static

# Copy entrypoint
COPY backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Environment variables
ENV ESPHOME_API_URL="http://192.168.1.64:7123"
ENV ESPHOME_API_USER="esphome"
ENV ESPHOME_API_PASS="esphome"
ENV ESPHOME_DASHBOARD_URL="http://192.168.1.64:6052"
ENV MQTT_BROKER="192.168.1.43"
ENV MQTT_PORT="1883"
ENV MQTT_USER="mqtt"
ENV MQTT_PASS=""
ENV DEVICE_NAME="ESPHome Remote Manager"
ENV DEVICE_ID="esphome_remote_manager"
ENV PORT="8000"
ENV ENABLE_MDNS="true"

# Expose port
EXPOSE 8000

# mDNS port for Avahi
EXPOSE 5353/udp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -s http://localhost:8000/api/health || exit 1

# Run
ENTRYPOINT ["/entrypoint.sh"]