import json
from datetime import datetime

# Read the source file
with open('raw_data_complete.jsonl', 'r') as f:
    source_data = json.load(f)

# Transform to dashboard format
dashboard_data = {
    "export_timestamp": datetime.now().isoformat(),
    "export_type": "COMPLETE_RAW_SCAN_DATA",
    "database_source": "network_scanner.db",
    "data": {
        "devices": {
            "count": 0,
            "records": []
        },
        "connections": {
            "count": 0,
            "records": []
        },_
        "neighbors": {
            "count": 0,
            "records": []
        },
        "scan_metadata": [],
        "scan_state": {
            "count": 0,
            "records": []
        },
        "device_type_breakdown": {},
        "vendor_breakdown": {},
        "name_resolution_sources": {},
        "confidence_distribution": {},
        "port_analysis": {}
    }
}

# Extract devices  
if 'devices' in source_data:
    devices_data = source_data['devices']
    
    # Get all devices
    if 'all_devices' in devices_data and isinstance(devices_data['all_devices'], list):
        all_devices = devices_data['all_devices']
        
        # Improve device type detection
        for device in all_devices:
            vendor = device.get('vendor', '').lower()
            name = device.get('name', '').lower()
            old_type = device.get('type', '')
            
            # Enhanced type detection based on vendor and name
            # Only mark X460G2-48p-G4 as switch - the actual network switch
            if 'x460g2' in name or (name == 'x460g2-48p-g4'):
                device['type'] = 'Switch'
            elif 'hikvision' in vendor or 'dahua' in vendor:
                device['type'] = 'IP Camera'
            elif 'mist' in vendor or 'access point' in old_type.lower():
                device['type'] = 'Access Point'
            elif 'sophos' in vendor or 'firewall' in old_type.lower():
                device['type'] = 'Firewall'
            elif 'apple' in vendor and 'iphone' not in old_type.lower():
                device['type'] = 'Smartphone (iOS)'
            elif 'samsung' in vendor and 'phone' not in old_type.lower():
                device['type'] = 'Smartphone (Android)'
            elif 'google' in vendor:
                device['type'] = 'Android Device'
            # Keep original type if already well-defined
            elif old_type and old_type not in ['L2_ONLY', 'UNKNOWN', 'Generic']:
                pass
            
        dashboard_data['data']['devices']['records'] = all_devices
        dashboard_data['data']['devices']['count'] = len(all_devices)
        
        print(f"Found {len(all_devices)} devices")

# Extract connections
if 'connections' in source_data:
    connections_data = source_data['connections']
    
    # Get all connections
    if 'all_connections' in connections_data and isinstance(connections_data['all_connections'], list):
        all_conns = connections_data['all_connections']
        dashboard_data['data']['connections']['records'] = all_conns
        dashboard_data['data']['connections']['count'] = len(all_conns)
        
        print(f"Found {len(all_conns)} connections")

# Write output
with open('public/raw_data_complete.jsonl', 'w') as f:
    json.dump(dashboard_data, f, indent=2)

print(f"\n✓ Transformed data written to public/raw_data_complete.jsonl")
print(f"  - {dashboard_data['data']['devices']['count']} devices")
print(f"  - {dashboard_data['data']['connections']['count']} connections")
