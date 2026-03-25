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
import logging
import threading
import queue
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from enum import Enum
import uuid

# Request models
class CompileRequest(BaseModel):
    yaml_file: Optional[str] = None


class UpdateRequest(BaseModel):
    yaml_file: Optional[str] = None
    update_type: Optional[str] = "ota"  # ota, download, manual


class UploadType(str, Enum):
    OTA = "ota"
    DOWNLOAD = "download"
    MANUAL = "manual"


# ESP Chip Types
ESP_CHIP_TYPES = [
    {"id": "esp32", "name": "ESP32", "platform": "ESP32", "boards": ["esp32dev", "esp32-c3-devkitc-02", "esp32-s2-devkitc-1", "esp32-s3-devkitc-2"]},
    {"id": "esp32-s2", "name": "ESP32-S2", "platform": "ESP32", "boards": ["esp32-s2-devkitc-1", "esp32-s2-saola-1"]},
    {"id": "esp32-s3", "name": "ESP32-S3", "platform": "ESP32", "boards": ["esp32-s3-devkitc-2", "esp32-s3-box-3", "seeed_xiao_esp32s3"]},
    {"id": "esp32-c3", "name": "ESP32-C3", "platform": "ESP32", "boards": ["esp32-c3-devkitc-02"]},
    {"id": "esp8266", "name": "ESP8266", "platform": "ESP8266", "boards": ["esp01_1m", "esp07", "esp12e", "nodemcu", "wemos_d1_mini"]},
]


# Logging
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

# WebSocket connections
websocket_connections: List[WebSocket] = []

# Task queue for background processes
task_queue = queue.Queue()


async def broadcast_log(task_id: str, log_line: str, log_type: str = "info"):
    """Broadcast log to all connected WebSocket clients"""
    message = json.dumps({
        "type": "log",
        "task_id": task_id,
        "log": log_line,
        "log_type": log_type,
        "timestamp": datetime.now().isoformat()
    })
    for ws in websocket_connections:
        try:
            await ws.send_text(message)
        except:
            pass


async def broadcast_progress(task_id: str, progress: int, status: str, message: str = ""):
    """Broadcast progress to all connected WebSocket clients"""
    message_json = json.dumps({
        "type": "progress",
        "task_id": task_id,
        "progress": progress,
        "status": status,
        "message": message,
        "timestamp": datetime.now().isoformat()
    })
    for ws in websocket_connections:
        try:
            await ws.send_text(message_json)
        except:
            pass


def run_compile_with_logs(task_id: str, device_name: str, yaml_file: str):
    """Run compile in background with real-time log streaming"""
    try:
        update_tasks[task_id]["status"] = "compiling"
        update_tasks[task_id]["progress"] = 0
        
        # Run esphome compile with real-time output
        process = subprocess.Popen(
            ["docker", "exec", "esphome", "esphome", "compile", yaml_file],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Stream output line by line
        for line in iter(process.stdout.readline, ''):
            if line:
                # Put log in queue for WebSocket broadcast
                task_queue.put(("log", task_id, line.strip(), "info"))
                
                # Update progress based on output
                if "Compiling" in line:
                    update_tasks[task_id]["progress"] = min(90, update_tasks[task_id]["progress"] + 5)
                elif "Successfully" in line:
                    update_tasks[task_id]["progress"] = 95
        
        process.wait()
        
        if process.returncode == 0:
            update_tasks[task_id]["status"] = "compiled"
            update_tasks[task_id]["progress"] = 100
            update_tasks[task_id]["result"] = "success"
            task_queue.put(("progress", task_id, 100, "compiled", "Compilation successful"))
        else:
            update_tasks[task_id]["status"] = "error"
            update_tasks[task_id]["result"] = "failed"
            task_queue.put(("progress", task_id, 0, "error", "Compilation failed"))
            
    except Exception as e:
        update_tasks[task_id]["status"] = "error"
        update_tasks[task_id]["result"] = str(e)
        task_queue.put(("progress", task_id, 0, "error", str(e)))


def run_upload_with_logs(task_id: str, device_name: str, yaml_file: str, upload_type: str = "ota"):
    """Run upload in background with real-time log streaming"""
    try:
        update_tasks[task_id]["status"] = "uploading"
        update_tasks[task_id]["progress"] = 0
        update_tasks[task_id]["upload_type"] = upload_type
        
        # Run esphome upload with real-time output
        cmd = ["docker", "exec", "esphome", "esphome", "upload", "--device", "OTA", yaml_file]
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Stream output line by line
        for line in iter(process.stdout.readline, ''):
            if line:
                task_queue.put(("log", task_id, line.strip(), "info"))
                
                # Update progress based on output
                if "Connecting" in line:
                    update_tasks[task_id]["progress"] = 20
                elif "Uploading" in line:
                    update_tasks[task_id]["progress"] = 50
                elif "Successfully" in line:
                    update_tasks[task_id]["progress"] = 95
        
        process.wait()
        
        if process.returncode == 0:
            update_tasks[task_id]["status"] = "uploaded"
            update_tasks[task_id]["progress"] = 100
            update_tasks[task_id]["result"] = "success"
            task_queue.put(("progress", task_id, 100, "uploaded", "Upload successful"))
        else:
            update_tasks[task_id]["status"] = "error"
            update_tasks[task_id]["result"] = "failed"
            task_queue.put(("progress", task_id, 0, "error", "Upload failed"))
            
    except Exception as e:
        update_tasks[task_id]["status"] = "error"
        update_tasks[task_id]["result"] = str(e)
        task_queue.put(("progress", task_id, 0, "error", str(e)))


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
        "timestamp": datetime.now().isoformat(),
        # Configuration info
        "esphome_api_url": ESPHOME_API_URL,
        "esphome_dashboard_url": ESPHOME_DASHBOARD_URL,
        "mqtt_broker": MQTT_BROKER,
        "mqtt_port": MQTT_PORT,
        "mqtt_user": MQTT_USER,
        "ha_url": HA_URL,
        "ha_mcp_url": HA_MCP_URL,
        "device_id": DEVICE_ID,
        "mqtt_discovery_enabled": ENABLE_MQTT_DISCOVERY
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
                        
                        # Update available if deployed_version < current_version (device firmware older than dashboard)
                        # deployed_version = device firmware version
                        # current_version = ESPHome Dashboard version
                        update_available = False
                        if deployed_version != "unknown" and current_version != "unknown":
                            try:
                                # Compare version strings like "2026.3.1" vs "2025.12.0"
                                deployed_parts = [int(x) for x in deployed_version.split('.')]
                                current_parts = [int(x) for x in current_version.split('.')]
                                # Pad to same length
                                max_len = max(len(deployed_parts), len(current_parts))
                                deployed_parts.extend([0] * (max_len - len(deployed_parts)))
                                current_parts.extend([0] * (max_len - len(current_parts)))
                                # Update available if deployed < current
                                update_available = deployed_parts < current_parts
                            except (ValueError, AttributeError):
                                # If version comparison fails, just check if different
                                update_available = deployed_version != current_version
                        
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


@app.get("/api/device/{device_name}")
async def get_device(device_name: str):
    """Get device details"""
    devices = await get_devices_from_dashboard()
    
    for device in devices:
        if device["name"] == device_name:
            # Get HA entities from state
            ha_entities = []
            for entity in state.get("ha_entities", []):
                if entity.get("device", "").lower() == device_name.lower():
                    ha_entities.append(entity)
            
            # Try to fetch HA entities via MCP if available
            try:
                ha_entities = await fetch_ha_entities_for_device(device_name, device.get("integrations", []))
            except Exception as e:
                logger.error(f"Failed to fetch HA entities: {e}")
            
            return {
                "success": True,
                "device": {
                    **device,
                    "ha_entities": ha_entities
                }
            }
    
    return {"success": False, "error": "Device not found", "device": None}


async def fetch_ha_entities_for_device(device_name: str, integrations: list) -> list:
    """Fetch Home Assistant entities for a device"""
    entities = []
    
    if not HA_MCP_URL:
        return entities
    
    try:
        # Search for entities matching device name
        async with aiohttp.ClientSession() as session:
            # Use MCP to search entities
            url = HA_MCP_URL
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "ha_search_entities",
                    "arguments": {"query": device_name}
                }
            }
            
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    # Parse MCP response
                    if "result" in data:
                        content = data["result"].get("content", [])
                        for item in content:
                            if item.get("type") == "text":
                                # Parse entities from text
                                text = item.get("text", "")
                                # Entity format: entity_id, friendly_name, state
                                for line in text.split("\n"):
                                    if line.strip() and device_name.lower() in line.lower():
                                        parts = line.split("|")
                                        if len(parts) >= 3:
                                            entities.append({
                                                "entity_id": parts[0].strip(),
                                                "friendly_name": parts[1].strip() if len(parts) > 1 else parts[0].strip(),
                                                "state": parts[2].strip() if len(parts) > 2 else "unknown",
                                                "domain": parts[0].strip().split(".")[0] if "." in parts[0] else "unknown"
                                            })
    except Exception as e:
        logger.error(f"Failed to fetch HA entities: {e}")
    
    return entities


@app.get("/api/yaml/{device_name}")
async def get_yaml(device_name: str):
    """Get YAML configuration for a device"""
    try:
        # Get YAML from ESPHome Dashboard edit endpoint
        auth = aiohttp.BasicAuth(ESPHOME_DASHBOARD_USER, ESPHOME_DASHBOARD_PASS)
        async with aiohttp.ClientSession(auth=auth) as session:
            url = f"{ESPHOME_DASHBOARD_URL}/edit?configuration={device_name}.yaml"
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    yaml_content = await response.text()
                    state["yaml_configs"][device_name] = yaml_content
                    return {
                        "success": True,
                        "device": device_name,
                        "yaml": yaml_content,
                        "length": len(yaml_content)
                    }
                else:
                    return {"success": False, "error": f"HTTP {response.status}", "device": device_name}
    except Exception as e:
        logger.error(f"Failed to get YAML for {device_name}: {e}")
        return {"success": False, "error": str(e), "device": device_name}


@app.post("/api/yaml/{device_name}")
async def save_yaml(device_name: str, yaml_data: dict):
    """Save YAML configuration for a device"""
    yaml_content = yaml_data.get("yaml", "")
    if not yaml_content:
        raise HTTPException(status_code=400, detail="YAML content required")
    
    try:
        # Save to ESPHome Dashboard edit endpoint
        auth = aiohttp.BasicAuth(ESPHOME_DASHBOARD_USER, ESPHOME_DASHBOARD_PASS)
        async with aiohttp.ClientSession(auth=auth) as session:
            url = f"{ESPHOME_DASHBOARD_URL}/edit?configuration={device_name}.yaml"
            async with session.post(url, data=yaml_content, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    state["yaml_configs"][device_name] = yaml_content
                    return {"success": True, "device": device_name, "message": "YAML saved successfully"}
                else:
                    text = await response.text()
                    return {"success": False, "error": f"HTTP {response.status}: {text}", "device": device_name}
    except Exception as e:
        logger.error(f"Failed to save YAML for {device_name}: {e}")
        return {"success": False, "error": str(e), "device": device_name}


@app.post("/api/compile/{device_name}")
async def compile_device(device_name: str, background_tasks: BackgroundTasks, request: Optional[CompileRequest] = None):
    """Compile device configuration using ESPHome CLI"""
    try:
        import subprocess
        
        # Get YAML file from request or from cached devices
        yaml_file = None
        if request and request.yaml_file:
            yaml_file = request.yaml_file
        elif state.get("devices"):
            # Use cached devices
            for device in state["devices"]:
                if device.get("name") == device_name:
                    yaml_file = device.get("configuration")
                    break
        
        if not yaml_file:
            # Try to get from devices one more time
            devices = await get_devices_from_dashboard()
            for device in devices:
                if device.get("name") == device_name:
                    yaml_file = device.get("configuration")
                    break
        
        if not yaml_file:
            yaml_file = f"{device_name}.yaml"
        
        final_yaml_file = yaml_file  # Capture for closure
        
        logger.info(f"Compiling {device_name} using {final_yaml_file}")
        
        # Trigger compile in background (ESPHome compile can take minutes)
        def run_compile():
            try:
                logger.info(f"Starting compile for {device_name}")
                # Run esphome compile in the ESPHome container
                result = subprocess.run(
                    ["docker", "exec", "esphome", "esphome", "compile", final_yaml_file],
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minutes timeout
                )
                logger.info(f"Compile result for {device_name}: returncode={result.returncode}")
                if result.returncode != 0:
                    logger.error(f"Compile error for {device_name}: {result.stderr}")
                else:
                    logger.info(f"Compile successful for {device_name}")
            except subprocess.TimeoutExpired:
                logger.error(f"Compile timeout for {device_name}")
            except Exception as e:
                logger.error(f"Compile exception for {device_name}: {e}")
        
        # Run in background
        background_tasks.add_task(run_compile)
        
        return {
            "success": True,
            "device": device_name,
            "yaml_file": final_yaml_file,
            "message": "Compile started",
            "status": "compiling"
        }
    except Exception as e:
        logger.error(f"Failed to compile {device_name}: {e}")
        return {"success": False, "error": str(e), "device": device_name}


@app.post("/api/update/{device_name}")
async def update_device(device_name: str, background_tasks: BackgroundTasks, request: Optional[UpdateRequest] = None):
    """Update/OTA device using ESPHome CLI"""
    try:
        import subprocess
        
        # Get YAML file and device address from request or from cached devices
        yaml_file = None
        device_addr = None
        if request and request.yaml_file:
            yaml_file = request.yaml_file
        elif state.get("devices"):
            # Use cached devices
            for device in state["devices"]:
                if device.get("name") == device_name:
                    yaml_file = device.get("configuration")
                    device_addr = device.get("address")  # Get device address for OTA
                    break
        
        if not yaml_file:
            # Try to get from devices one more time
            devices = await get_devices_from_dashboard()
            for device in devices:
                if device.get("name") == device_name:
                    yaml_file = device.get("configuration")
                    device_addr = device.get("address")
                    break
        
        if not yaml_file:
            yaml_file = f"{device_name}.yaml"
        
        if not device_addr:
            device_addr = f"{device_name}.local"  # Default mDNS address
        
        final_yaml_file = yaml_file  # Capture for closure
        final_device_addr = device_addr  # Capture for closure
        
        logger.info(f"Updating {device_name} at {final_device_addr} using {final_yaml_file}")
        
        def run_upload():
            try:
                logger.info(f"Starting update for {device_name}")
                # Run esphome upload with --device OTA to skip interactive prompt
                # OTA mode automatically resolves device address from mDNS/DNS/MQTT
                result = subprocess.run(
                    ["docker", "exec", "esphome", "esphome", "upload", 
                     "--device", "OTA", final_yaml_file],
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minutes timeout
                )
                logger.info(f"Upload result for {device_name}: returncode={result.returncode}")
                if result.returncode != 0:
                    logger.error(f"Upload error for {device_name}: {result.stderr}")
                else:
                    logger.info(f"Upload successful for {device_name}")
            except subprocess.TimeoutExpired:
                logger.error(f"Upload timeout for {device_name}")
            except Exception as e:
                logger.error(f"Upload exception for {device_name}: {e}")
        
        # Run in background
        background_tasks.add_task(run_upload)
        
        return {
            "success": True,
            "device": device_name,
            "yaml_file": final_yaml_file,
            "message": "Update started",
            "status": "updating"
        }
    except Exception as e:
        logger.error(f"Failed to update {device_name}: {e}")
        return {"success": False, "error": str(e), "device": device_name}


@app.get("/api/status/{device_name}")
async def get_status(device_name: str):
    """Get device status"""
    try:
        result = await call_esphome_api(f"/api/status/{device_name}")
        return result
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/logs/{device_name}")
async def get_logs(device_name: str):
    """Get device logs"""
    try:
        result = await call_esphome_api(f"/api/logs/{device_name}")
        return result
    except Exception as e:
        return {"error": str(e)}


def get_default_html():
    """Return default HTML page"""
    return """<!DOCTYPE html><html><head><title>ESPHome Remote Manager</title></head><body><h1>ESPHome Remote Manager</h1><p>Loading...</p><script>fetch('/api/devices').then(r=>r.json()).then(d=>document.body.innerHTML='<pre>'+JSON.stringify(d,null,2)+'</pre>');</script></body></html>"""


# ========== NEW API ENDPOINTS ==========

@app.get("/api/chips")
async def get_chip_types():
    """Get supported ESP chip types and boards"""
    return {"success": True, "chips": ESP_CHIP_TYPES}


@app.post("/api/compile/{device_name}/async")
async def compile_device_async(device_name: str, background_tasks: BackgroundTasks):
    """Start compile in background and return task ID"""
    try:
        # Get YAML file
        yaml_file = None
        devices = await get_devices_from_dashboard()
        for device in devices:
            if device.get("name") == device_name:
                yaml_file = device.get("configuration")
                break
        
        if not yaml_file:
            yaml_file = f"{device_name}.yaml"
        
        # Generate task ID
        task_id = str(uuid.uuid4())
        update_tasks[task_id] = {
            "device": device_name,
            "yaml_file": yaml_file,
            "status": "starting",
            "progress": 0,
            "result": None,
            "created": datetime.now().isoformat()
        }
        
        # Run compile in thread with logs
        thread = threading.Thread(
            target=run_compile_with_logs,
            args=(task_id, device_name, yaml_file)
        )
        thread.daemon = True
        thread.start()
        
        return {
            "success": True,
            "task_id": task_id,
            "device": device_name,
            "yaml_file": yaml_file,
            "message": "Compile started in background"
        }
    except Exception as e:
        logger.error(f"Failed to start compile for {device_name}: {e}")
        return {"success": False, "error": str(e)}


@app.post("/api/update/{device_name}/async")
async def update_device_async(device_name: str, background_tasks: BackgroundTasks, request: Optional[UpdateRequest] = None):
    """Start upload in background and return task ID"""
    try:
        # Get YAML file
        yaml_file = None
        devices = await get_devices_from_dashboard()
        for device in devices:
            if device.get("name") == device_name:
                yaml_file = device.get("configuration")
                break
        
        if not yaml_file:
            yaml_file = f"{device_name}.yaml"
        
        # Get upload type
        upload_type = request.upload_type if request and request.upload_type else "ota"
        
        # Generate task ID
        task_id = str(uuid.uuid4())
        update_tasks[task_id] = {
            "device": device_name,
            "yaml_file": yaml_file,
            "status": "starting",
            "progress": 0,
            "result": None,
            "upload_type": upload_type,
            "created": datetime.now().isoformat()
        }
        
        # Run upload in thread with logs
        thread = threading.Thread(
            target=run_upload_with_logs,
            args=(task_id, device_name, yaml_file, upload_type)
        )
        thread.daemon = True
        thread.start()
        
        return {
            "success": True,
            "task_id": task_id,
            "device": device_name,
            "yaml_file": yaml_file,
            "upload_type": upload_type,
            "message": "Upload started in background"
        }
    except Exception as e:
        logger.error(f"Failed to start update for {device_name}: {e}")
        return {"success": False, "error": str(e)}


@app.get("/api/task/{task_id}")
async def get_task_status(task_id: str):
    """Get status of a background task"""
    if task_id not in update_tasks:
        return {"success": False, "error": "Task not found"}
    
    task = update_tasks[task_id]
    return {
        "success": True,
        "task_id": task_id,
        "device": task.get("device"),
        "yaml_file": task.get("yaml_file"),
        "status": task.get("status"),
        "progress": task.get("progress", 0),
        "result": task.get("result"),
        "upload_type": task.get("upload_type"),
        "created": task.get("created")
    }


@app.get("/api/tasks")
async def list_tasks():
    """List all background tasks"""
    return {
        "success": True,
        "tasks": [
            {
                "task_id": task_id,
                "device": task.get("device"),
                "status": task.get("status"),
                "progress": task.get("progress", 0),
                "created": task.get("created")
            }
            for task_id, task in update_tasks.items()
        ]
    }


@app.delete("/api/task/{task_id}")
async def cancel_task(task_id: str):
    """Cancel a background task"""
    if task_id not in update_tasks:
        return {"success": False, "error": "Task not found"}
    
    # Mark task as cancelled
    update_tasks[task_id]["status"] = "cancelled"
    return {"success": True, "message": f"Task {task_id} cancelled"}


@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    """WebSocket for real-time log streaming"""
    await websocket.accept()
    websocket_connections.append(websocket)
    
    try:
        while True:
            # Keep connection alive and process messages
            data = await websocket.receive_text()
            
            # Handle ping/pong
            if data == "ping":
                await websocket.send_text("pong")
            else:
                # Echo back for testing
                await websocket.send_text(f"Received: {data}")
            
    except WebSocketDisconnect:
        if websocket in websocket_connections:
            websocket_connections.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if websocket in websocket_connections:
            websocket_connections.remove(websocket)


@app.get("/api/yaml/{device_name}")
async def get_yaml_config(device_name: str):
    """Get YAML configuration for a device"""
    try:
        # Get YAML file from ESPHome Dashboard
        result = await call_esphome_api(f"/edit?configuration={device_name}.yaml")
        return {"success": True, "yaml": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/yaml/{device_name}")
async def save_yaml_config(device_name: str, yaml_content: str):
    """Save YAML configuration for a device"""
    try:
        # Save YAML to ESPHome Dashboard
        result = await call_esphome_api(
            f"/edit?configuration={device_name}.yaml",
            method="POST",
            data={"content": yaml_content}
        )
        return {"success": True, "message": "YAML saved"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/download/{device_name}")
async def download_firmware(device_name: str):
    """Download compiled firmware for manual upload"""
    try:
        # Get firmware path
        firmware_path = f"/config/.esphome/build/{device_name}/{device_name}.bin"
        
        # Check if file exists in container
        result = subprocess.run(
            ["docker", "exec", "esphome", "test", "-f", firmware_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            return {"success": False, "error": "Firmware not found. Compile first."}
        
        # Stream firmware file
        subprocess.run(
            ["docker", "cp", f"esphome:{firmware_path}", f"/tmp/{device_name}.bin"],
            capture_output=True
        )
        
        return FileResponse(
            f"/tmp/{device_name}.bin",
            media_type="application/octet-stream",
            filename=f"{device_name}.bin"
        )
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/secrets")
async def get_secrets():
    """Get secrets.yaml content"""
    try:
        secrets_path = "/opt/esphome/secrets.yaml"
        
        # Read from ESPHome container
        result = subprocess.run(
            ["docker", "exec", "esphome", "cat", secrets_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            # Try alternate location
            result = subprocess.run(
                ["docker", "exec", "esphome", "cat", "/config/secrets.yaml"],
                capture_output=True,
                text=True
            )
        
        if result.returncode != 0:
            return {"success": False, "error": "secrets.yaml not found", "content": ""}
        
        return {"success": True, "content": result.stdout}
    except Exception as e:
        logger.error(f"Failed to get secrets: {e}")
        return {"success": False, "error": str(e), "content": ""}


@app.post("/api/secrets")
async def save_secrets(secrets_data: dict):
    """Save secrets.yaml content"""
    try:
        content = secrets_data.get("content", "")
        
        # Write to temp file
        temp_path = "/tmp/secrets.yaml"
        with open(temp_path, "w") as f:
            f.write(content)
        
        # Copy to ESPHome container
        subprocess.run(
            ["docker", "cp", temp_path, "esphome:/opt/esphome/secrets.yaml"],
            capture_output=True,
            check=True
        )
        
        # Also copy to alternate location
        subprocess.run(
            ["docker", "cp", temp_path, "esphome:/config/secrets.yaml"],
            capture_output=True
        )
        
        return {"success": True, "message": "Secrets saved successfully"}
    except Exception as e:
        logger.error(f"Failed to save secrets: {e}")
        return {"success": False, "error": str(e)}


@app.get("/api/secrets/keys")
async def get_secret_keys():
    """Get list of secret keys from secrets.yaml"""
    try:
        secrets_path = "/opt/esphome/secrets.yaml"
        
        result = subprocess.run(
            ["docker", "exec", "esphome", "cat", secrets_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            result = subprocess.run(
                ["docker", "exec", "esphome", "cat", "/config/secrets.yaml"],
                capture_output=True,
                text=True
            )
        
        if result.returncode != 0:
            return {"success": False, "keys": []}
        
        # Parse YAML keys
        import yaml
        try:
            secrets = yaml.safe_load(result.stdout) or {}
            keys = list(secrets.keys())
            return {"success": True, "keys": keys}
        except:
            # Fallback: extract keys with regex
            import re
            keys = re.findall(r'^(\w+):', result.stdout, re.MULTILINE)
            return {"success": True, "keys": keys}
    except Exception as e:
        logger.error(f"Failed to get secret keys: {e}")
        return {"success": False, "keys": []}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))