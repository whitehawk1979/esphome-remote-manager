#!/usr/bin/env python3
"""
ESPHome Remote Manager - Backend API
A web interface for managing ESPHome devices on a remote server.
"""

import os
import json
import asyncio
import aiohttp
import subprocess
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

# Configuration
ESPHOME_API_URL = os.getenv("ESPHOME_API_URL", "http://192.168.1.64:7123")
ESPHOME_API_USER = os.getenv("ESPHOME_API_USER", "esphome")
ESPHOME_API_PASS = os.getenv("ESPHOME_API_PASS", "esphome")
ESPHOME_DASHBOARD_URL = os.getenv("ESPHOME_DASHBOARD_URL", "http://192.168.1.64:6052")
ESPHOME_DASHBOARD_USER = os.getenv("ESPHOME_DASHBOARD_USER", "admin")
ESPHOME_DASHBOARD_PASS = os.getenv("ESPHOME_DASHBOARD_PASS", "admin")

# Home Assistant Configuration
HA_URL = os.getenv("HA_URL", "http://192.168.1.43:8123")
HA_TOKEN = os.getenv("HA_TOKEN", "")
HA_MCP_URL = os.getenv("HA_MCP_URL", "http://192.168.1.43:9583/private_nr_13FoRaKqLSc5RTG_L3w")

# MQTT Configuration
MQTT_BROKER = os.getenv("MQTT_BROKER", "192.168.1.43")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER = os.getenv("MQTT_USER", "mqtt")
MQTT_PASS = os.getenv("MQTT_PASS", "")
DEVICE_NAME = os.getenv("DEVICE_NAME", "ESPHome Remote Manager")
DEVICE_ID = os.getenv("DEVICE_ID", "esphome_remote_manager")
ENABLE_MQTT_DISCOVERY = os.getenv("ENABLE_MQTT_DISCOVERY", "true").lower() == "true"

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI App
app = FastAPI(
    title="ESPHome Remote Manager",
    description="Web interface for managing ESPHome devices with Home Assistant integration",
    version="1.2.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# In-memory state
state = {
    "devices": [],
    "ha_entities": [],
    "yaml_configs": {},
    "last_update": None,
    "esphome_version": None,
    "update_status": "idle"
}

# Background task status
update_tasks: Dict[str, Dict[str, Any]] = {}


def publish_mqtt(topic: str, payload: str, retain: bool = True):
    """Publish to MQTT broker"""
    try:
        cmd = ["mosquitto_pub", "-h", MQTT_BROKER, "-p", str(MQTT_PORT)]
        if MQTT_USER:
            cmd.extend(["-u", MQTT_USER])
        if MQTT_PASS:
            cmd.extend(["-P", MQTT_PASS])
        if retain:
            cmd.append("-r")
        cmd.extend(["-t", topic, "-m", payload])
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode != 0:
            logger.error(f"MQTT publish failed: {result.stderr}")
            return False
        logger.info(f"MQTT published: {topic}")
        return True
    except Exception as e:
        logger.error(f"MQTT publish error: {e}")
        return False


def publish_mqtt_discovery():
    """Publish MQTT discovery topics for Home Assistant"""
    if not ENABLE_MQTT_DISCOVERY:
        return
    
    logger.info("Publishing MQTT discovery topics...")
    
    base_topic = f"homeassistant/sensor/{DEVICE_ID}"
    
    # Status sensor
    publish_mqtt(f"{base_topic}/status/config", json.dumps({
        "name": "Status",
        "unique_id": f"{DEVICE_ID}_status",
        "state_topic": f"{DEVICE_ID}/status",
        "icon": "mdi:chip",
        "device": {"identifiers": [DEVICE_ID], "name": DEVICE_NAME}
    }))
    
    # Version sensor
    publish_mqtt(f"{base_topic}/version/config", json.dumps({
        "name": "ESPHome Version",
        "unique_id": f"{DEVICE_ID}_version",
        "state_topic": f"{DEVICE_ID}/version",
        "icon": "mdi:numeric",
        "device": {"identifiers": [DEVICE_ID]}
    }))
    
    # Device count sensor
    publish_mqtt(f"{base_topic}/device_count/config", json.dumps({
        "name": "Device Count",
        "unique_id": f"{DEVICE_ID}_device_count",
        "state_topic": f"{DEVICE_ID}/device_count",
        "icon": "mdi:counter",
        "device": {"identifiers": [DEVICE_ID]}
    }))
    
    # Connected sensor
    publish_mqtt(f"homeassistant/binary_sensor/{DEVICE_ID}/connected/config", json.dumps({
        "name": "Connected",
        "unique_id": f"{DEVICE_ID}_connected",
        "state_topic": f"{DEVICE_ID}/connected",
        "payload_on": "online",
        "payload_off": "offline",
        "device_class": "connectivity",
        "device": {"identifiers": [DEVICE_ID]}
    }))
    
    # Publish initial state
    publish_mqtt(f"{DEVICE_ID}/connected", "online")
    
    logger.info("MQTT discovery published successfully")


@app.on_event("startup")
async def startup_event():
    """Run on startup"""
    if ENABLE_MQTT_DISCOVERY:
        publish_mqtt_discovery()


@app.get("/")
async def root():
    """Serve the main HTML page"""
    html_path = os.path.join(static_dir, "index.html")
    if os.path.exists(html_path):
        return FileResponse(html_path)
    return HTMLResponse(content=get_default_html())


@app.get("/api/health")
async def health():
    """Health check endpoint"""
    result = await call_esphome_api("/api/health")
    
    esphome_version = "unknown"
    if "esphome_version" in result:
        esphome_version = result["esphome_version"]
        if esphome_version.startswith("Version: "):
            esphome_version = esphome_version.replace("Version: ", "")
    
    state["esphome_version"] = esphome_version
    
    # Update MQTT state
    if ENABLE_MQTT_DISCOVERY:
        publish_mqtt(f"{DEVICE_ID}/status", "healthy" if "error" not in result else "error")
        publish_mqtt(f"{DEVICE_ID}/version", esphome_version)
    
    return {
        "status": "healthy" if "error" not in result else "error",
        "esphome_version": esphome_version,
        "agent_version": result.get("agent_version", "unknown"),
        "container_running": result.get("container_running", False),
        "timestamp": datetime.now().isoformat()
    }


async def call_esphome_api(endpoint: str, method: str = "GET", data: Optional[dict] = None) -> Dict[str, Any]:
    """Call ESPHome Remote Builder API"""
    url = f"{ESPHOME_API_URL}{endpoint}"
    auth = aiohttp.BasicAuth(ESPHOME_API_USER, ESPHOME_API_PASS)
    
    async with aiohttp.ClientSession(auth=auth) as session:
        try:
            timeout = aiohttp.ClientTimeout(total=30)
            if method == "GET":
                async with session.get(url, timeout=timeout) as response:
                    if response.status == 200:
                        return await response.json()
                    return {"error": f"HTTP {response.status}"}
            elif method == "POST":
                async with session.post(url, json=data, timeout=aiohttp.ClientTimeout(total=300)) as response:
                    if response.status == 200:
                        return await response.json()
                    return {"error": f"HTTP {response.status}"}
        except asyncio.TimeoutError:
            return {"error": "Timeout"}
        except Exception as e:
            logger.error(f"API call failed: {e}")
            return {"error": str(e)}


async def get_devices_from_dashboard() -> List[Dict[str, Any]]:
    """Get list of ESPHome devices from ESPHome Dashboard"""
    try:
        auth = aiohttp.BasicAuth(ESPHOME_DASHBOARD_USER, ESPHOME_DASHBOARD_PASS)
        async with aiohttp.ClientSession(auth=auth) as session:
            async with session.get(f"{ESPHOME_DASHBOARD_URL}/devices", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    devices = []
                    
                    for device in data.get("configured", []):
                        deployed_version = device.get("deployed_version", "unknown")
                        current_version = device.get("current_version", "unknown")
                        update_available = deployed_version != current_version if deployed_version != "unknown" and current_version != "unknown" else False
                        
                        devices.append({
                            "name": device.get("name", "unknown"),
                            "configuration": device.get("configuration", ""),
                            "platform": device.get("target_platform", "unknown"),
                            "deployed_version": deployed_version,
                            "current_version": current_version,
                            "address": device.get("address", ""),
                            "web_port": device.get("web_port", 80),
                            "status": "configured",
                            "integrations": device.get("loaded_integrations", []),
                            "update_available": update_available
                        })
                    
                    return devices
                return []
    except Exception as e:
        logger.error(f"Failed to get devices: {e}")
        return []


@app.get("/api/devices")
async def list_devices():
    """List all ESPHome devices"""
    devices = await get_devices_from_dashboard()
    
    # Update MQTT device count
    if ENABLE_MQTT_DISCOVERY:
        publish_mqtt(f"{DEVICE_ID}/device_count", str(len(devices)))
    
    state["devices"] = devices
    state["last_update"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "devices": devices,
        "count": len(devices),
        "esphome_version": state.get("esphome_version", "unknown"),
        "last_update": state.get("last_update")
    }


def get_default_html():
    """Return default HTML page"""
    return """<!DOCTYPE html><html><head><title>ESPHome Remote Manager</title></head><body><h1>ESPHome Remote Manager</h1><p>Loading...</p><script>fetch('/api/devices').then(r=>r.json()).then(d=>document.body.innerHTML='<pre>'+JSON.stringify(d,null,2)+'</pre>');</script></body></html>"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))