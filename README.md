# ESPHome Remote Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.1%2B-blue.svg)](https://www.home-assistant.io/)
[![ESPHome](https://img.shields.io/badge/ESPHome-2026.3.1-orange.svg)](https://esphome.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-green.svg)](https://hub.docker.com/)

Web interface for managing ESPHome devices on a remote server. Similar to ESPHome Update Manager, but designed to work with a remote ESPHome builder server.

## Features

- **Web UI**: Modern, responsive web interface for managing ESPHome devices
- **Remote Management**: Connect to ESPHome Remote Builder API
- **Device List**: View all ESPHome devices with status and version
- **Compile & Upload**: Compile and OTA upload firmware to devices
- **Update Log**: Real-time update progress and logs
- **Home Assistant Integration**: MQTT discovery for status monitoring
- **Docker Ready**: Easy deployment with Docker or Docker Compose

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Container                      │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │    Web UI        │  │        Backend API           │ │
│  │  (React/Vue)    │  │  (Python FastAPI/Flask)     │ │
│  │  Port: 8080     │  │  Port: 8000                  │ │
│  └────────┬────────┘  └──────────┬───────────────────┘ │
│           │                      │                       │
│           └──────────┬───────────┘                       │
│                      │                                   │
│  ┌───────────────────▼──────────────────────────────┐  │
│  │              MQTT Discovery Service                │  │
│  │              (Home Assistant integration)         │ │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
                          │ HTTP API
                          ▼
┌─────────────────────────────────────────────────────────┐
│              ESPHome Remote Builder API                 │
│              (192.168.1.64:7123)                        │
│              - /api/health                              │
│              - /api/devices                              │
│              - /api/compile/{device}                     │
│              - /api/upload/{device}                     │
└─────────────────────────────────────────────────────────┘
                          │
                          │ OTA
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 ESP Home Eszközök                       │
│  multisensor, adr1, esp-radar2, esp32-s3-wifi-auto...   │
└─────────────────────────────────────────────────────────┘
```

## Requirements

- Docker or Docker Compose
- ESPHome Remote Builder running on a remote server (LXC or Docker)
- MQTT broker (e.g., Home Assistant's Mosquitto)
- Network access to ESPHome devices

## Quick Start

### Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/whitehawk1979/esphome-remote-manager.git
cd esphome-remote-manager
```

2. Create configuration:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Run with Docker Compose:
```bash
docker-compose up -d
```

4. Open your browser:
```
http://YOUR_SERVER_IP:8080
```

### Docker Run

```bash
docker run -d \
  --name esphome-remote-manager \
  --restart unless-stopped \
  -p 8080:8000 \
  -e ESPHOME_API_URL=http://192.168.1.64:7123 \
  -e ESPHOME_API_USER=esphome \
  -e ESPHOME_API_PASS=esphome \
  -e MQTT_BROKER=192.168.1.43 \
  -e MQTT_USER=mqtt \
  -e MQTT_PASS=your_password \
  whitehawk1979/esphome-remote-manager:latest
```

### Manual Install

1. Install Python 3.11+ and pip

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Set environment variables:
```bash
export ESPHOME_API_URL=http://192.168.1.64:7123
export MQTT_BROKER=192.168.1.43
# ... etc
```

4. Run:
```bash
cd backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ESPHOME_API_URL` | http://192.168.1.64:7123 | ESPHome Remote Builder API URL |
| `ESPHOME_API_USER` | esphome | API username |
| `ESPHOME_API_PASS` | esphome | API password |
| `ESPHOME_DASHBOARD_URL` | http://192.168.1.64:6052 | ESPHome Dashboard URL |
| `MQTT_BROKER` | 192.168.1.43 | MQTT broker IP |
| `MQTT_PORT` | 1883 | MQTT broker port |
| `MQTT_USER` | mqtt | MQTT username |
| `MQTT_PASS` | (empty) | MQTT password |
| `DEVICE_NAME` | ESPHome Remote Manager | Display name in Home Assistant |
| `DEVICE_ID` | esphome_remote_manager | Unique identifier |
| `PORT` | 8000 | Server port |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web UI |
| `/api/health` | GET | Health check |
| `/api/devices` | GET | List all devices |
| `/api/device/{name}` | GET | Get device details |
| `/api/compile/{name}` | POST | Compile device |
| `/api/upload/{name}` | POST | Upload to device (OTA) |
| `/api/update/{name}` | POST | Compile and upload (full update) |
| `/api/status/{name}` | GET | Get update status |
| `/api/logs/{name}` | GET | Get device logs |

## Home Assistant Integration

The manager automatically publishes MQTT discovery topics for Home Assistant:

| Entity | Type | Description |
|--------|------|-------------|
| `sensor.esphome_remote_manager_status` | sensor | Status (idle/compiling/uploading) |
| `sensor.esphome_remote_manager_version` | sensor | ESPHome version |
| `sensor.esphome_remote_manager_device_count` | sensor | Number of devices |
| `binary_sensor.esphome_remote_manager_connected` | binary_sensor | API connection status |

## Screenshots

### Dashboard
![Dashboard](docs/dashboard.png)

### Device List
![Devices](docs/devices.png)

### Update Progress
![Update](docs/update.png)

## Development

### Project Structure

```
esphome-remote-manager/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── static/
│       └── index.html      # Web UI
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### Build Docker Image

```bash
docker build -t whitehawk1979/esphome-remote-manager:latest .
```

### Push to Docker Hub

```bash
docker login -u whitehawk1979
docker push whitehawk1979/esphome-remote-manager:latest
```

## Troubleshooting

### Cannot connect to ESPHome API

1. Check ESPHome Remote Builder is running:
```bash
curl -u esphome:esphome http://192.168.1.64:7123/api/health
```

2. Check network connectivity:
```bash
ping 192.168.1.64
```

### Devices not showing

1. Check ESPHome Dashboard:
```bash
curl -u admin:admin http://192.168.1.64:6052/devices
```

2. Verify ESPHome devices are configured

### MQTT discovery not working

1. Check MQTT broker connection:
```bash
mosquitto_sub -h 192.168.1.43 -p 1883 -u mqtt -P 'password' -t 'homeassistant/#' -C 5
```

2. Verify Home Assistant MQTT integration is configured

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Created by Morzsa (OpenClaw Assistant) for the ESPHome Home Assistant integration project.

## Related Projects

- [ESPHome Remote Builder MQTT Discovery](https://github.com/whitehawk1979/esphome-remote-builder-mqtt-discovery)
- [ESPHome](https://esphome.io/)
- [Home Assistant](https://www.home-assistant.io/)