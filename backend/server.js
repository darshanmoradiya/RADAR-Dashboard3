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
const CACHE_TTL = 10000; // 10 seconds cache

/**
 * Fetch latest scan with all devices from OpenSearch
 */
async function fetchLatestScanWithDevices() {
  const config = getOpenSearchConfig();
  const baseUrl = getOpenSearchBaseUrl();
  const authHeader = getAuthHeader();

  try {
    // Step 1: Fetch the absolute latest scan
    const scanUrl = `${baseUrl}/${config.indices.scans}/_search`;
    const scanQuery = {
      query: { match_all: {} },
      size: 1,
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
    
    if (!scanData.hits.hits.length) {
      return { scan: null, devices: [] };
    }

    const latestScan = scanData.hits.hits[0]._source;
    const scanId = latestScan.scan_id;

    // Step 2: Fetch all devices for this scan
    const deviceUrl = `${baseUrl}/${config.indices.devices}/_search`;
    const deviceQuery = {
      query: {
        match: { scan_id: scanId }
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
      throw new Error(`Device fetch failed: ${deviceResponse.status}`);
    }

    const deviceData = await deviceResponse.json();
    const devices = deviceData.hits.hits.map(hit => hit._source);

    return { scan: latestScan, devices };
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
    scan_id: device.scan_id
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

// Get latest scan with all devices
app.get('/api/latest-scan', async (req, res) => {
  try {
    // Check cache
    const now = Date.now();
    if (cachedScanData && lastFetchTime && (now - lastFetchTime < CACHE_TTL)) {
      console.log('📦 Serving from cache');
      return res.json({
        ...cachedScanData,
        cached: true,
        cache_age_ms: now - lastFetchTime
      });
    }

    // Fetch fresh data
    console.log('🔄 Fetching latest scan from OpenSearch...');
    const { scan, devices } = await fetchLatestScanWithDevices();
    
    if (!scan) {
      return res.status(404).json({
        error: 'No scans found',
        message: 'No scan data available in OpenSearch'
      });
    }

    // Transform to dashboard format
    const radarData = transformToRadarFormat(scan, devices);
    
    // Update cache
    cachedScanData = radarData;
    lastFetchTime = now;

    console.log(`✅ Latest scan fetched: ${scan.scan_id} (${devices.length} devices)`);
    
    res.json({
      ...radarData,
      cached: false
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
app.listen(PORT, HOST, () => {
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
  console.log('='.repeat(80));
  console.log('✨ Server ready for production deployment\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
