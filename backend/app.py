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

# Home Assistant Configuration
HA_URL = os.getenv("HA_URL", "http://192.168.1.43:8123")
HA_TOKEN = os.getenv("HA_TOKEN", "")
HA_MCP_URL = os.getenv("HA_MCP_URL", "http://192.168.1.43:9583/private_nr_13FoRaKqLSc5RTG_L3w")

# MQTT Configuration
MQTT_BROKER = os.getenv("MQTT_BROKER", "192.168.1.43")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER = os.getenv("MQTT_USER", "mqtt")
MQTT_PASS = os.getenv("MQTT_PASS", "")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI App
app = FastAPI(
    title="ESPHome Remote Manager",
    description="Web interface for managing ESPHome devices with Home Assistant integration",
    version="1.1.0"
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
                            "status": "configured",
                            "integrations": device.get("loaded_integrations", [])
                        })
                    
                    return devices
                else:
                    logger.error(f"Dashboard API returned {response.status}")
                    return []
    except Exception as e:
        logger.error(f"Failed to get devices from dashboard: {e}")
        return []


async def get_yaml_config(device_name: str) -> Dict[str, Any]:
    """Get YAML configuration for a device"""
    try:
        auth = aiohttp.BasicAuth(ESPHOME_DASHBOARD_USER, ESPHOME_DASHBOARD_PASS)
        async with aiohttp.ClientSession(auth=auth) as session:
            # Get configuration file
            async with session.get(f"{ESPHOME_DASHBOARD_URL}/config?configuration={device_name}.yaml", timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    content = await response.text()
                    return {
                        "success": True,
                        "yaml": content,
                        "device": device_name
                    }
                else:
                    return {"success": False, "error": f"HTTP {response.status}"}
    except Exception as e:
        logger.error(f"Failed to get YAML config: {e}")
        return {"success": False, "error": str(e)}


async def save_yaml_config(device_name: str, yaml_content: str) -> Dict[str, Any]:
    """Save YAML configuration for a device"""
    try:
        auth = aiohttp.BasicAuth(ESPHOME_DASHBOARD_USER, ESPHOME_DASHBOARD_PASS)
        async with aiohttp.ClientSession(auth=auth) as session:
            # Save configuration file
            data = {"configuration": f"{device_name}.yaml", "content": yaml_content}
            async with session.post(f"{ESPHOME_DASHBOARD_URL}/config", json=data, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    return {"success": True, "message": f"Configuration saved for {device_name}"}
                else:
                    text = await response.text()
                    return {"success": False, "error": f"HTTP {response.status}: {text}"}
    except Exception as e:
        logger.error(f"Failed to save YAML config: {e}")
        return {"success": False, "error": str(e)}


async def get_ha_esphome_entities() -> List[Dict[str, Any]]:
    """Get ESPHome entities from Home Assistant via MCP"""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "ha_search_entities",
                    "arguments": {"query": "esphome", "limit": 50}
                }
            }
            async with session.post(HA_MCP_URL, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    # Parse result
                    result = data.get("result", {})
                    if isinstance(result, dict):
                        content = result.get("content", [])
                        if content and len(content) > 0:
                            text = content[0].get("text", "{}")
                            entities_data = json.loads(text) if isinstance(text, str) else text
                            # Group by device
                            devices = {}
                            for entity in entities_data.get("results", []):
                                entity_id = entity.get("entity_id", "")
                                # Extract device name from entity_id
                                # Format: sensor.multisensor_multisensor_... or switch.esp32_s3_box_3_...
                                parts = entity_id.split(".")
                                if len(parts) >= 2:
                                    domain = parts[0]
                                    name_parts = parts[1].split("_")
                                    # Try to identify device
                                    device_name = name_parts[0] if name_parts else "unknown"
                                    
                                    if device_name not in devices:
                                        devices[device_name] = {
                                            "name": device_name,
                                            "entities": [],
                                            "domains": set()
                                        }
                                    devices[device_name]["entities"].append({
                                        "entity_id": entity_id,
                                        "friendly_name": entity.get("friendly_name", ""),
                                        "domain": domain,
                                        "state": entity.get("state", "unknown")
                                    })
                                    devices[device_name]["domains"].add(domain)
                            
                            # Convert sets to lists for JSON
                            result_list = []
                            for device_name, device_data in devices.items():
                                device_data["domains"] = list(device_data["domains"])
                                result_list.append(device_data)
                            
                            return result_list
                    return []
                else:
                    logger.error(f"HA MCP returned {response.status}")
                    return []
    except Exception as e:
        logger.error(f"Failed to get HA entities: {e}")
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
    
    # Get HA entities for each device
    ha_entities = await get_ha_esphome_entities()
    
    # Map HA entities to devices
    ha_entity_map = {e["name"]: e for e in ha_entities}
    
    for device in devices:
        device_name = device.get("name", "")
        # Find matching HA entities
        ha_data = ha_entity_map.get(device_name, {"entities": []})
        device["ha_entities"] = ha_data.get("entities", [])
        device["ha_domains"] = list(set(e.get("domain", "") for e in device.get("ha_entities", [])))
    
    state["devices"] = devices
    state["ha_entities"] = ha_entities
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
            # Get YAML config
            yaml_config = await get_yaml_config(device_name)
            device["yaml_config"] = yaml_config.get("yaml", "")
            
            # Get HA entities
            ha_entities = await get_ha_esphome_entities()
            ha_entity_map = {e["name"]: e for e in ha_entities}
            ha_data = ha_entity_map.get(device_name, {"entities": []})
            device["ha_entities"] = ha_data.get("entities", [])
            
            return {"success": True, "device": device}
    
    raise HTTPException(status_code=404, detail=f"Device {device_name} not found")


@app.get("/api/yaml/{device_name}")
async def get_yaml(device_name: str):
    """Get YAML configuration for a device"""
    result = await get_yaml_config(device_name)
    
    if result.get("success"):
        return {"success": True, "yaml": result.get("yaml", ""), "device": device_name}
    else:
        raise HTTPException(status_code=404, detail=result.get("error", "Configuration not found"))


@app.post("/api/yaml/{device_name}")
async def save_yaml(device_name: str, yaml_content: str):
    """Save YAML configuration for a device"""
    result = await save_yaml_config(device_name, yaml_content)
    
    if result.get("success"):
        return {"success": True, "message": result.get("message", "Configuration saved")}
    else:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to save configuration"))


@app.get("/api/ha-entities")
async def list_ha_entities():
    """Get ESPHome entities from Home Assistant"""
    entities = await get_ha_esphome_entities()
    return {
        "success": True,
        "devices": entities,
        "count": len(entities)
    }


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
    return """<!DOCTYPE html><html><head><title>ESPHome Remote Manager</title></head><body><h1>ESPHome Remote Manager</h1><p>Loading...</p><script>fetch('/api/devices').then(r=>r.json()).then(d=>document.body.innerHTML='<pre>'+JSON.stringify(d,null,2)+'</pre>');</script></body></html>"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))