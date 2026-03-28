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
import yaml
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect, Request
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

# Full Platform and Board List (from ESPHome documentation)
ESP_PLATFORMS = {
    "ESP32": {
        "name": "ESP32",
        "description": "ESP32 series (including S2, S3, C3, C6, H2, P4)",
        "boards": [
            {"value": "esp32dev", "name": "ESP32 Dev Module"},
            {"value": "nodemcu-32s", "name": "NodeMCU-32S"},
            {"value": "esp32-cam", "name": "ESP32-CAM"},
            {"value": "ttgo-lora32", "name": "TTGO LoRa32"},
            {"value": "ttgo-t-beam", "name": "TTGO T-Beam"},
            {"value": "m5stack-core", "name": "M5Stack Core"},
            {"value": "m5stack-core2", "name": "M5Stack Core2"},
            {"value": "m5stick-c", "name": "M5Stick C"},
            {"value": "m5stick-c-plus", "name": "M5Stick C Plus"},
            {"value": "wemos_d1_mini32", "name": "Wemos D1 Mini32"},
            {"value": "lolin-d32", "name": "LOLIN D32"},
            {"value": "lolin-d32-pro", "name": "LOLIN D32 Pro"},
            {"value": "featheresp32", "name": "Adafruit Feather ESP32"},
            {"value": "firebeetle32", "name": "FireBeetle ESP32"},
            {"value": "esp32-poe-iso", "name": "ESP32 POE ISO"},
            {"value": "az-delivery-devkit-v4", "name": "AZ-Delivery DevKit V4"},
            {"value": "lilygo-t-display", "name": "LILYGO T-Display"},
            {"value": "lilygo-t-echo", "name": "LILYGO T-Echo"},
            {"value": "heltec_wifi_kit_32", "name": "Heltec WiFi Kit 32"},
            {"value": "heltec_wifi_lora_32", "name": "Heltec WiFi LoRa 32"},
            {"value": "heltec_wifi_lora_32_v2", "name": "Heltec WiFi LoRa 32 V2"},
            {"value": "heltec_wifi_lora_32_v3", "name": "Heltec WiFi LoRa 32 V3"},
        ]
    },
    "ESP32-S2": {
        "name": "ESP32-S2",
        "description": "ESP32-S2 series (USB native)",
        "boards": [
            {"value": "esp32-s2-saola-1", "name": "ESP32-S2-Saola-1"},
            {"value": "esp32-s2-kaluga-1", "name": "ESP32-S2-Kaluga-1"},
            {"value": "seeed_xiao_esp32s2", "name": "Seeed XIAO ESP32-S2"},
            {"value": "esp32s2usbcam", "name": "ESP32-S2 USB Camera"},
            {"value": "adafruit_feather_esp32s2", "name": "Adafruit Feather ESP32-S2"},
            {"value": "adafruit_esp32s2_tft_feather", "name": "Adafruit ESP32-S2 TFT Feather"},
            {"value": "lilygo_t_beamsupreme", "name": "LILYGO T-Beam Supreme"},
        ]
    },
    "ESP32-S3": {
        "name": "ESP32-S3",
        "description": "ESP32-S3 series (AI acceleration)",
        "boards": [
            {"value": "esp32-s3-devkitc-1", "name": "ESP32-S3-DevKitC-1"},
            {"value": "esp32-s3-box-3", "name": "ESP32-S3-Box-3"},
            {"value": "esp32-s3-box-lite", "name": "ESP32-S3-Box Lite"},
            {"value": "seeed_xiao_esp32s3", "name": "Seeed XIAO ESP32-S3"},
            {"value": "lilygo_t_display_s3", "name": "LILYGO T-Display S3"},
            {"value": "lilygo_t7_s3", "name": "LILYGO T7 S3"},
            {"value": "lilygo_t_camera_s3", "name": "LILYGO T-Camera S3"},
            {"value": "adafruit_feather_esp32s3", "name": "Adafruit Feather ESP32-S3"},
            {"value": "adafruit_esp32s3_tft_feather", "name": "Adafruit ESP32-S3 TFT Feather"},
            {"value": "heltec_wifi_kit_32_v3", "name": "Heltec WiFi Kit 32 V3"},
            {"value": "heltec_vision_master_e213", "name": "Heltec Vision Master E213"},
            {"value": "esp32-s3-eye", "name": "ESP32-S3 Eye"},
        ]
    },
    "ESP32-C3": {
        "name": "ESP32-C3",
        "description": "ESP32-C3 series (RISC-V, low cost)",
        "boards": [
            {"value": "esp32-c3-devkitc-02", "name": "ESP32-C3-DevKitC-02"},
            {"value": "esp32-c3-devkitm-1", "name": "ESP32-C3-DevKitM-1"},
            {"value": "seeed_xiao_esp32c3", "name": "Seeed XIAO ESP32-C3"},
            {"value": "lolin_c3_mini", "name": "LOLIN C3 Mini"},
            {"value": "heltec_wireless_tracker", "name": "Heltec Wireless Tracker"},
        ]
    },
    "ESP32-C6": {
        "name": "ESP32-C6",
        "description": "ESP32-C6 series (RISC-V, Zigbee)",
        "boards": [
            {"value": "esp32-c6-devkitc-1", "name": "ESP32-C6-DevKitC-1"},
            {"value": "esp32-c6-devkitm-1", "name": "ESP32-C6-DevKitM-1"},
            {"value": "seeed_xiao_esp32c6", "name": "Seeed XIAO ESP32-C6"},
            {"value": "lolin_c6_mini", "name": "LOLIN C6 Mini"},
        ]
    },
    "ESP32-H2": {
        "name": "ESP32-H2",
        "description": "ESP32-H2 series (RISC-V, Thread/Zigbee)",
        "boards": [
            {"value": "esp32-h2-devkitm-1", "name": "ESP32-H2-DevKitM-1"},
        ]
    },
    "ESP32-P4": {
        "name": "ESP32-P4",
        "description": "ESP32-P4 series (high performance)",
        "boards": [
            {"value": "esp32-p4-function-ev-board", "name": "ESP32-P4 Function EV Board"},
        ]
    },
    "ESP8266": {
        "name": "ESP8266",
        "description": "ESP8266 series (WiFi classic)",
        "boards": [
            {"value": "esp01_1m", "name": "ESP01 (1MB)"},
            {"value": "esp01", "name": "ESP01 (512KB)"},
            {"value": "esp07", "name": "ESP07"},
            {"value": "esp07s", "name": "ESP07S"},
            {"value": "esp12e", "name": "ESP12E"},
            {"value": "esp12s", "name": "ESP12S"},
            {"value": "nodemcu", "name": "NodeMCU"},
            {"value": "nodemcuv2", "name": "NodeMCU v2"},
            {"value": "wemos_d1_mini", "name": "Wemos D1 Mini"},
            {"value": "wemos_d1_mini_pro", "name": "Wemos D1 Mini Pro"},
            {"value": "wemos_d1_mini_lite", "name": "Wemos D1 Mini Lite"},
            {"value": "d1_mini", "name": "D1 Mini"},
            {"value": "d1", "name": "D1"},
            {"value": "d1_mini_pro", "name": "D1 Mini Pro"},
            {"value": "d1_mini_lite", "name": "D1 Mini Lite"},
            {"value": "lolin_d1_mini_pro", "name": "LOLIN D1 Mini Pro"},
            {"value": "gen4_4d", "name": "Gen4 4D"},
            {"value": "gen4_4d_pro", "name": "Gen4 4D Pro"},
            {"value": "oak", "name": "Oak"},
            {"value": "phoenix_v1", "name": "Phoenix v1"},
            {"value": "phoenix_v2", "name": "Phoenix v2"},
            {"value": "esp_wroom_02", "name": "ESP WROOM 02"},
            {"value": "esp_wroom_02_v2", "name": "ESP WROOM 02 v2"},
            {"value": "espduino", "name": "ESPduino"},
            {"value": "esp32_bridge", "name": "ESP32 Bridge"},
            {"value": "xinabox_cw01", "name": "XinaBox CW01"},
            {"value": "wifinfo", "name": "WifInfo"},
            {"value": "espectro32", "name": "ESPectro32"},
            {"value": "ea-iot-base-esp8266", "name": "EA IoT Base ESP8266"},
        ]
    },
    "RP2040": {
        "name": "RP2040",
        "description": "Raspberry Pi RP2040 (Pico)",
        "boards": [
            {"value": "pico", "name": "Raspberry Pi Pico"},
            {"value": "pico2", "name": "Raspberry Pi Pico 2"},
            {"value": "rpipicow", "name": "Raspberry Pi Pico W"},
            {"value": "rpipico2w", "name": "Raspberry Pi Pico 2 W"},
        ]
    },
    "BK7231N": {
        "name": "BK7231N",
        "description": "Beken BK7231N (Tuya)",
        "boards": [
            {"value": "generic-bk7231n-qfn32", "name": "Generic BK7231N QFN32"},
        ]
    },
    "BK7231T": {
        "name": "BK7231T",
        "description": "Beken BK7231T (Tuya)",
        "boards": [
            {"value": "generic-bk7231t-qfn32", "name": "Generic BK7231T QFN32"},
        ]
    },
    "RTL87xx": {
        "name": "RTL87xx",
        "description": "Realtek AmebaZ (RTL8710/RTL8711)",
        "boards": [
            {"value": "rtl8710dn", "name": "RTL8710DN"},
            {"value": "rtl8710bn", "name": "RTL8710BN"},
            {"value": "rtl8711am", "name": "RTL8711AM"},
        ]
    },
}


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

# Compile queue for sequential processing
compile_queue: queue.Queue = queue.Queue()
compile_current: Dict[str, Any] = {"task_id": None, "device_name": None, "status": "idle"}
compile_lock: threading.Lock = threading.Lock()

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


async def broadcast_progress(task_id: str, progress: int, status: str, message: str = "", device_name: str = ""):
    """Broadcast progress to all connected WebSocket clients"""
    # Try to get device_name from update_tasks if not provided
    if not device_name and task_id in update_tasks:
        device_name = update_tasks[task_id].get("device_name", "")
    
    message_json = json.dumps({
        "type": "progress",
        "task_id": task_id,
        "device_name": device_name,
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


async def task_queue_consumer():
    """Background task to consume queue and broadcast to WebSocket clients"""
    while True:
        try:
            # Non-blocking get with timeout
            try:
                item = task_queue.get(timeout=0.1)
                if item[0] == "log":
                    _, task_id, log_line, log_type = item
                    await broadcast_log(task_id, log_line, log_type)
                elif item[0] == "progress":
                    _, task_id, progress, status, message, device_name = item
                    await broadcast_progress(task_id, progress, status, message, device_name)
            except queue.Empty:
                pass
            await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Task queue consumer error: {e}")
            await asyncio.sleep(0.1)


@app.on_event("startup")
async def startup_event():
    """Start background tasks on startup"""
    asyncio.create_task(task_queue_consumer())


def compile_worker():
    """Background worker that processes compile queue sequentially"""
    while True:
        try:
            # Get next task from queue (blocking)
            task_data = compile_queue.get(timeout=1)
            if task_data is None:  # Shutdown signal
                break
            
            task_id = task_data["task_id"]
            device_name = task_data["device_name"]
            yaml_file = task_data["yaml_file"]
            
            # Check if task was cancelled before starting
            if task_id in update_tasks and update_tasks[task_id].get("status") == "cancelled":
                logger.info(f"Task {task_id} was cancelled, skipping")
                compile_queue.task_done()
                continue
            
            # Update current compile status
            with compile_lock:
                compile_current["task_id"] = task_id
                compile_current["device_name"] = device_name
                compile_current["status"] = "running"
            
            logger.info(f"Starting compile for {device_name} (task_id: {task_id})")
            
            # Run the compile
            run_compile_with_logs(task_id, device_name, yaml_file)
            
            # Mark task as done
            compile_queue.task_done()
            
            # Clear current compile status
            with compile_lock:
                compile_current["task_id"] = None
                compile_current["device_name"] = None
                compile_current["status"] = "idle"
            
            logger.info(f"Completed compile for {device_name}")
            
        except queue.Empty:
            continue
        except Exception as e:
            logger.error(f"Compile worker error: {e}")
            with compile_lock:
                compile_current["task_id"] = None
                compile_current["device_name"] = None
                compile_current["status"] = "idle"


# Start compile worker thread
compile_worker_thread = threading.Thread(target=compile_worker, daemon=True)
compile_worker_thread.start()


def run_compile_with_logs(task_id: str, device_name: str, yaml_file: str):
    """Run compile in background with real-time log streaming"""
    try:
        update_tasks[task_id]["status"] = "compiling"
        update_tasks[task_id]["progress"] = 0
        update_tasks[task_id]["device_name"] = device_name  # Store device name for WebSocket
        
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
                    task_queue.put(("progress", task_id, update_tasks[task_id]["progress"], "compiling", line.strip(), device_name))
                elif "Successfully" in line:
                    update_tasks[task_id]["progress"] = 95
        
        process.wait()
        
        if process.returncode == 0:
            update_tasks[task_id]["status"] = "compiled"
            update_tasks[task_id]["progress"] = 100
            update_tasks[task_id]["result"] = "success"
            task_queue.put(("progress", task_id, 100, "compiled", "Compilation successful", device_name))
        else:
            update_tasks[task_id]["status"] = "error"
            update_tasks[task_id]["result"] = "failed"
            task_queue.put(("progress", task_id, 0, "error", "Compilation failed", device_name))
            
    except Exception as e:
        update_tasks[task_id]["status"] = "error"
        update_tasks[task_id]["result"] = str(e)
        task_queue.put(("progress", task_id, 0, "error", str(e), device_name))


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
    # Try to get devices from ESPHome Dashboard to check connectivity
    try:
        devices = await get_devices_from_dashboard()
        esphome_running = True
        esphome_version = "unknown"
        
        # Get ESPHome version from first device if available
        if devices and len(devices) > 0:
            esphome_version = devices[0].get("current_version", "unknown")
        
        state["esphome_version"] = esphome_version
        
        # Load secrets for display
        secrets_data = await load_secrets_async()
        
        # Get relevant secret values
        wifi_ssid = secrets_data.get("wifi_ssid", "")
        wifi_password = secrets_data.get("wifi_password", "")
        web_password = secrets_data.get("web_password", "")
        api_encryption_key = secrets_data.get("api_encryption_key", "")
        
        # Use web_password as fallback for api/ota password if not explicitly defined
        api_password = secrets_data.get("api_password", web_password)
        ota_password = secrets_data.get("ota_password", web_password)
        
        # Update MQTT state
        if ENABLE_MQTT_DISCOVERY:
            publish_mqtt(f"{DEVICE_ID}/status", "healthy")
            publish_mqtt(f"{DEVICE_ID}/version", esphome_version)
        
        return {
            "status": "healthy",
            "esphome_version": esphome_version,
            "agent_version": "1.0.0",
            "container_running": True,
            "device_count": len(devices),
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
            "mqtt_discovery_enabled": ENABLE_MQTT_DISCOVERY,
            # Secrets info (for settings display)
            "wifi_ssid": wifi_ssid,
            "wifi_password": wifi_password,
            "api_password": api_password,
            "ota_password": ota_password,
            "api_encryption_key": api_encryption_key[:20] + "..." if len(api_encryption_key) > 20 else api_encryption_key
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "error",
            "error": str(e),
            "esphome_version": "unknown",
            "agent_version": "unknown",
            "container_running": False,
            "timestamp": datetime.now().isoformat(),
            "esphome_api_url": ESPHOME_API_URL,
            "esphome_dashboard_url": ESPHOME_DASHBOARD_URL,
            "mqtt_broker": MQTT_BROKER,
            "mqtt_port": MQTT_PORT,
            "mqtt_user": MQTT_USER,
            "ha_url": HA_URL,
            "ha_mcp_url": HA_MCP_URL,
            "device_id": DEVICE_ID,
            "mqtt_discovery_enabled": ENABLE_MQTT_DISCOVERY,
            # Secrets info (empty on error)
            "wifi_ssid": "",
            "wifi_password": "",
            "api_password": "",
            "ota_password": "",
            "api_encryption_key": ""
        }


async def load_secrets_async():
    """Load secrets.yaml content asynchronously"""
    try:
        secrets_path = "/opt/esphome/secrets.yaml"
        
        # Try primary location first
        result = subprocess.run(
            ["docker", "exec", "esphome", "cat", secrets_path],
            capture_output=True, text=True, timeout=5
        )
        
        if result.returncode == 0:
            secrets = yaml.safe_load(result.stdout) or {}
            return secrets
        
        # Try alternate location
        result = subprocess.run(
            ["docker", "exec", "esphome", "cat", "/config/secrets.yaml"],
            capture_output=True, text=True, timeout=5
        )
        
        if result.returncode == 0:
            secrets = yaml.safe_load(result.stdout) or {}
            return secrets
        
        return {}
    except Exception as e:
        logger.error(f"Failed to load secrets: {e}")
        return {}


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
    """List all ESPHome devices with HA online status and YAML-parsed platform/board"""
    devices = await get_devices_from_dashboard()
    
    # Normalize platform values (ESP32S3 -> ESP32, ESP32S2 -> ESP32, etc.)
    for device in devices:
        platform = device.get("platform", "unknown")
        if platform and platform.upper().startswith("ESP32"):
            device["platform"] = "ESP32"
        elif platform and platform.upper() == "ESP8266":
            device["platform"] = "ESP8266"
        elif platform and platform.upper() == "RP2040":
            device["platform"] = "RP2040"
        elif platform and platform.upper() == "HOST":
            device["platform"] = "HOST"
    
    # FAST PATH: Return devices immediately without waiting for HA data
    # HA data will be fetched separately via /api/device/{name} when needed
    for device in devices:
        device["ha_online"] = None
        device["ha_entities"] = []
        device["ha_firmware"] = None
        device["ha_ip"] = None
        
        # Fetch platform and board from YAML (always try to get board)
        try:
            yaml_response = await get_yaml_config(device["name"])
            if yaml_response.get("success") and yaml_response.get("yaml"):
                yaml_content = yaml_response["yaml"]
                import re
                
                # Extract platform (esp32, esp32-s2, esp32-s3, esp32-c3, esp8266, rp2040, host)
                if device.get("platform") is None or device.get("platform") == "unknown":
                    # Try esp32 variants first (esp32-s3, esp32-s2, esp32-c3, esp32)
                    platform_match = re.search(r'^(esp32(?:-s[23]|-c[36]|-h[24]|-p4)?|esp8266|rp2040|host):', yaml_content, re.MULTILINE | re.IGNORECASE)
                    if platform_match:
                        platform_raw = platform_match.group(1).lower()
                        # Normalize platform name
                        if platform_raw.startswith("esp32"):
                            device["platform"] = "ESP32"
                        elif platform_raw == "esp8266":
                            device["platform"] = "ESP8266"
                        elif platform_raw == "rp2040":
                            device["platform"] = "RP2040"
                        elif platform_raw == "host":
                            device["platform"] = "HOST"
                
                # Always try to extract board from YAML
                board_match = re.search(r'board:\s*([^\n\r]+)', yaml_content)
                if board_match:
                    device["board"] = board_match.group(1).strip()
                    
        except Exception as e:
            logger.debug(f"Failed to parse YAML for {device['name']}: {e}")
    
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
    """Get device details with YAML-parsed platform and board"""
    devices = await get_devices_from_dashboard()
    
    for device in devices:
        if device["name"] == device_name:
            # Get YAML config to extract platform and board
            platform = device.get("platform", "Unknown")
            board = device.get("board", "-")
            yaml_content = None
            
            try:
                yaml_response = await get_yaml_config(device_name)
                if yaml_response.get("success") and yaml_response.get("yaml"):
                    yaml_content = yaml_response["yaml"]
                    
                    # Extract platform from YAML (esp32, esp32-s3, esp8266, rp2040, host)
                    import re
                    
                    # Platform detection
                    platform_match = re.search(r'^(esp32(?:-s[23]|-c[36]|-h[24]|-p4)?|esp8266|rp2040|host):\s*$', yaml_content, re.MULTILINE | re.IGNORECASE)
                    if platform_match:
                        platform_raw = platform_match.group(1).lower()
                        if platform_raw.startswith("esp32-s3"):
                            platform = "ESP32-S3"
                        elif platform_raw.startswith("esp32-s2"):
                            platform = "ESP32-S2"
                        elif platform_raw.startswith("esp32-c3"):
                            platform = "ESP32-C3"
                        elif platform_raw.startswith("esp32"):
                            platform = "ESP32"
                        elif platform_raw == "esp8266":
                            platform = "ESP8266"
                        elif platform_raw == "rp2040":
                            platform = "RP2040"
                        elif platform_raw == "host":
                            platform = "HOST"
                    
                    # Board detection
                    board_match = re.search(r'board:\s*([^\n\r]+)', yaml_content)
                    if board_match:
                        board = board_match.group(1).strip()
                        # If board contains S3/C3/S2, update platform
                        board_lower = board.lower()
                        if 's3' in board_lower or '-s3' in board_lower:
                            platform = "ESP32-S3"
                        elif 's2' in board_lower or '-s2' in board_lower:
                            platform = "ESP32-S2"
                        elif 'c3' in board_lower or '-c3' in board_lower:
                            platform = "ESP32-C3"
                        elif 'c6' in board_lower or '-c6' in board_lower:
                            platform = "ESP32-C6"
                        elif 'h2' in board_lower or '-h2' in board_lower:
                            platform = "ESP32-H2"
                        elif 'h4' in board_lower or '-h4' in board_lower:
                            platform = "ESP32-H4"
                        
            except Exception as e:
                logger.debug(f"Failed to parse YAML for {device_name}: {e}")
            
            return {
                "success": True,
                "device": {
                    **device,
                    "platform": platform,
                    "board": board,
                    "yaml": yaml_content,
                    "ha_entities": []  # Fast return, HA entities loaded separately
                }
            }
    
    return {"success": False, "error": "Device not found", "device": None}


async def fetch_ha_entities_for_device(device_name: str, integrations: list) -> list:
    """Fetch Home Assistant entities for a device via MCP - only entities belonging to this device"""
    entities = []
    
    if not HA_MCP_URL:
        return entities
    
    try:
        async with aiohttp.ClientSession() as session:
            # First, try to get entities with exact device name match
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "ha_search_entities",
                    "arguments": {"query": device_name, "limit": 100}
                }
            }
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            }
            
            async with session.post(HA_MCP_URL, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=60)) as response:
                if response.status == 200:
                    text = await response.text()
                    # Parse SSE format - skip ping and empty lines
                    for line in text.split('\n'):
                        if line.startswith(':') or not line.strip():
                            continue  # Skip ping and empty lines
                        if line.startswith('data: '):
                            try:
                                data = json.loads(line[6:])
                                if 'result' in data and 'content' in data['result']:
                                    content = data['result']['content'][0]
                                    if 'text' in content:
                                        result = json.loads(content['text'])
                                        if result.get('data', {}).get('success') and result.get('data', {}).get('results', []):
                                            for ent in result.get('data', {}).get('results', []):
                                                entity_id = ent.get('entity_id', '')
                                                friendly_name = ent.get('friendly_name', entity_id)
                                                
                                                # Filter: Only include entities that belong to this device
                                                # Check if device name is in entity_id or friendly_name
                                                entity_lower = entity_id.lower()
                                                name_lower = device_name.lower().replace('-', '_').replace(' ', '_')
                                                
                                                # Match patterns: device_name_sensor, sensor.device_name_*, etc.
                                                is_device_entity = (
                                                    name_lower in entity_lower or
                                                    name_lower.replace('_', '') in entity_lower.replace('_', '') or
                                                    entity_lower.startswith(f"sensor.{name_lower}") or
                                                    entity_lower.startswith(f"binary_sensor.{name_lower}") or
                                                    entity_lower.startswith(f"switch.{name_lower}") or
                                                    entity_lower.startswith(f"light.{name_lower}") or
                                                    entity_lower.startswith(f"climate.{name_lower}") or
                                                    entity_lower.startswith(f"cover.{name_lower}") or
                                                    entity_lower.startswith(f"number.{name_lower}") or
                                                    entity_lower.startswith(f"select.{name_lower}") or
                                                    entity_lower.startswith(f"text.{name_lower}") or
                                                    entity_lower.startswith(f"button.{name_lower}") or
                                                    entity_lower.startswith(f"update.{name_lower}")
                                                )
                                                
                                                # Also check if integration matches
                                                if not is_device_entity and integrations:
                                                    for integration in integrations:
                                                        integration_lower = integration.lower().replace(' ', '_')
                                                        if integration_lower in entity_lower or integration_lower in friendly_name.lower():
                                                            is_device_entity = True
                                                            break
                                                
                                                if is_device_entity:
                                                    entities.append({
                                                        "entity_id": entity_id,
                                                        "friendly_name": friendly_name,
                                                        "state": ent.get('state', 'unknown'),
                                                        "domain": ent.get('domain', entity_id.split('.')[0] if '.' in entity_id else 'unknown')
                                                    })
                            except:
                                pass
    except Exception as e:
        logger.error(f"Failed to fetch HA entities for {device_name}: {e}")
    
    return entities


@app.get("/api/ha/devices")
async def get_ha_devices():
    """Get all ESPHome devices from Home Assistant with online status"""
    try:
        logger.info("Fetching HA devices via MCP...")
        async with aiohttp.ClientSession() as session:
            # Single query for all esphome entities
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "ha_search_entities",
                    "arguments": {"query": "esphome", "limit": 200}
                }
            }
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            }
            
            async with session.post(HA_MCP_URL, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=120)) as response:
                if response.status == 200:
                    text = await response.text()
                    logger.info(f"HA MCP response length: {len(text)} chars")
                    
                    # Parse SSE format
                    for line in text.split('\n'):
                        if line.startswith(':') or not line.strip():
                            continue
                        if line.startswith('data: '):
                            try:
                                data = json.loads(line[6:])
                                if 'result' in data and 'content' in data['result']:
                                    content = data['result']['content'][0]
                                    if 'text' in content:
                                        result = json.loads(content['text'])
                                        if result.get('data', {}).get('success'):
                                            entities = result.get('data', {}).get('results', [])
                                            logger.info(f"HA MCP returned {len(entities)} entities")
                                            
                                            # Group entities by device
                                            devices = {}
                                            for ent in entities:
                                                entity_id = ent.get('entity_id', '')
                                                friendly_name = ent.get('friendly_name', '')
                                                state = ent.get('state', '')
                                                domain = ent.get('domain', '')
                                                
                                                # Skip non-device entities
                                                if 'remote_manager' in entity_id or 'remote_builder' in entity_id:
                                                    continue
                                                
                                                # Extract device name from entity_id
                                                # e.g., "sensor.multisensor_multisensor_wifi_signal" -> "multisensor"
                                                # e.g., "light.adr1" -> "adr1"
                                                parts = entity_id.split('.')
                                                if len(parts) > 1:
                                                    entity_name = parts[1]
                                                    
                                                    # Determine device name
                                                    device_name = None
                                                    
                                                    # Known ESPHome device patterns
                                                    known_devices = [
                                                        'adr1', 'adr_1',
                                                        'esp_radar2', 'esp_radar',
                                                        'esp32_s3_box_3', 'esp32_s3box_3', 'esp32-s3box-3',
                                                        'esp32s3_poe_wifi', 'esp32s3-poe-wifi',
                                                        'multisensor',
                                                        'test_compile', 'test-compile'
                                                    ]
                                                    
                                                    # Try known device match first
                                                    for known in known_devices:
                                                        normalized_entity = entity_name.replace('_', '-')
                                                        normalized_known = known.replace('_', '-')
                                                        if normalized_known in normalized_entity or normalized_entity.startswith(normalized_known):
                                                            device_name = known.replace('-', '_')
                                                            break
                                                    
                                                    # Try device_device_entity pattern
                                                    if not device_name:
                                                        entity_parts = entity_name.split('_')
                                                        if len(entity_parts) >= 2 and entity_parts[0] == entity_parts[1]:
                                                            device_name = entity_parts[0]
                                                    
                                                    if device_name:
                                                        if device_name not in devices:
                                                            devices[device_name] = {
                                                                "name": device_name,
                                                                "friendly_name": friendly_name.split()[0] if friendly_name else device_name,
                                                                "entities": [],
                                                                "online": False,
                                                                "firmware_version": None,
                                                                "ip_address": None
                                                            }
                                                        
                                                        devices[device_name]["entities"].append({
                                                            "entity_id": entity_id,
                                                            "friendly_name": friendly_name,
                                                            "state": state,
                                                            "domain": domain
                                                        })
                                                        
                                                        # Check for online status
                                                        if 'connected' in entity_id or 'status' in entity_id:
                                                            if state in ['on', 'online', 'healthy']:
                                                                devices[device_name]["online"] = True
                                                        
                                                        # Check for firmware version
                                                        if 'version' in entity_id.lower() and 'esphome' not in entity_id.lower():
                                                            if state not in ['unknown', 'unavailable']:
                                                                devices[device_name]["firmware_version"] = state
                                                        
                                                        # Check for IP address
                                                        if 'ip' in entity_id.lower() and state not in ['unknown', 'unavailable']:
                                                            devices[device_name]["ip_address"] = state
                                            
                                            logger.info(f"Grouped into {len(devices)} devices")
                                            return {"success": True, "devices": list(devices.values())}
                            except Exception as e:
                                logger.error(f"Failed to parse HA response: {e}")
                                continue
    except asyncio.TimeoutError:
        logger.warning("HA devices fetch timed out")
    except Exception as e:
        logger.error(f"Failed to get HA devices: {e}", exc_info=True)
    
    return {"success": False, "error": "Failed to fetch HA devices", "devices": []}


# YAML endpoints moved to line 1154+ - using call_esphome_api helper


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


@app.get("/api/platforms")
async def get_platforms():
    """Get full list of supported platforms and boards"""
    return {"success": True, "platforms": ESP_PLATFORMS}


@app.get("/api/boards/{platform}")
async def get_boards_for_platform(platform: str):
    """Get boards for a specific platform"""
    platform_upper = platform.upper().replace("-", "_")
    # Handle both ESP32 and ESP32-S2, etc.
    if platform_upper.startswith("ESP32_"):
        platform_upper = platform_upper.replace("_", "-")
    
    if platform_upper in ESP_PLATFORMS:
        return {
            "success": True,
            "platform": platform_upper,
            "name": ESP_PLATFORMS[platform_upper]["name"],
            "description": ESP_PLATFORMS[platform_upper]["description"],
            "boards": ESP_PLATFORMS[platform_upper]["boards"]
        }
    
    # Try to find by name match
    for key, value in ESP_PLATFORMS.items():
        if value["name"].upper() == platform.upper():
            return {
                "success": True,
                "platform": key,
                "name": value["name"],
                "description": value["description"],
                "boards": value["boards"]
            }
    
    return {"success": False, "error": f"Platform '{platform}' not found"}


@app.get("/api/compile/queue")
async def get_compile_queue():
    """Get current compile queue status"""
    with compile_lock:
        current = compile_current.copy()
    
    # Get queued tasks
    queued_tasks = []
    for task_id, task_data in update_tasks.items():
        if task_data.get("status") == "queued":
            queued_tasks.append({
                "task_id": task_id,
                "device": task_data.get("device"),
                "yaml_file": task_data.get("yaml_file"),
                "created": task_data.get("created")
            })
    
    return {
        "current": current,
        "queue_length": compile_queue.qsize(),
        "queued_tasks": queued_tasks
    }


@app.post("/api/compile/{task_id}/cancel")
async def cancel_compile(task_id: str):
    """Cancel a running or queued compile task"""
    try:
        if task_id not in update_tasks:
            return {"success": False, "error": "Task not found"}
        
        task = update_tasks[task_id]
        current_status = task.get("status", "")
        
        # If task is queued, just mark as cancelled
        if current_status == "queued":
            task["status"] = "cancelled"
            task["result"] = "cancelled"
            logger.info(f"Cancelled queued task {task_id}")
            return {"success": True, "message": "Task cancelled"}
        
        # If task is compiling, try to kill the process
        if current_status == "compiling":
            task["status"] = "cancelled"
            task["result"] = "cancelled"
            
            # Try to kill the compile process
            try:
                # Find and kill the compile process
                subprocess.run(
                    ["docker", "exec", "esphome", "pkill", "-f", f"compile.*{task.get('yaml_file', '')}"],
                    capture_output=True,
                    timeout=5
                )
                logger.info(f"Killed compile process for task {task_id}")
            except Exception as e:
                logger.warning(f"Failed to kill compile process: {e}")
            
            # Broadcast cancellation
            await broadcast_progress(task_id, 0, "cancelled", "Compile cancelled by user", task.get("device_name", ""))
            
            return {"success": True, "message": "Compile cancelled"}
        
        return {"success": False, "error": f"Cannot cancel task in {current_status} state"}
    
    except Exception as e:
        logger.error(f"Failed to cancel compile: {e}")
        return {"success": False, "error": str(e)}


@app.post("/api/compile/{device_name}/async")
async def compile_device_async(device_name: str, background_tasks: BackgroundTasks):
    """Start compile in background and return task ID (queued for sequential processing)"""
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
            "status": "queued",
            "progress": 0,
            "result": None,
            "created": datetime.now().isoformat()
        }
        
        # Check queue position
        queue_position = compile_queue.qsize()
        if queue_position > 0:
            update_tasks[task_id]["queue_position"] = queue_position
            logger.info(f"Compile queued for {device_name} (task_id: {task_id}, position: {queue_position})")
        
        # Add to compile queue (will be processed sequentially)
        compile_queue.put({
            "task_id": task_id,
            "device_name": device_name,
            "yaml_file": yaml_file
        })
        
        return {
            "success": True,
            "task_id": task_id,
            "device": device_name,
            "yaml_file": yaml_file,
            "queue_position": queue_position,
            "message": "Compile queued for sequential processing"
        }
    except Exception as e:
        logger.error(f"Failed to queue compile for {device_name}: {e}")
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
        # Try to get YAML file from device state cache first
        yaml_file = f"{device_name}.yaml"
        
        # Check if device exists in state and has configuration
        for device in state.get("devices", []):
            if device.get("name") == device_name and device.get("configuration"):
                yaml_file = device["configuration"]
                break
        
        # Get YAML file from ESPHome Dashboard (returns plain text, not JSON)
        url = f"{ESPHOME_DASHBOARD_URL}/edit?configuration={yaml_file}"
        auth = aiohttp.BasicAuth(ESPHOME_DASHBOARD_USER, ESPHOME_DASHBOARD_PASS)
        
        async with aiohttp.ClientSession(auth=auth) as session:
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
async def save_yaml_config(device_name: str, request: Request):
    """Save YAML configuration for a device"""
    try:
        # Parse JSON body
        body = await request.json()
        yaml_content = body.get("yaml", "")
        
        if not yaml_content:
            return {"success": False, "error": "YAML content required"}
        
        # Save YAML to ESPHome Dashboard (form-encoded, not JSON)
        url = f"{ESPHOME_DASHBOARD_URL}/edit?configuration={device_name}.yaml"
        auth = aiohttp.BasicAuth(ESPHOME_DASHBOARD_USER, ESPHOME_DASHBOARD_PASS)
        
        async with aiohttp.ClientSession(auth=auth) as session:
            data = aiohttp.FormData()
            data.add_field('content', yaml_content)
            
            async with session.post(url, data=data, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    state["yaml_configs"][device_name] = yaml_content
                    return {"success": True, "device": device_name, "message": "YAML saved successfully"}
                else:
                    text = await response.text()
                    return {"success": False, "error": f"HTTP {response.status}: {text}", "device": device_name}
    except Exception as e:
        logger.error(f"Failed to save YAML for {device_name}: {e}")
        return {"success": False, "error": str(e), "device": device_name}


@app.delete("/api/yaml/{device_name}")
async def delete_device(device_name: str):
    """Delete a device configuration file"""
    try:
        # Delete from ESPHome Dashboard
        url = f"{ESPHOME_DASHBOARD_URL}/delete?configuration={device_name}.yaml"
        auth = aiohttp.BasicAuth(ESPHOME_API_USER, ESPHOME_API_PASS)
        
        async with aiohttp.ClientSession(auth=auth) as session:
            async with session.post(url) as response:
                if response.status == 200:
                    logger.info(f"Deleted device: {device_name}")
                    return {"success": True, "message": f"Device {device_name} deleted"}
                else:
                    text = await response.text()
                    return {"success": False, "error": f"HTTP {response.status}: {text}"}
    except Exception as e:
        logger.error(f"Failed to delete {device_name}: {e}")
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

@app.post("/api/validate/yaml")
async def validate_yaml(yaml_data: dict):
    """Validate YAML syntax and ESPHome configuration"""
    try:
        import yaml
        yaml_content = yaml_data.get("yaml", "")
        
        # Basic YAML syntax validation
        try:
            parsed = yaml.safe_load(yaml_content)
        except yaml.YAMLError as e:
            # Extract line number from Mark object
            line_num = None
            if hasattr(e, 'problem_mark') and e.problem_mark:
                line_num = e.problem_mark.line + 1  # Mark.line is 0-indexed
            return {
                "success": False,
                "valid": False,
                "error": f"YAML syntax error: {str(e)}",
                "line": line_num
            }
        
        # ESPHome-specific validation
        errors = []
        warnings = []
        
        if parsed:
            # Check for required fields
            if 'esphome' not in parsed:
                errors.append("Missing 'esphome' section")
            else:
                esphome = parsed['esphome']
                if 'name' not in esphome:
                    warnings.append("Missing 'name' in esphome section (will use default)")
            
            # Check for platform
            if 'esp32' not in parsed and 'esp8266' not in parsed and 'rp2040' not in parsed:
                errors.append("Missing platform configuration (esp32/esp8266/rp2040)")
            
            # Extract used pins for visualization
            used_pins = extract_pins_from_yaml(parsed)
            
            # Check for common issues
            if 'logger' in parsed:
                if parsed['logger'].get('level') == 'VERY_VERBOSE':
                    warnings.append("VERY_VERBOSE logging can slow down the device")
            
            # Check for WiFi credentials
            if 'wifi' in parsed:
                wifi = parsed['wifi']
                if 'ssid' not in wifi and 'networks' not in wifi:
                    warnings.append("WiFi configuration missing SSID")
            
            # Check for API/Web server
            if 'api' not in parsed and 'web_server' not in parsed:
                warnings.append("Consider adding 'api' or 'web_server' for Home Assistant integration")
        
        return {
            "success": True,
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "used_pins": used_pins,
            "components": list(parsed.keys()) if parsed else []
        }
        
    except Exception as e:
        logger.error(f"Failed to validate YAML: {e}")
        return {"success": False, "valid": False, "error": str(e)}


def extract_pins_from_yaml(parsed_yaml):
    """Extract used pins from YAML configuration"""
    used_pins = {
        "gpio": [],
        "i2c": [],
        "spi": [],
        "uart": [],
        "other": []
    }
    
    def extract_pins(obj, prefix=""):
        """Recursively extract pin configurations"""
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key in ["pin", "scl", "sda", "mosi", "miso", "clk", "cs", "tx", "rx"]:
                    if isinstance(value, (int, str)):
                        pin_type = key
                        if key in ["scl", "sda"]:
                            pin_type = "i2c"
                        elif key in ["mosi", "miso", "clk", "cs"]:
                            pin_type = "spi"
                        elif key in ["tx", "rx"]:
                            pin_type = "uart"
                        else:
                            pin_type = "gpio"
                        
                        used_pins[pin_type].append({
                            "pin": value,
                            "component": prefix,
                            "function": key
                        })
                elif isinstance(value, (dict, list)):
                    extract_pins(value, f"{prefix}.{key}" if prefix else key)
        elif isinstance(obj, list):
            for item in obj:
                extract_pins(item, prefix)
    
    if parsed_yaml:
        extract_pins(parsed_yaml)
    
    # Remove duplicates and sort
    for pin_type in used_pins:
        seen = set()
        unique = []
        for pin_info in used_pins[pin_type]:
            key = (pin_info["pin"], pin_info["function"])
            if key not in seen:
                seen.add(key)
                unique.append(pin_info)
        used_pins[pin_type] = unique
    
    return used_pins


@app.get("/api/chip/pins/{board}")
async def get_chip_pinout(board: str):
    """Get pin configuration for a specific board"""
    # Pin definitions for common boards
    PINOUTS = {
        "esp32dev": {
            "name": "ESP32 DevKit",
            "gpio": list(range(0, 40)),
            "adc1": [32, 33, 34, 35, 36, 39],
            "adc2": [4, 0, 2, 13, 12, 14, 15, 25, 26, 27],
            "touch": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            "dac": [25, 26],
            "i2c": {"sda": [21], "scl": [22]},
            "spi": {"mosi": [23], "miso": [19], "clk": [18], "cs": [5]},
            "uart": {"tx": [1, 17], "rx": [3, 16]},
            "pwm": list(range(0, 16)),
            "special": {
                "TX0": 1, "RX0": 3,
                "TX2": 17, "RX2": 16,
                "EN": None,  # Reset
                "BOOT": 0,  # Boot button
            }
        },
        "nodemcu-32s": {
            "name": "NodeMCU-32S",
            "gpio": list(range(0, 40)),
            "led_builtin": 2,
            "i2c": {"sda": [21], "scl": [22]},
            "special": {"D0": 26, "D1": 22, "D2": 21}
        },
        "esp32-s3-devkitc-1": {
            "name": "ESP32-S3 DevKitC-1",
            "gpio": list(range(0, 49)),
            "usb": {"usb_dp": 19, "usb_dm": 20},
            "i2c": {"sda": [8], "scl": [9]},
            "spi": {"mosi": [35], "miso": [37], "clk": [36], "cs": [34]},
            "uart": {"tx": [43], "rx": [44]},
            "special": {"BOOT": 0, "RGB_LED": 48}
        },
        "esp32-c3-devkitc-02": {
            "name": "ESP32-C3 DevKitC-02",
            "gpio": list(range(0, 22)),
            "usb": {"usb_dp": 18, "usb_dm": 19},
            "i2c": {"sda": [8], "scl": [9]},
            "special": {"BOOT": 9, "RGB_LED": 8}
        },
        "wemos_d1_mini": {
            "name": "Wemos D1 Mini (ESP8266)",
            "gpio": [0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 16],
            "adc": [17],  # A0
            "i2c": {"sda": [4], "scl": [5]},
            "spi": {"mosi": [13], "miso": [12], "clk": [14], "cs": [15]},
            "special": {"D1": 5, "D2": 4, "D3": 0, "D4": 2, "D5": 14, "D6": 12, "D7": 13, "D8": 15}
        },
        "nodemcu": {
            "name": "NodeMCU (ESP8266)",
            "gpio": [0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 16],
            "adc": [17],  # A0
            "i2c": {"sda": [4], "scl": [5]},
            "special": {"D1": 5, "D2": 4, "D3": 0, "D4": 2, "D5": 14, "D6": 12, "D7": 13, "D8": 15, "LED": 16}
        }
    }
    
    # Return pinout if found, otherwise generic
    if board in PINOUTS:
        return {"success": True, "pinout": PINOUTS[board]}
    else:
        return {
            "success": True,
            "pinout": {
                "name": board,
                "gpio": list(range(0, 40)),
                "note": "Generic pinout - verify with datasheet"
            }
        }


@app.get("/api/templates")
async def get_templates():
    """Get available YAML templates organized by category"""
    templates = {
        "sensors": {
            "name": "Szenzorok",
            "icon": "sensors",
            "items": [
                {
                    "id": "dht22",
                    "name": "DHT22 Hőmérő/Páratartalom",
                    "description": "Hőmérséklet és páratartalom mérés",
                    "yaml": """sensor:
  - platform: dht
    pin: GPIOXX
    temperature:
      name: "${device_name} Hőmérséklet"
    humidity:
      name: "${device_name} Páratartalom"
    update_interval: 60s
"""
                },
                {
                    "id": "ds18b20",
                    "name": "DS18B20 Digitális Hőmérő",
                    "description": "Egyvezetékes digitális hőmérő",
                    "yaml": """sensor:
  - platform: dallas
    pin: GPIOXX
    address: XX XX XX XX XX XX XX XX
    name: "${device_name} Hőmérséklet"
"""
                },
                {
                    "id": "bme280",
                    "name": "BME280 Környezeti Szenzor",
                    "description": "Hőmérséklet, páratartalom, légnyomás",
                    "yaml": """i2c:
  sda: GPIOXX
  scl: GPIOXX

sensor:
  - platform: bme280_i2c
    temperature:
      name: "${device_name} Hőmérséklet"
    humidity:
      name: "${device_name} Páratartalom"
    pressure:
      name: "${device_name} Légnyomás"
    address: 0x76
    update_interval: 60s
"""
                },
                {
                    "id": "hdc1080",
                    "name": "HDC1080 Környezeti Szenzor",
                    "description": "Hőmérséklet és páratartalom",
                    "yaml": """i2c:
  sda: GPIOXX
  scl: GPIOXX

sensor:
  - platform: hdc1080
    temperature:
      name: "${device_name} Hőmérséklet"
    humidity:
      name: "${device_name} Páratartalom"
    update_interval: 60s
"""
                }
            ]
        },
        "presence": {
            "name": "Jelenlét Szenzorok",
            "icon": "person",
            "items": [
                {
                    "id": "ble_presence",
                    "name": "BLE Jelenlét Szenzor",
                    "description": "Bluetooth eszközök jelenlétének figyelése",
                    "yaml": """esp32_ble_tracker:
  scan_parameters:
    interval: 1s
    window: 200ms
    active: true

sensor:
  - platform: ble_rssi
    mac_address: XX:XX:XX:XX:XX:XX
    name: "${device_name} Eszköz RSSI"
    
binary_sensor:
  - platform: ble_presence
    mac_address: XX:XX:XX:XX:XX:XX
    name: "${device_name} Eszköz Jelenlét"
"""
                },
                {
                    "id": "ble_ibeacon",
                    "name": "BLE iBeacon",
                    "description": "iBeacon alapú jelenlét figyelés",
                    "yaml": """esp32_ble_tracker:

binary_sensor:
  - platform: ble_presence
    ibeacon_uuid: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
    ibeacon_major: XXXX
    ibeacon_minor: XXXX
    name: "${device_name} iBeacon Jelenlét"
"""
                },
                {
                    "id": "ble_room_tracking",
                    "name": "BLE Szoba követés",
                    "description": "Több szoba jelenlétének követése",
                    "yaml": """esp32_ble_tracker:
  scan_parameters:
    interval: 300ms
    window: 200ms
    active: true

# Szoba követés konfiguráció
binary_sensor:
  - platform: ble_presence
    mac_address: XX:XX:XX:XX:XX:XX
    name: "${device_name} Telefon Jelenlét"
    
  - platform: template
    name: "${device_name} Szoba"
    lambda: |-
      if (id(ble_rssi).state > -70) {
        return {"nappali"};
      } else if (id(ble_rssi).state > -85) {
        return {"konyha"};
      } else {
        return {"nincs"};
      }
    
sensor:
  - platform: ble_rssi
    mac_address: XX:XX:XX:XX:XX:XX
    id: ble_rssi
    name: "${device_name} Telefon RSSI"
    filters:
      - throttle: 1s
      - median:
          window_size: 5
          send_every: 2
"""
                },
                {
                    "id": "radar_presence",
                    "name": "Radar Jelenlét (HLK-LD2410)",
                    "description": "Mikrohullámú radar jelenlét érzékelő",
                    "yaml": """uart:
  tx_pin: GPIOXX
  rx_pin: GPIOXX
  baud_rate: 256000
  parity: NONE
  stop_bits: 1

ld2410:

binary_sensor:
  - platform: ld2410
    has_target:
      name: "${device_name} Jelenlét"
    has_moving_target:
      name: "${device_name} Mozgás"
    has_static_target:
      name: "${device_name} Álló jelenlét"

sensor:
  - platform: ld2410
    moving_distance:
      name: "${device_name} Mozgó távolság"
    static_distance:
      name: "${device_name} Álló távolság"
"""
                }
            ]
        },
        "output": {
            "name": "Kimenetek",
            "icon": "power",
            "items": [
                {
                    "id": "gpio_output",
                    "name": "GPIO Kimenet",
                    "description": "Egyszerű GPIO kimenet",
                    "yaml": """output:
  - platform: gpio
    pin: GPIOXX
    id: "${device_name}_output"
    
light:
  - platform: binary
    name: "${device_name} Világítás"
    output: "${device_name}_output"
"""
                },
                {
                    "id": "pwm_output",
                    "name": "PWM Kimenet",
                    "description": "PWM vezérelt kimenet (pl. LED)",
                    "yaml": """output:
  - platform: ledc
    pin: GPIOXX
    frequency: 1000Hz
    id: "${device_name}_pwm"
    
light:
  - platform: monochromatic
    name: "${device_name} LED"
    output: "${device_name}_pwm"
"""
                },
                {
                    "id": "ac_dimmer",
                    "name": "AC Dimmer",
                    "description": "Váltakozó feszültség dimmer",
                    "yaml": """output:
  - platform: ac_dimmer
    id: "${device_name}_dimmer"
    gate_pin: GPIOXX
    zero_cross_pin: GPIOXX
    
light:
  - platform: monochromatic
    name: "${device_name} Izzó"
    output: "${device_name}_dimmer"
"""
                }
            ]
        },
        "display": {
            "name": "Kijelzők",
            "icon": "display",
            "items": [
                {
                    "id": "oled_ssd1306",
                    "name": "OLED SSD1306",
                    "description": "0.96/1.3 colos OLED kijelző",
                    "yaml": """i2c:
  sda: GPIOXX
  scl: GPIOXX

display:
  - platform: ssd1306_i2c
    model: "SSD1306 128x64"
    address: 0x3C
    lambda: |-
      it.printf(0, 0, id(font), "Hőm: %.1f°C", id(temp_sensor).state);
      it.printf(0, 20, id(font), "Pára: %.1f%%", id(humidity_sensor).state);

font:
  - file: "gfonts://Roboto"
    id: font
    size: 16
"""
                },
                {
                    "id": "tft_ili9341",
                    "name": "TFT ILI9341",
                    "description": "2.4 colos TFT kijelző",
                    "yaml": """spi:
  clk_pin: GPIOXX
  mosi_pin: GPIOXX
  miso_pin: GPIOXX

display:
  - platform: ili9341
    cs_pin: GPIOXX
    dc_pin: GPIOXX
    reset_pin: GPIOXX
    lambda: |-
      it.fill(Color(0, 0, 0));
      it.printf(0, 0, id(font), Color(255, 255, 255), "Hello!");
      
font:
  - file: "gfonts://Roboto"
    id: font
    size: 20
"""
                }
            ]
        },
        "network": {
            "name": "Hálózat",
            "icon": "wifi",
            "items": [
                {
                    "id": "mqtt_basic",
                    "name": "MQTT Alap",
                    "description": "MQTT kapcsolat Home Assistant-hoz",
                    "yaml": """mqtt:
  broker: !secret mqtt_broker
  username: !secret mqtt_user
  password: !secret mqtt_password
  discovery: true
  discovery_prefix: homeassistant
"""
                },
                {
                    "id": "api_basic",
                    "name": "API Alap",
                    "description": "Native API kapcsolat Home Assistant-hoz",
                    "yaml": """api:
  encryption:
    key: !secret api_key

# Home Assistant integration
ota:
  - platform: esphome
    password: !secret ota_password
"""
                }
            ]
        },
        "switch": {
            "name": "Kapcsolók",
            "icon": "toggle_on",
            "items": [
                {
                    "id": "gpio_switch",
                    "name": "GPIO Kapcsoló",
                    "description": "Egyszerű GPIO kapcsoló",
                    "yaml": """switch:
  - platform: gpio
    pin: GPIOXX
    name: "${device_name} Kapcsoló"
    id: "${device_name}_switch"
    icon: "mdi:power"
"""
                },
                {
                    "id": "relay_switch",
                    "name": "Relé Kapcsoló",
                    "description": "Relé vezérlés",
                    "yaml": """switch:
  - platform: gpio
    pin: GPIOXX
    name: "${device_name} Relé"
    id: "${device_name}_relay"
    icon: "mdi:power-socket-eu"
    on_turn_on:
      - logger.log: "Relé BEKAPCSOLVA"
    on_turn_off:
      - logger.log: "Relé KIKAPCSOLVA"
"""
                }
            ]
        }
    }
    
    return {"success": True, "templates": templates}


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