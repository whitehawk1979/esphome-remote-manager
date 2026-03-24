#!/usr/bin/env python3
"""
ESPHome Remote Manager - Backend API
A web interface for managing ESPHome devices on a remote server.
"""

import os
import json
import asyncio
import aiohttp
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import logging

# Configuration
ESPHOME_API_URL = os.getenv("ESPHOME_API_URL", "http://192.168.1.64:7123")
ESPHOME_API_USER = os.getenv("ESPHOME_API_USER", "esphome")
ESPHOME_API_PASS = os.getenv("ESPHOME_API_PASS", "esphome")
ESPHOME_DASHBOARD_URL = os.getenv("ESPHOME_DASHBOARD_URL", "http://192.168.1.64:6052")

# MQTT Configuration
MQTT_BROKER = os.getenv("MQTT_BROKER", "192.168.1.43")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER = os.getenv("MQTT_USER", "mqtt")
MQTT_PASS = os.getenv("MQTT_PASS", "")
DEVICE_NAME = os.getenv("DEVICE_NAME", "ESPHome Remote Manager")
DEVICE_ID = os.getenv("DEVICE_ID", "esphome_remote_manager")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI App
app = FastAPI(
    title="ESPHome Remote Manager",
    description="Web interface for managing ESPHome devices on a remote server",
    version="1.0.0"
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
os.makedirs(static_dir, exist_ok=True)

# In-memory state
state = {
    "devices": [],
    "last_update": None,
    "update_status": "idle",
    "update_log": [],
    "current_device": None
}

# Background task status
update_tasks: Dict[str, Dict[str, Any]] = {}


class Device(BaseModel):
    name: str
    ip: Optional[str] = None
    port: int = 6053
    status: str = "unknown"
    version: Optional[str] = None
    last_update: Optional[str] = None


class UpdateRequest(BaseModel):
    device: str
    action: str = "compile"  # compile, upload, full


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


async def call_esphome_api(endpoint: str, method: str = "GET", data: Optional[dict] = None) -> Dict[str, Any]:
    """Call ESPHome Remote Builder API"""
    url = f"{ESPHOME_API_URL}{endpoint}"
    auth = aiohttp.BasicAuth(ESPHOME_API_USER, ESPHOME_API_PASS)
    
    async with aiohttp.ClientSession(auth=auth) as session:
        try:
            if method == "GET":
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        return {"error": f"HTTP {response.status}"}
            elif method == "POST":
                async with session.post(url, json=data, timeout=aiohttp.ClientTimeout(total=300)) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        return {"error": f"HTTP {response.status}"}
        except asyncio.TimeoutError:
            return {"error": "Timeout"}
        except Exception as e:
            logger.error(f"API call failed: {e}")
            return {"error": str(e)}


async def get_devices_from_esphome() -> List[Dict[str, Any]]:
    """Get list of ESPHome devices from remote server"""
    try:
        # Try to get devices from ESPHome Dashboard API
        async with aiohttp.ClientSession() as session:
            auth = aiohttp.BasicAuth("admin", "admin")
            async with session.get(f"{ESPHOME_DASHBOARD_URL}/devices", auth=auth, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    return data if isinstance(data, list) else []
    except Exception as e:
        logger.warning(f"Could not get devices from dashboard: {e}")
    
    # Fallback: try to get from API
    result = await call_esphome_api("/api/devices")
    if "error" not in result:
        return result.get("devices", [])
    
    return []


@app.get("/")
async def root():
    """Serve the main HTML page"""
    html_path = os.path.join(static_dir, "index.html")
    if os.path.exists(html_path):
        return HTMLResponse(content=open(html_path).read())
    return HTMLResponse(content=get_default_html())


@app.get("/api/health")
async def health():
    """Health check endpoint"""
    result = await call_esphome_api("/api/health")
    return {
        "status": "healthy",
        "esphome_version": result.get("esphome_version", "unknown"),
        "agent_version": result.get("agent_version", "unknown"),
        "container_running": result.get("container_running", False),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/devices")
async def list_devices():
    """List all ESPHome devices"""
    devices = await get_devices_from_esphome()
    state["devices"] = devices
    return {"success": True, "devices": devices}


@app.get("/api/device/{device_name}")
async def get_device(device_name: str):
    """Get details for a specific device"""
    result = await call_esphome_api(f"/api/device/{device_name}")
    if "error" in result:
        raise HTTPException(status_code=404, detail=f"Device {device_name} not found")
    return {"success": True, "device": result}


@app.post("/api/compile/{device_name}")
async def compile_device(device_name: str, background_tasks: BackgroundTasks):
    """Compile a device"""
    if device_name in update_tasks and update_tasks[device_name].get("status") == "running":
        return {"success": False, "message": f"Device {device_name} is already being processed"}
    
    # Start background compilation
    update_tasks[device_name] = {
        "status": "compiling",
        "started": datetime.now().isoformat(),
        "log": [],
        "device": device_name
    }
    
    background_tasks.add_task(compile_device_task, device_name)
    
    return {"success": True, "message": f"Compilation started for {device_name}", "status": "compiling"}


@app.post("/api/upload/{device_name}")
async def upload_device(device_name: str, background_tasks: BackgroundTasks):
    """Upload (OTA update) a device"""
    if device_name in update_tasks and update_tasks[device_name].get("status") == "running":
        return {"success": False, "message": f"Device {device_name} is already being processed"}
    
    # Start background upload
    update_tasks[device_name] = {
        "status": "uploading",
        "started": datetime.now().isoformat(),
        "log": [],
        "device": device_name
    }
    
    background_tasks.add_task(upload_device_task, device_name)
    
    return {"success": True, "message": f"Upload started for {device_name}", "status": "uploading"}


@app.post("/api/update/{device_name}")
async def update_device(device_name: str, background_tasks: BackgroundTasks):
    """Compile and upload a device (full update)"""
    if device_name in update_tasks and update_tasks[device_name].get("status") == "running":
        return {"success": False, "message": f"Device {device_name} is already being processed"}
    
    # Start background update
    update_tasks[device_name] = {
        "status": "compiling",
        "started": datetime.now().isoformat(),
        "log": [],
        "device": device_name
    }
    
    background_tasks.add_task(update_device_task, device_name)
    
    return {"success": True, "message": f"Update started for {device_name}", "status": "compiling"}


@app.get("/api/status/{device_name}")
async def get_update_status(device_name: str):
    """Get update status for a device"""
    if device_name not in update_tasks:
        return {"success": True, "status": "idle", "device": device_name}
    
    return {
        "success": True,
        "status": update_tasks[device_name].get("status", "unknown"),
        "device": device_name,
        "started": update_tasks[device_name].get("started"),
        "log": update_tasks[device_name].get("log", [])[-50:]  # Last 50 lines
    }


@app.get("/api/logs/{device_name}")
async def get_device_logs(device_name: str):
    """Get logs for a device"""
    if device_name not in update_tasks:
        return {"success": True, "logs": [], "device": device_name}
    
    return {
        "success": True,
        "logs": update_tasks[device_name].get("log", []),
        "device": device_name
    }


async def compile_device_task(device_name: str):
    """Background task to compile a device"""
    try:
        result = await call_esphome_api(f"/api/compile/{device_name}", method="POST")
        update_tasks[device_name]["status"] = "compiled"
        update_tasks[device_name]["log"].append({
            "time": datetime.now().isoformat(),
            "level": "info",
            "message": f"Compilation completed for {device_name}"
        })
        if "error" in result:
            update_tasks[device_name]["status"] = "error"
            update_tasks[device_name]["log"].append({
                "time": datetime.now().isoformat(),
                "level": "error",
                "message": f"Compilation failed: {result['error']}"
            })
    except Exception as e:
        update_tasks[device_name]["status"] = "error"
        update_tasks[device_name]["log"].append({
            "time": datetime.now().isoformat(),
            "level": "error",
            "message": f"Compilation error: {str(e)}"
        })


async def upload_device_task(device_name: str):
    """Background task to upload a device"""
    try:
        result = await call_esphome_api(f"/api/upload/{device_name}", method="POST")
        update_tasks[device_name]["status"] = "uploaded"
        update_tasks[device_name]["log"].append({
            "time": datetime.now().isoformat(),
            "level": "info",
            "message": f"Upload completed for {device_name}"
        })
        if "error" in result:
            update_tasks[device_name]["status"] = "error"
            update_tasks[device_name]["log"].append({
                "time": datetime.now().isoformat(),
                "level": "error",
                "message": f"Upload failed: {result['error']}"
            })
    except Exception as e:
        update_tasks[device_name]["status"] = "error"
        update_tasks[device_name]["log"].append({
            "time": datetime.now().isoformat(),
            "level": "error",
            "message": f"Upload error: {str(e)}"
        })


async def update_device_task(device_name: str):
    """Background task to compile and upload a device"""
    # Compile first
    await compile_device_task(device_name)
    
    if update_tasks[device_name]["status"] == "compiled":
        # Then upload
        update_tasks[device_name]["status"] = "uploading"
        update_tasks[device_name]["log"].append({
            "time": datetime.now().isoformat(),
            "level": "info",
            "message": f"Starting upload for {device_name}..."
        })
        await upload_device_task(device_name)


def get_default_html():
    """Return default HTML page if static files don't exist"""
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESPHome Remote Manager</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; margin-bottom: 20px; }
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
        .device { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; }
        .device:last-child { border-bottom: none; }
        .device-name { font-weight: bold; }
        .device-status { padding: 4px 12px; border-radius: 12px; font-size: 12px; }
        .status-online { background: #4caf50; color: white; }
        .status-offline { background: #f44336; color: white; }
        .status-unknown { background: #9e9e9e; color: white; }
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-left: 8px; }
        .btn-primary { background: #2196f3; color: white; }
        .btn-success { background: #4caf50; color: white; }
        .btn-danger { background: #f44336; color: white; }
        .btn:hover { opacity: 0.9; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .status-badge { padding: 8px 16px; border-radius: 8px; background: #4caf50; color: white; }
        .loading { text-align: center; padding: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 ESPHome Remote Manager</h1>
            <div class="status-badge" id="status-badge">Loading...</div>
        </div>
        
        <div class="card">
            <h2>Devices</h2>
            <div id="devices" class="loading">Loading devices...</div>
        </div>
        
        <div class="card">
            <h2>System Status</h2>
            <div id="system-status">Loading...</div>
        </div>
    </div>
    
    <script>
        let devices = [];
        
        async function fetchHealth() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                document.getElementById('status-badge').textContent = 
                    `ESPHome ${data.esphome_version} | Agent ${data.agent_version}`;
            } catch (e) {
                document.getElementById('status-badge').textContent = 'Error';
            }
        }
        
        async function fetchDevices() {
            try {
                const response = await fetch('/api/devices');
                const data = await response.json();
                devices = data.devices || [];
                renderDevices();
            } catch (e) {
                document.getElementById('devices').innerHTML = '<p>Error loading devices</p>';
            }
        }
        
        function renderDevices() {
            const container = document.getElementById('devices');
            if (devices.length === 0) {
                container.innerHTML = '<p>No devices found</p>';
                return;
            }
            
            container.innerHTML = devices.map(device => `
                <div class="device">
                    <div>
                        <div class="device-name">${device.name || 'Unknown'}</div>
                        <small style="color: #666;">${device.ip || 'No IP'}</small>
                    </div>
                    <div>
                        <span class="device-status status-${device.status || 'unknown'}">${device.status || 'unknown'}</span>
                        <button class="btn btn-primary" onclick="compileDevice('${device.name}')">Compile</button>
                        <button class="btn btn-success" onclick="updateDevice('${device.name}')">Update</button>
                    </div>
                </div>
            `).join('');
        }
        
        async function compileDevice(name) {
            try {
                const response = await fetch(`/api/compile/${name}`, { method: 'POST' });
                const data = await response.json();
                alert(data.message);
            } catch (e) {
                alert('Error: ' + e.message);
            }
        }
        
        async function updateDevice(name) {
            if (!confirm(`Update ${name}? This will compile and upload the firmware.`)) return;
            try {
                const response = await fetch(`/api/update/${name}`, { method: 'POST' });
                const data = await response.json();
                alert(data.message);
            } catch (e) {
                alert('Error: ' + e.message);
            }
        }
        
        // Initial load
        fetchHealth();
        fetchDevices();
        
        // Refresh every 30 seconds
        setInterval(fetchHealth, 30000);
        setInterval(fetchDevices, 30000);
    </script>
</body>
</html>
"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))