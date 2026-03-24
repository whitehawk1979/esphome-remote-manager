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
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# In-memory state
state = {
    "devices": [],
    "last_update": None,
    "esphome_version": None,
    "update_status": "idle"
}

# Background task status
update_tasks: Dict[str, Dict[str, Any]] = {}


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
                        text = await response.text()
                        return {"error": f"HTTP {response.status}: {text}"}
            elif method == "POST":
                async with session.post(url, json=data, timeout=aiohttp.ClientTimeout(total=300)) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        text = await response.text()
                        return {"error": f"HTTP {response.status}: {text}"}
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
                    
                    # Parse configured devices
                    for device in data.get("configured", []):
                        devices.append({
                            "name": device.get("name", "unknown"),
                            "configuration": device.get("configuration", ""),
                            "platform": device.get("target_platform", "unknown"),
                            "deployed_version": device.get("deployed_version", "unknown"),
                            "current_version": device.get("current_version", "unknown"),
                            "address": device.get("address", ""),
                            "web_port": device.get("web_port", 80),
                            "status": "configured"
                        })
                    
                    return devices
                else:
                    logger.error(f"Dashboard API returned {response.status}")
                    return []
    except Exception as e:
        logger.error(f"Failed to get devices from dashboard: {e}")
        return []


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
    
    # Extract version from result
    esphome_version = "unknown"
    if "esphome_version" in result:
        esphome_version = result["esphome_version"]
        # Clean up version string
        if esphome_version.startswith("Version: "):
            esphome_version = esphome_version.replace("Version: ", "")
    
    state["esphome_version"] = esphome_version
    
    return {
        "status": "healthy" if "error" not in result else "error",
        "esphome_version": esphome_version,
        "agent_version": result.get("agent_version", "unknown"),
        "container_running": result.get("container_running", False),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/devices")
async def list_devices():
    """List all ESPHome devices"""
    devices = await get_devices_from_dashboard()
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
    """Get details for a specific device"""
    devices = await get_devices_from_dashboard()
    
    for device in devices:
        if device.get("name") == device_name:
            return {"success": True, "device": device}
    
    # If not found in dashboard, try API
    result = await call_esphome_api(f"/api/device/{device_name}")
    if "error" not in result:
        return {"success": True, "device": result}
    
    raise HTTPException(status_code=404, detail=f"Device {device_name} not found")


@app.post("/api/compile/{device_name}")
async def compile_device(device_name: str, background_tasks: BackgroundTasks):
    """Compile a device"""
    if device_name in update_tasks and update_tasks[device_name].get("status") in ["compiling", "uploading"]:
        return {"success": False, "message": f"Device {device_name} is already being processed"}
    
    # Start background compilation
    update_tasks[device_name] = {
        "status": "compiling",
        "started": datetime.now().isoformat(),
        "log": [{"time": datetime.now().isoformat(), "level": "info", "message": f"Starting compilation for {device_name}"}],
        "device": device_name
    }
    
    background_tasks.add_task(compile_device_task, device_name)
    
    return {"success": True, "message": f"Compilation started for {device_name}", "status": "compiling"}


@app.post("/api/upload/{device_name}")
async def upload_device(device_name: str, background_tasks: BackgroundTasks):
    """Upload (OTA update) a device"""
    if device_name in update_tasks and update_tasks[device_name].get("status") in ["compiling", "uploading"]:
        return {"success": False, "message": f"Device {device_name} is already being processed"}
    
    # Start background upload
    update_tasks[device_name] = {
        "status": "uploading",
        "started": datetime.now().isoformat(),
        "log": [{"time": datetime.now().isoformat(), "level": "info", "message": f"Starting upload for {device_name}"}],
        "device": device_name
    }
    
    background_tasks.add_task(upload_device_task, device_name)
    
    return {"success": True, "message": f"Upload started for {device_name}", "status": "uploading"}


@app.post("/api/update/{device_name}")
async def update_device(device_name: str, background_tasks: BackgroundTasks):
    """Compile and upload a device (full update)"""
    if device_name in update_tasks and update_tasks[device_name].get("status") in ["compiling", "uploading"]:
        return {"success": False, "message": f"Device {device_name} is already being processed"}
    
    # Start background update
    update_tasks[device_name] = {
        "status": "compiling",
        "started": datetime.now().isoformat(),
        "log": [{"time": datetime.now().isoformat(), "level": "info", "message": f"Starting full update for {device_name}"}],
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
        
        if "error" in result:
            update_tasks[device_name]["status"] = "error"
            update_tasks[device_name]["log"].append({
                "time": datetime.now().isoformat(),
                "level": "error",
                "message": f"Compilation failed: {result['error']}"
            })
        else:
            update_tasks[device_name]["status"] = "compiled"
            update_tasks[device_name]["log"].append({
                "time": datetime.now().isoformat(),
                "level": "success",
                "message": f"Compilation completed for {device_name}"
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
        
        if "error" in result:
            update_tasks[device_name]["status"] = "error"
            update_tasks[device_name]["log"].append({
                "time": datetime.now().isoformat(),
                "level": "error",
                "message": f"Upload failed: {result['error']}"
            })
        else:
            update_tasks[device_name]["status"] = "uploaded"
            update_tasks[device_name]["log"].append({
                "time": datetime.now().isoformat(),
                "level": "success",
                "message": f"Upload completed for {device_name}"
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
        .status-configured { background: #4caf50; color: white; }
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-left: 8px; }
        .btn-primary { background: #2196f3; color: white; }
        .btn-success { background: #4caf50; color: white; }
        .loading { text-align: center; padding: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 ESPHome Remote Manager</h1>
        <div class="card">
            <h2>Devices</h2>
            <div id="devices" class="loading">Loading...</div>
        </div>
    </div>
    <script>
        fetch('/api/devices')
            .then(r => r.json())
            .then(data => {
                const container = document.getElementById('devices');
                if (data.devices && data.devices.length > 0) {
                    container.innerHTML = data.devices.map(d => `
                        <div class="device">
                            <div>
                                <div class="device-name">${d.name}</div>
                                <small style="color:#666">${d.platform || ''} ${d.address || ''}</small>
                            </div>
                            <div>
                                <span class="device-status status-${d.status || 'configured'}">${d.status || 'configured'}</span>
                                <button class="btn btn-primary" onclick="compile('${d.name}')">Compile</button>
                                <button class="btn btn-success" onclick="update('${d.name}')">Update</button>
                            </div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<p>No devices found</p>';
                }
            });
        function compile(name) {
            fetch(`/api/compile/${name}`, {method: 'POST'})
                .then(r => r.json())
                .then(d => alert(d.message));
        }
        function update(name) {
            if (confirm(`Update ${name}?`)) {
                fetch(`/api/update/${name}`, {method: 'POST'})
                    .then(r => r.json())
                    .then(d => alert(d.message));
            }
        }
    </script>
</body>
</html>
"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))