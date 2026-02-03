# Latest Scan Data Fetcher - Quick Reference

## ✅ What Changed

**Old behavior:** Fetched multiple scans and random devices
**New behavior:** Fetches ONLY the latest scan and ALL devices from that scan

## 🚀 Usage

```bash
cd backend
npm run latest
```

## 📊 Generated Files

### 1. latest_scan_only.json (17 KB)
Contains only the scan metadata for the most recent scan with devices.

**Example structure:**
```json
{
  "_index": "radar-scans",
  "_id": "2026-02-03T07:12:10.065Z",
  "_source": {
    "scan_id": "2026-02-03T07:12:10.065Z",
    "scan_start": "2026-02-03T07:12:10.065Z",
    "networks_scanned": "172.16.16.0/24",
    "total_devices": 13,
    "active_devices": 12,
    // ... all scan metadata
  }
}
```

### 2. latest_scan_devices.json (24 KB)
Contains ALL devices that belong to the latest scan (matched by scan_id).

**Example structure:**
```json
{
  "scan_id": "2026-02-03T07:12:10.065Z",
  "total": 12,
  "devices": [
    {
      "_index": "radar-devices",
      "_id": "...",
      "_source": {
        "scan_id": "2026-02-03T07:12:10.065Z",
        "ip": "172.16.16.75",
        "device_type": "ACTIVE_HOST",
        "state": "ACTIVE",
        // ... all device fields
      }
    },
    // ... more devices
  ]
}
```

### 3. latest_scan_complete.json (42 KB)
Contains both the scan and all its devices in one file.

**Example structure:**
```json
{
  "scan": { /* scan data */ },
  "devices": [ /* array of devices */ ],
  "metadata": {
    "scan_id": "2026-02-03T07:12:10.065Z",
    "total_devices": 12,
    "fetched_devices": 12,
    "fetch_timestamp": "2026-02-03T20:15:26.123Z"
  }
}
```

## 🔍 How It Works

1. **Query for Latest Scan with Devices**
   - Searches `radar-scans` index
   - Filters: `total_devices > 0`
   - Sorts by `@timestamp` descending
   - Returns top 1 result

2. **Extract Scan ID**
   - Gets `scan_id` from the latest scan
   - Example: `"2026-02-03T07:12:10.065Z"`

3. **Query All Devices for That Scan**
   - Searches `radar-devices` index
   - Filter: `scan_id` matches the extracted ID
   - Size: 1000 (gets all devices)

4. **Save Data**
   - Three separate JSON files for different use cases
   - All devices guaranteed to belong to the same scan

## 📋 Current Data

**Latest Scan:**
- Scan ID: `2026-02-03T07:12:10.065Z`
- Network: `172.16.16.0/24`
- Total Devices: 13 (12 fetched)
- Duration: 201.51 seconds

**Device Breakdown:**
- ACTIVE_HOST: 8 devices
- LinuxServer: 3 devices  
- Network Device: 1 device

## 💡 Key Benefits

✅ **Consistency:** All devices are from the same scan
✅ **Latest Data:** Always fetches the most recent scan
✅ **Complete:** Gets ALL devices for that scan (not limited to 10)
✅ **Organized:** Separate files for different use cases
✅ **Filtered:** Skips scans with 0 devices (unless no devices exist)

## 🔧 Use Cases

### For Dashboard Display
Use `latest_scan_complete.json` - has everything in one place.

### For API Integration
Use separate files:
- `latest_scan_only.json` for scan metadata
- `latest_scan_devices.json` for device list

### For Data Processing
Use `latest_scan_devices.json` to process device data:
```javascript
const data = JSON.parse(fs.readFileSync('latest_scan_devices.json'));
data.devices.forEach(device => {
  const d = device._source;
  console.log(`${d.ip} - ${d.device_type}`);
});
```

## 📝 Available Scripts

- `npm run fetch` - Test connection and view formatted data
- `npm run latest` - Fetch latest scan with all devices
- `npm run raw` - Fetch raw data (old method - multiple scans)

## 🗑️ Removed Files

- ❌ `raw_scans.json` - Contained multiple scans
- ❌ `raw_devices.json` - Contained unrelated devices
- ❌ `fetch-latest.js` - Old version without device filtering

## 🎯 Summary

You now have a clean, focused data fetcher that gives you:
- ✅ The most recent scan only
- ✅ All devices from that specific scan
- ✅ Data matched by scan_id
- ✅ Three file formats for flexibility
