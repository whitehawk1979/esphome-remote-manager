# ESPHome Remote Manager

**Web-based remote management interface for ESPHome devices with MQTT discovery for Home Assistant.**

![ESPHome Remote Manager](https://img.shields.io/badge/ESPHome-Remote%20Manager-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-green)
![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Integration-orange)

## 🚀 Quick Install

### One-line Installation (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/whitehawk1979/esphome-remote-manager/master/install.sh | sudo bash
```

### Manual Installation

```bash
# Clone repository
git clone https://github.com/whitehawk1979/esphome-remote-manager.git
cd esphome-remote-manager

# Copy and edit configuration
cp .env.example .env
nano .env

# Start services
docker-compose up -d
```

## 📋 Features

| Feature | Description |
|---------|-------------|
| **ESPHome Dashboard** | Full ESPHome compilation and OTA updates |
| **Remote Management** | Web UI for managing ESPHome devices |
| **MQTT Discovery** | Automatic Home Assistant entity discovery |
| **YAML Editor** | Built-in editor with syntax highlighting |
| **Device Templates** | Quick-start templates for common sensors |
| **Status Monitoring** | Real-time device status and health |

## 🌐 Access Points

After installation:

| Service | URL |
|---------|-----|
| **ESPHome Dashboard** | `http://YOUR_IP:6052` |
| **Remote Manager** | `http://YOUR_IP:8082` |

Default credentials:
- ESPHome Dashboard: `admin` / `admin`
- Remote Manager: No authentication (configure reverse proxy for public access)

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MQTT_BROKER` | MQTT broker hostname | `192.168.1.43` |
| `MQTT_PORT` | MQTT broker port | `1883` |
| `MQTT_USER` | MQTT username | `mqtt` |
| `MQTT_PASS` | MQTT password | Required |
| `HA_URL` | Home Assistant URL | `http://192.168.1.43:8123` |
| `HA_MCP_URL` | Home Assistant MCP endpoint | Optional |
| `ENABLE_MQTT_DISCOVERY` | Enable MQTT discovery | `true` |
| `DEVICE_ID` | Device ID for MQTT | `esphome_remote_manager` |

### Edit Configuration

```bash
nano /opt/esphome-remote-manager/.env
systemctl restart esphome-remote-manager
```

## 🔧 Management Commands

```bash
# View logs
journalctl -u esphome-remote-manager -f

# Restart services
systemctl restart esphome-remote-manager

# Stop services
systemctl stop esphome-remote-manager

# Check status
systemctl status esphome-remote-manager
```

## 🏠 Home Assistant Integration

### MQTT Discovery

The Remote Manager automatically publishes discovery messages to MQTT:

- **4 default entities**: system_status, devices_count, last_update, connected_devices
- **Auto-discovery**: Home Assistant automatically creates entities
- **Topic**: `homeassistant/[domain]/esphome_remote_manager/[entity]/config`

### Enable ESPHome Integration

1. Home Assistant → Settings → Devices & Services
2. Add Integration → ESPHome
3. Enter ESPHome Dashboard URL: `http://YOUR_IP:6052`
4. Configure devices

## 📁 Directory Structure

```
/opt/esphome-remote-manager/
├── docker-compose.yml     # Docker Compose configuration
├── .env                   # Environment variables
├── .env.example           # Example configuration
└── install.sh             # Installation script
```

## 🔒 Security Notes

- **Default credentials**: Change default ESPHome Dashboard password
- **Reverse proxy**: Use nginx/Traefik for public access with HTTPS
- **Firewall**: Restrict port access (6052, 8082) to trusted IPs
- **MQTT credentials**: Use strong MQTT password

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs esphome
docker logs esphome-remote-manager

# Restart containers
docker-compose restart
```

### ESPHome devices not found

1. Ensure devices are on the same network
2. Check ESPHome Dashboard is accessible at `http://YOUR_IP:6052`
3. Verify devices are configured with `api:` component

### MQTT discovery not working

1. Verify MQTT broker is accessible
2. Check MQTT credentials in `.env`
3. Ensure Home Assistant MQTT integration is active

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit Pull Request

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/whitehawk1979/esphome-remote-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/whitehawk1979/esphome-remote-manager/discussions)

---

**Made with 🍞 by Morzsa**