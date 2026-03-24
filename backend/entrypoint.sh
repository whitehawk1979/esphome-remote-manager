#!/bin/bash
set -e

# Start Avahi daemon for mDNS discovery
if [ "${ENABLE_MDNS}" = "true" ]; then
    echo "Starting Avahi daemon for mDNS discovery..."
    
    # Create avahi service file
    cat > /etc/avahi/services/esphome-remote-manager.service << 'EOF'
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">ESPHome Remote Manager</name>
  <service>
    <type>_http._tcp</type>
    <port>8000</port>
    <txt-record>name=ESPHome Remote Manager</txt-record>
    <txt-record>version=1.0</txt-record>
  </service>
</service-group>
EOF

    # Start avahi-daemon
    avahi-daemon &
    sleep 2
    echo "Avahi daemon started"
fi

# Start the application
echo "Starting ESPHome Remote Manager..."
exec python -m uvicorn app:app --host 0.0.0.0 --port 8000