# OpenSearch Raw Data Structure

## ✅ Cleanup Complete
Removed redundant files from root directory:
- ❌ fetch.js
- ❌ fetch.tsx  
- ❌ opensearch.config.ts
- ❌ FETCH_QUICKSTART.md
- ❌ FETCH_README.md

All fetch functionality is now in `backend/modules/`

## 📊 Raw Data Access

### View Raw Data
```bash
cd backend
npm run raw
```

This will:
1. Fetch raw data from OpenSearch
2. Display it in JSON format
3. Save to files:
   - `raw_scans.json` (scan metadata)
   - `raw_devices.json` (device details)

### Current Data Files
- **raw_scans.json** - 26,609 bytes (3 scans)
- **raw_devices.json** - 10,701 bytes (5 devices)

## 📋 OpenSearch Response Structure

### Response Metadata
```json
{
  "took": 4,              // Query execution time in ms
  "timed_out": false,     // Whether query timed out
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 7,         // Total documents available
      "relation": "eq"
    },
    "max_score": null,
    "hits": [ ... ]       // Array of actual documents
  }
}
```

## 📡 Radar Scans Index Structure

Each scan document (`_source`) contains:

### Scan Metadata
```json
{
  "scan_id": "2026-02-03T14:10:08.727Z",
  "scan_id_keyword": "2026-02-03T19:40:08.727142",
  "export_timestamp": "2026-02-03T14:12:46.149Z",
  "scan_start": "2026-02-03T14:10:08.727Z",
  "scan_end": "2026-02-03T19:42:45.912614",
  "scan_duration_seconds": 157.19
}
```

### Tool Information
```json
{
  "export_type": "ENHANCED_METADATA_ONLY",
  "export_version": "6.0_PRODUCTION",
  "tool_name": "EAGLEEYE RADAR - Enterprise Network Discovery",
  "tool_version": "2.3 (Simplified)",
  "snmp_version": "2c",
  "snmp_community": "public"
}
```

### Network Information
```json
{
  "networks_scanned": "172.16.16.0/24",
  "networks_count": 1,
  "networks": [
    {
      "network": "172.16.16.0/24",
      "device_count": 0,
      "switch_count": 0,
      "router_count": 0,
      "ap_count": 0
    }
  ]
}
```

### Device Statistics
```json
{
  "total_devices": 0,
  "active_devices": 0,
  "inactive_devices": 0,
  "l2_only_devices": 0,
  "average_confidence": 0,
  
  // By OS Type
  "os_windows_count": 0,
  "os_linux_count": 0,
  "os_network_device_count": 0,
  "os_android_count": 0,
  "os_ios_count": 0,
  "os_macos_count": 0,
  "os_unknown_count": 0,
  
  // By Device Type
  "type_switch_count": 0,
  "type_router_count": 0,
  "type_ap_count": 0,
  "type_server_count": 0,
  "type_workstation_count": 0,
  "type_printer_count": 0,
  "type_iot_count": 0,
  "type_mobile_count": 0,
  "type_passive_count": 0,
  "type_l2only_count": 0,
  
  // Specific Device Counts
  "workstations_count": 0,
  "servers_count": 0,
  "switches_count": 0,
  "cameras_count": 0,
  "printers_count": 0,
  "smartphones_count": 0,
  "access_points_count": 0,
  "routers_count": 0,
  "other_network_devices_count": 0
}
```

### Name Sources & Services
```json
{
  "devices_with_domain": 0,
  "name_source_fdb": 0,
  "name_source_none": 0,
  "name_source_snmp": 0,
  "name_source_netbios": 0,
  "name_source_dhcp": 0,
  "name_source_mdns": 0,
  
  "detected_services_count": 0,
  "detected_services_all": []
}
```

### Port Statistics
```json
{
  "total_connections": 0,
  "total_neighbors": 0,
  "total_up_ports": 0,
  "total_down_ports": 0
}
```

### Timestamps
```json
{
  "@timestamp": "2026-02-03T14:12:46.159Z",
  "fluentd_ingest_timestamp": "2026-02-03T14:12:46.159Z"
}
```

## 🖥️ Radar Devices Index Structure

Each device document contains:

### Basic Information
```json
{
  "_id": "d81b2f0496fe35f05222d16dfa133c21",
  "_source": {
    "scan_id": "2026-02-03T07:12:10.065Z",
    "scan_id_keyword": "2026-02-03T12:42:10.065805",
    "export_timestamp": "2026-02-03T07:15:31.842Z",
    "device_id": 1,
    "_doc_id": "d81b2f0496fe35f05222d16dfa133c21"
  }
}
```

### Network Identity
```json
{
  "network": "172.16.16.0/24",
  "ip": "172.16.16.75",
  "mac": "Unknown MAC",
  "hostname": "Unknown Host",
  "name": "Unknown Host",
  "domain": "None"
}
```

### Device Classification
```json
{
  "type": "Server",
  "device_type": "LinuxServer",
  "vendor": "Unknown Vendor",
  "model": "Unknown",
  "detection_method": "SSH_BANNER",
  "method": "PING_ONLY",
  "confidence": 20,
  "state": "ACTIVE",
  "name_source": "None"
}
```

### Operating System
```json
{
  "os_type": "CentOS/RHEL",
  "os_version": "Unknown",
  "os_detection_method": "SSH Banner",
  "os_confidence": 70
}
```

### SNMP Information
```json
{
  "snmp_enabled": false,
  "sys_descr": "Unknown",
  "sys_object_id": "Unknown",
  "uptime": "Unknown",
  "contact": "Unknown",
  "location": "Unknown",
  "serial_number": "Unknown",
  "firmware_version": "Unknown"
}
```

### Network Services
```json
{
  "services": {
    "22": "SSH",
    "80": "HTTP"
  },
  "open_ports": [22, 80],
  "open_ports_count": 2,
  "detected_services_count": 2
}
```

### Connection Information
```json
{
  "connected_switch": "Unknown",
  "connected_port": "Unknown",
  "vlan_id": "Unknown",
  "vlan_name": "Unknown",
  "connection_path": "Unknown",
  "logged_in_user": "None"
}
```

### Port Details
```json
{
  "up_ports": [],
  "up_ports_count": 0,
  "down_ports": [],
  "down_ports_count": 0
}
```

### Topology
```json
{
  "connected_devices": [],
  "connected_devices_count": 0,
  "neighbors": [],
  "neighbors_count": 0
}
```

### Activity
```json
{
  "ping": false,
  "first_seen": "Unknown",
  "last_seen": "Unknown"
}
```

### Timestamps
```json
{
  "@timestamp": "2026-02-03T14:10:22.342Z",
  "fluentd_ingest_timestamp": "2026-02-03T14:10:22.342Z"
}
```

## 🔍 Using Raw Data

### Access in JavaScript
```javascript
import { fetchRadarScans, fetchRadarDevices } from './backend/modules/fetch.js';

// Fetch raw data (silent mode - no console output)
const scansResponse = await fetchRadarScans(10, true);
const devicesResponse = await fetchRadarDevices(50, true);

// Access the data
const totalScans = scansResponse.hits.total.value;
const scans = scansResponse.hits.hits.map(hit => hit._source);

const totalDevices = devicesResponse.hits.total.value;
const devices = devicesResponse.hits.hits.map(hit => hit._source);

// Process individual devices
devices.forEach(device => {
  console.log(`IP: ${device.ip}, Type: ${device.device_type}`);
});
```

### Custom Queries
```javascript
import { fetchScansWithQuery, fetchDevicesWithQuery } from './backend/modules/fetch.js';

// Query for devices by IP range
const query = {
  range: {
    ip: {
      gte: "172.16.16.1",
      lte: "172.16.16.100"
    }
  }
};

const result = await fetchDevicesWithQuery(query, 100);
```

## 📁 File Locations

- **Raw Data Viewer**: `backend/view-raw-data.js`
- **Saved Data**: `backend/raw_scans.json` and `backend/raw_devices.json`
- **Fetch Module**: `backend/modules/fetch.js`
- **Config Module**: `backend/modules/config.js`

## 🎯 Summary

✅ **Redundant files removed** from root
✅ **Backend module** fully functional
✅ **Raw data access** via `npm run raw`
✅ **JSON files saved** for inspection
✅ **Complete data structure** documented
✅ **Module exports** available for programmatic use
