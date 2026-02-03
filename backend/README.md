# RADAR Dashboard Backend

Backend services for the RADAR Network Discovery Dashboard. Provides data fetching capabilities from OpenSearch.

## 📁 Structure

```
backend/
├── modules/
│   ├── config.js          # OpenSearch configuration
│   └── fetch.js           # Data fetcher module
├── .env                   # Environment variables (not committed)
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your OpenSearch settings:
```env
OPENSEARCH_HOST=192.168.92.143
OPENSEARCH_PORT=9200
OPENSEARCH_PROTOCOL=https
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD="MyStrong#Pass90"
```

### 3. Test Connection

```bash
npm run fetch
```

## 📦 Available Scripts

- `npm start` - Start the backend server
- `npm run fetch` - Run the data fetcher
- `npm run test:connection` - Test OpenSearch connection

## 📖 Module Usage

### As a Module

Import and use in your Node.js code:

```javascript
import { 
  fetchRadarScans, 
  fetchRadarDevices,
  testConnection 
} from './modules/fetch.js';

// Test connection
await testConnection();

// Fetch scans (silent mode - returns data without console output)
const scans = await fetchRadarScans(10, true);

// Fetch devices with console output
const devices = await fetchRadarDevices(20, false);
```

### As a Standalone Script

```bash
node test-fetch.js
```

Or use the npm script:
```bash
npm run fetch
```

## 🔧 API Reference

### `testConnection()`
Test connection to OpenSearch server.

**Returns:** Promise with cluster information

### `fetchRadarScans(size, silent)`
Fetch radar scans from OpenSearch.

**Parameters:**
- `size` (number, default: 10) - Number of scans to fetch
- `silent` (boolean, default: false) - Suppress console output

**Returns:** Promise with OpenSearch response

### `fetchRadarDevices(size, silent)`
Fetch radar devices from OpenSearch.

**Parameters:**
- `size` (number, default: 10) - Number of devices to fetch
- `silent` (boolean, default: false) - Suppress console output

**Returns:** Promise with OpenSearch response

### `fetchScansWithQuery(query, size)`
Fetch scans with custom OpenSearch query.

**Parameters:**
- `query` (object) - OpenSearch query DSL
- `size` (number, default: 10) - Number of results

**Returns:** Promise with OpenSearch response

### `fetchDevicesWithQuery(query, size)`
Fetch devices with custom OpenSearch query.

**Parameters:**
- `query` (object) - OpenSearch query DSL
- `size` (number, default: 10) - Number of results

**Returns:** Promise with OpenSearch response

## 🔒 Security

- ⚠️ TLS verification is disabled for self-signed certificates (development only)
- 🔐 Never commit the `.env` file
- 🔑 Passwords with special characters must be quoted in `.env`

## 📊 Data Structure

### Radar Scans Index
Contains network scan metadata, device counts, and statistics.

### Radar Devices Index
Contains individual device information including IP, MAC, type, OS, connections, etc.

## 🛠️ Configuration

All configuration is managed through environment variables in `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENSEARCH_HOST` | OpenSearch server hostname | `192.168.92.143` |
| `OPENSEARCH_PORT` | OpenSearch server port | `9200` |
| `OPENSEARCH_PROTOCOL` | Protocol (http/https) | `https` |
| `OPENSEARCH_USERNAME` | Authentication username | `admin` |
| `OPENSEARCH_PASSWORD` | Authentication password | `"MyStrong#Pass90"` |
| `OPENSEARCH_INDEX_SCANS` | Scans index name | `radar-scans` |
| `OPENSEARCH_INDEX_DEVICES` | Devices index name | `radar-devices` |

## 📝 Example Output

```
🚀 OPENSEARCH DATA FETCHER
================================================================================
📋 Configuration loaded:
   - Host: 192.168.92.143
   - Port: 9200
   - Protocol: https
   
🔌 TESTING OPENSEARCH CONNECTION
✅ Connection successful!
📦 Cluster Name: opensearch
🔖 Version: 3.4.0

📡 FETCHING RADAR SCANS
✅ Successfully fetched 5 scans
📊 Total scans available: 7
```

## 🐛 Troubleshooting

### Connection Errors

Check OpenSearch is accessible:
```bash
curl -k -u "admin:MyStrong#Pass90" https://192.168.92.143:9200
```

### Environment Variable Issues

Ensure `.env` file exists and variables are properly quoted:
```bash
cat .env | grep PASSWORD
```

### Module Import Errors

Verify `package.json` has `"type": "module"` for ES6 imports.
