/**
 * RADAR Dashboard Backend API Server
 * Production-ready Express server for OpenSearch data integration
 * 
 * Features:
 * - RESTful API endpoints for latest scan data
 * - Automatic OpenSearch polling
 * - Health checks for monitoring
 * - CORS support for frontend integration
 * - Error handling and logging
 * - Docker/AWS deployment ready
 */

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOpenSearchConfig, getOpenSearchBaseUrl, getAuthHeader } from './modules/config.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Disable TLS verification for self-signed certificates (dev/test only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Cache for latest scan data
let cachedScanData = null;
let lastFetchTime = null;
let cachedScanId = null; // Track current scan_id
const CACHE_TTL = 10000; // 10 seconds cache

/**
 * Fetch latest scan with all devices from OpenSearch
 */
async function fetchLatestScanWithDevices() {
  const config = getOpenSearchConfig();
  const baseUrl = getOpenSearchBaseUrl();
  const authHeader = getAuthHeader();

  try {
    // Step 1: Fetch the absolute latest scan from radar-scans index (PRIORITY)
    // Sort by scan_id to get the absolute latest
    const scanUrl = `${baseUrl}/${config.indices.scans}/_search`;
    const scanQuery = {
      query: { match_all: {} },
      size: 1,  // Get just the latest scan
      sort: [
        { 'scan_id': { order: 'desc' } }  // Sort by scan_id
      ]
    };

    const scanResponse = await fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(scanQuery),
    });

    if (!scanResponse.ok) {
      throw new Error(`Scan fetch failed: ${scanResponse.status}`);
    }

    const scanData = await scanResponse.json();
    
    if (!scanData.hits.hits.length) {
      return { scan: null, devices: [] };
    }

    const latestScan = scanData.hits.hits[0]._source;
    const scanId = latestScan.scan_id;  // Use scan_id directly

    console.log(`📊 Latest scan found: ${scanId} (${latestScan.total_devices} devices)`);

    // Step 2: Fetch all devices for this EXACT scan_id from radar-devices
    // Use term query for exact matching on scan_id field
    const deviceUrl = `${baseUrl}/${config.indices.devices}/_search`;
    const deviceQuery = {
      query: {
        term: { 'scan_id': scanId }  // Term query for exact match on scan_id
      },
      size: 1000,
      sort: [{ '@timestamp': { order: 'desc' } }]
    };

    const deviceResponse = await fetch(deviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(deviceQuery),
    });

    if (!deviceResponse.ok) {
      const errorText = await deviceResponse.text();
      throw new Error(`Device fetch failed: ${deviceResponse.status} - ${errorText}`);
    }

    const deviceData = await deviceResponse.json();
    const devices = deviceData.hits.hits.map(hit => hit._source);
    const totalDevices = deviceData.hits.total.value;

    console.log(`📊 Scan ID: ${scanId} | Devices found: ${devices.length}/${totalDevices}`);
    
    if (devices.length === 0) {
      console.warn('⚠️  WARNING: No devices found for this scan_id!');
      console.warn('   This usually means radar-devices index has different scan_id values.');
      console.warn('   Use /api/diagnostics endpoint to check data consistency.');
    }

    // Return scan with scan_id_keyword as the primary identifier
    return { 
      scan: {
        ...latestScan,
        scan_id: scanId  // Use scan_id_keyword as the primary scan_id
      }, 
      devices 
    };
  } catch (error) {
    console.error('❌ Error fetching from OpenSearch:', error);
    throw error;
  }
}

/**
 * Transform OpenSearch data to Dashboard format
 */
function transformToRadarFormat(scan, devices) {
  if (!scan || !devices) {
    return null;
  }

  // Transform devices to dashboard format
  const deviceRecords = devices.map((device, index) => ({
    id: index + 1,
    name: device.hostname || device.name || device.ip || 'Unknown Device',
    ip: device.ip || device.ip_address || 'N/A',
    mac: device.mac || device.mac_address || 'N/A',
    vendor: device.vendor || device.manufacturer || 'Unknown',
    type: device.device_type || device.type || 'Unknown',
    network: device.network || scan.networks_scanned || 'Unknown Network',
    state: device.state || 'ACTIVE',
    confidence: device.confidence || 85,
    detection_method: device.detection_method || scan.scan_method || 'Network Scan',
    os: device.os || device.operating_system || 'Unknown',
    ports: device.open_ports || [],
    services: device.services || [],
    last_seen: device['@timestamp'] || device.discovered_at || new Date().toISOString(),
    scan_id: device.scan_id,
    // Connection and port information
    connected_switch: device.connected_switch || null,
    connected_port: device.connected_port || null,
    neighbors: device.neighbors || [],
    neighbors_count: device.neighbors_count || (device.neighbors ? device.neighbors.length : 0),
    // Switch port status
    up_ports: device.up_ports || [],
    up_ports_count: device.up_ports_count || (device.up_ports ? device.up_ports.length : 0),
    down_ports: device.down_ports || [],
    down_ports_count: device.down_ports_count || (device.down_ports ? device.down_ports.length : 0),
    // Additional port information
    open_ports: device.open_ports || [],
    open_ports_count: device.open_ports_count || (device.open_ports ? device.open_ports.length : 0)
  }));

  // Create connections based on device relationships
  const connections = [];
  devices.forEach((device, idx) => {
    if (device.connected_to || device.switch_port) {
      connections.push({
        id: connections.length + 1,
        device_id: idx + 1,
        mac_address: device.mac || device.mac_address,
        connected_to: device.connected_to,
        port: device.switch_port || device.port
      });
    }
  });

  // Create dashboard-compatible format
  return {
    export_timestamp: new Date().toISOString(),
    scan_id: scan.scan_id,
    data: {
      devices: {
        count: deviceRecords.length,
        records: deviceRecords
      },
      connections: {
        count: connections.length,
        records: connections
      },
      networks: {
        count: 1,
        records: [
          {
            id: 1,
            name: scan.networks_scanned || 'Primary Network',
            subnet: scan.network_range || 'N/A',
            scan_method: scan.scan_method || 'Unknown',
            scan_start: scan.scan_start,
            scan_end: scan.scan_end,
            scan_duration: scan.scan_duration_seconds
          }
        ]
      }
    }
  };
}

/**
 * API Endpoints
 */

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'radar-dashboard-backend',
    version: '1.0.0',
    opensearch: {
      host: process.env.OPENSEARCH_HOST,
      port: process.env.OPENSEARCH_PORT,
      protocol: process.env.OPENSEARCH_PROTOCOL
    }
  });
});

// Diagnostics endpoint - Check data consistency
app.get('/api/diagnostics', async (req, res) => {
  try {
    const config = getOpenSearchConfig();
    const baseUrl = getOpenSearchBaseUrl();
    const authHeader = getAuthHeader();

    // 1. Get latest scan
    const scanUrl = `${baseUrl}/${config.indices.scans}/_search`;
    const scanQuery = {
      query: { match_all: {} },
      size: 1,
      sort: [{ 'scan_id': { order: 'desc' } }]  // Sort by scan_id
    };

    const scanResponse = await fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(scanQuery),
    });

    const scanData = await scanResponse.json();
    const latestScan = scanData.hits.hits[0]?._source;

    if (!latestScan) {
      return res.json({
        status: 'no_data',
        message: 'No scans found in radar-scans index',
        scans_total: 0
      });
    }

    // 2. Check devices with this scan_id
    const scanIdToMatch = latestScan.scan_id;
    const deviceUrl = `${baseUrl}/${config.indices.devices}/_search`;
    const deviceQuery = {
      query: {
        term: { 'scan_id': scanIdToMatch }  // Term query for exact match
      },
      size: 0 // Just count, don't return docs
    };

    const deviceResponse = await fetch(deviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(deviceQuery),
    });

    const deviceData = await deviceResponse.json();
    const devicesWithScanId = deviceData.hits.total.value;

    // 3. Get all unique scan_ids in radar-devices
    const aggQuery = {
      size: 0,
      aggs: {
        scan_ids: {
          terms: {
            field: 'scan_id',  // Use scan_id field
            size: 20,
            order: { _key: 'desc' }
          }
        }
      }
    };

    const aggResponse = await fetch(deviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(aggQuery),
    });

    const aggData = await aggResponse.json();
    const scanIdsInDevices = aggData.aggregations.scan_ids.buckets;

    // 4. Get total device count
    const totalDevicesQuery = {
      query: { match_all: {} },
      size: 0
    };

    const totalResponse = await fetch(deviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(totalDevicesQuery),
    });

    const totalData = await totalResponse.json();
    const totalDevices = totalData.hits.total.value;

    res.json({
      status: devicesWithScanId > 0 ? 'healthy' : 'mismatch',
      timestamp: new Date().toISOString(),
      latest_scan: {
        scan_id: scanIdToMatch,  // Use scan_id as primary identifier
        timestamp: latestScan['@timestamp'],
        networks: latestScan.networks_scanned
      },
      device_statistics: {
        total_devices: totalDevices,
        devices_with_latest_scan_id: devicesWithScanId,
        match_status: devicesWithScanId > 0 ? '✅ Match' : '❌ No Match'
      },
      available_scan_ids_in_devices: scanIdsInDevices.map(bucket => ({
        scan_id: bucket.key,
        device_count: bucket.doc_count
      })),
      recommendation: devicesWithScanId === 0 
        ? 'Run a new scan or check if devices are being indexed with correct scan_id'
        : 'Data is consistent'
    });
  } catch (error) {
    console.error('❌ Diagnostics error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get latest scan with all devices
app.get('/api/latest-scan', async (req, res) => {
  try {
    const now = Date.now();
    
    // Quick check: Return cached data if within TTL
    if (cachedScanData && lastFetchTime && (now - lastFetchTime < CACHE_TTL)) {
      console.log('📦 Serving from cache (TTL active)');
      return res.json({
        ...cachedScanData,
        cached: true,
        cache_age_ms: now - lastFetchTime
      });
    }

    // Fetch latest scan_id only to check if data changed
    console.log('🔍 Checking for new scan...');
    const { scan, devices } = await fetchLatestScanWithDevices();
    
    if (!scan) {
      return res.status(404).json({
        error: 'No scans found',
        message: 'No scan data available in OpenSearch'
      });
    }

    // Check if this is a new scan (different scan_id)
    const newScanId = scan.scan_id;
    const isNewScan = newScanId !== cachedScanId;

    if (!isNewScan && cachedScanData) {
      console.log(`♻️  No new data (scan_id: ${newScanId} unchanged)`);
      // Update lastFetchTime to reset TTL but return cached data
      lastFetchTime = now;
      return res.json({
        ...cachedScanData,
        cached: true,
        scan_unchanged: true
      });
    }

    // New scan detected - transform and cache
    console.log(`✨ New scan detected: ${newScanId} (${devices.length} devices)`);
    const radarData = transformToRadarFormat(scan, devices);
    
    // Update cache with new scan
    cachedScanData = radarData;
    cachedScanId = newScanId;
    lastFetchTime = now;
    
    res.json({
      ...radarData,
      cached: false,
      scan_changed: true
    });
  } catch (error) {
    console.error('❌ Error in /api/latest-scan:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get scan by ID
app.get('/api/scan/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    const config = getOpenSearchConfig();
    const baseUrl = getOpenSearchBaseUrl();
    const authHeader = getAuthHeader();

    // Fetch specific scan
    const scanUrl = `${baseUrl}/${config.indices.scans}/_search`;
    const scanQuery = {
      query: {
        match: { scan_id: scanId }
      },
      size: 1
    };

    const scanResponse = await fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(scanQuery),
    });

    if (!scanResponse.ok) {
      throw new Error(`Scan fetch failed: ${scanResponse.status}`);
    }

    const scanData = await scanResponse.json();
    
    if (!scanData.hits.hits.length) {
      return res.status(404).json({
        error: 'Scan not found',
        message: `No scan found with ID: ${scanId}`
      });
    }

    const scan = scanData.hits.hits[0]._source;

    // Fetch devices for this scan
    const deviceUrl = `${baseUrl}/${config.indices.devices}/_search`;
    const deviceQuery = {
      query: {
        match: { scan_id: scanId }
      },
      size: 1000
    };

    const deviceResponse = await fetch(deviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(deviceQuery),
    });

    if (!deviceResponse.ok) {
      throw new Error(`Device fetch failed: ${deviceResponse.status}`);
    }

    const deviceData = await deviceResponse.json();
    const devices = deviceData.hits.hits.map(hit => hit._source);

    const radarData = transformToRadarFormat(scan, devices);
    
    res.json(radarData);
  } catch (error) {
    console.error(`❌ Error fetching scan ${req.params.scanId}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// List all available scans
app.get('/api/scans', async (req, res) => {
  try {
    const config = getOpenSearchConfig();
    const baseUrl = getOpenSearchBaseUrl();
    const authHeader = getAuthHeader();
    const size = parseInt(req.query.size) || 10;

    const scanUrl = `${baseUrl}/${config.indices.scans}/_search`;
    const scanQuery = {
      query: { match_all: {} },
      size,
      sort: [{ '@timestamp': { order: 'desc' } }]
    };

    const scanResponse = await fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(scanQuery),
    });

    if (!scanResponse.ok) {
      throw new Error(`Scan fetch failed: ${scanResponse.status}`);
    }

    const scanData = await scanResponse.json();
    const scans = scanData.hits.hits.map(hit => ({
      scan_id: hit._source.scan_id,
      timestamp: hit._source['@timestamp'],
      start_time: hit._source.scan_start,
      end_time: hit._source.scan_end,
      duration_seconds: hit._source.scan_duration_seconds,
      networks_scanned: hit._source.networks_scanned,
      total_devices: hit._source.total_devices,
      scan_method: hit._source.scan_method
    }));

    res.json({
      total: scanData.hits.total.value,
      count: scans.length,
      scans
    });
  } catch (error) {
    console.error('❌ Error fetching scans list:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 RADAR Dashboard Backend Server');
  console.log('='.repeat(80));
  console.log(`📡 Server running at http://${HOST}:${PORT}`);
  console.log(`🔍 OpenSearch: ${process.env.OPENSEARCH_PROTOCOL}://${process.env.OPENSEARCH_HOST}:${process.env.OPENSEARCH_PORT}`);
  console.log(`📊 Indices: ${process.env.OPENSEARCH_INDEX_SCANS}, ${process.env.OPENSEARCH_INDEX_DEVICES}`);
  console.log('\n📚 Available Endpoints:');
  console.log(`   GET  http://${HOST}:${PORT}/api/health           - Health check`);
  console.log(`   GET  http://${HOST}:${PORT}/api/latest-scan      - Get latest scan with devices`);
  console.log(`   GET  http://${HOST}:${PORT}/api/scan/:scanId     - Get specific scan`);
  console.log(`   GET  http://${HOST}:${PORT}/api/scans?size=10    - List all scans`);
  console.log(`   GET  http://${HOST}:${PORT}/api/diagnostics      - Check data consistency`);
  console.log('='.repeat(80));
  console.log('✨ Server ready for production deployment\n');
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error('❌ ERROR: Port', PORT, 'is already in use!');
    console.error('');
    console.error('💡 Solutions:');
    console.error('   1. Kill the process using port', PORT);
    console.error('      Windows: Get-Process node | Stop-Process -Force');
    console.error('   2. Or change the port in .env file');
    console.error('      PORT=3002');
    console.error('');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
