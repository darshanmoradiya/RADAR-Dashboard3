/**
 * Latest Scan with Devices Fetcher
 * Fetches the most recent scan that actually has devices
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import {
  getOpenSearchConfig,
  getOpenSearchBaseUrl,
  getAuthHeader,
} from './modules/config.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Disable TLS verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Fetch data from OpenSearch with authentication
 */
async function fetchFromOpenSearch(indexName, query, size = 10) {
  const baseUrl = getOpenSearchBaseUrl();
  const authHeader = getAuthHeader();
  const url = `${baseUrl}/${indexName}/_search`;

  const requestBody = {
    query,
    size,
    sort: [{ '@timestamp': { order: 'desc' } }],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenSearch request failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching from OpenSearch:', error);
    throw error;
  }
}

/**
 * Fetch the absolute latest scan (regardless of device count)
 */
async function fetchLatestScanWithDevices() {
  const config = getOpenSearchConfig();
  console.log('\n' + '='.repeat(80));
  console.log('📡 FETCHING ABSOLUTE LATEST SCAN');
  console.log('='.repeat(80));

  // Query to get the most recent scan (no filtering)
  const query = { match_all: {} };

  const response = await fetchFromOpenSearch(
    config.indices.scans,
    query,
    1  // Only get 1 result - the absolute latest
  );

  if (response.hits.hits.length === 0) {
    throw new Error('No scans found in the index');
  }

  const latestScan = response.hits.hits[0];
  console.log(`\n✅ Found latest scan:`);
  console.log(`   Scan ID: ${latestScan._source.scan_id}`);
  console.log(`   Start Time: ${latestScan._source.scan_start}`);
  console.log(`   End Time: ${latestScan._source.scan_end || 'In Progress'}`);
  console.log(`   Networks: ${latestScan._source.networks_scanned}`);
  console.log(`   Total Devices: ${latestScan._source.total_devices || 0}`);
  console.log(`   Active Devices: ${latestScan._source.active_devices || 0}`);

  return latestScan;
}

/**
 * Fetch all devices for a specific scan_id
 */
async function fetchDevicesForScan(scanId) {
  const config = getOpenSearchConfig();
  console.log('\n' + '='.repeat(80));
  console.log('🖥️  FETCHING DEVICES FOR SCAN');
  console.log('='.repeat(80));
  console.log(`   Scan ID: ${scanId}`);

  // Query to match specific scan_id
  const query = {
    match: {
      scan_id: scanId
    }
  };

  // Fetch with a large size to get all devices for this scan
  const response = await fetchFromOpenSearch(
    config.indices.devices,
    query,
    1000  // Increased size to get all devices
  );

  console.log(`\n✅ Found ${response.hits.hits.length} devices for this scan`);
  console.log(`   Total available: ${response.hits.total.value}`);

  return response;
}

/**
 * Main execution function
 */
async function main() {
  console.log('\n' + '█'.repeat(80));
  console.log('🚀 ABSOLUTE LATEST SCAN FETCHER');
  console.log('█'.repeat(80));

  try {
    // Step 1: Fetch the latest scan with devices
    const latestScan = await fetchLatestScanWithDevices();
    const scanId = latestScan._source.scan_id;

    // Step 2: Fetch all devices for that scan
    const devicesResponse = await fetchDevicesForScan(scanId);

    // Step 3: Prepare the data structure
    const latestScanData = {
      scan: latestScan,
      devices: devicesResponse.hits.hits,
      metadata: {
        scan_id: scanId,
        total_devices: devicesResponse.hits.total.value,
        fetched_devices: devicesResponse.hits.hits.length,
        fetch_timestamp: new Date().toISOString()
      }
    };

    // Step 4: Display summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 DATA SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n📋 Scan Information:`);
    console.log(`   ID: ${latestScan._source.scan_id}`);
    console.log(`   Networks: ${latestScan._source.networks_scanned}`);
    console.log(`   Duration: ${latestScan._source.scan_duration_seconds}s`);
    console.log(`   Export Type: ${latestScan._source.export_type}`);
    console.log(`   Tool: ${latestScan._source.tool_name}`);

    console.log(`\n🖥️  Devices:`);
    console.log(`   Total: ${devicesResponse.hits.total.value}`);
    console.log(`   Fetched: ${devicesResponse.hits.hits.length}`);

    if (devicesResponse.hits.hits.length > 0) {
      // Group devices by type
      const devicesByType = {};
      devicesResponse.hits.hits.forEach(device => {
        const type = device._source.device_type || 'Unknown';
        if (!devicesByType[type]) {
          devicesByType[type] = [];
        }
        devicesByType[type].push(device);
      });

      console.log(`\n   Device Types:`);
      Object.keys(devicesByType).forEach(type => {
        console.log(`   - ${type}: ${devicesByType[type].length}`);
      });

      console.log(`\n   Sample Devices:`);
      devicesResponse.hits.hits.slice(0, 10).forEach((device, idx) => {
        const src = device._source;
        console.log(`   ${idx + 1}. ${src.ip.padEnd(15)} | ${(src.device_type || 'Unknown').padEnd(20)} | ${src.state} | Confidence: ${src.confidence}%`);
      });
      if (devicesResponse.hits.hits.length > 10) {
        console.log(`   ... and ${devicesResponse.hits.hits.length - 10} more`);
      }
    }

    // Step 5: Save to files
    console.log('\n' + '='.repeat(80));
    console.log('💾 SAVING DATA');
    console.log('='.repeat(80));

    // Save complete data
    fs.writeFileSync(
      'latest_scan_complete.json',
      JSON.stringify(latestScanData, null, 2)
    );
    console.log('✅ Complete data saved to: latest_scan_complete.json');

    // Save just the scan
    fs.writeFileSync(
      'latest_scan_only.json',
      JSON.stringify(latestScan, null, 2)
    );
    console.log('✅ Scan data saved to: latest_scan_only.json');

    // Save just the devices
    fs.writeFileSync(
      'latest_scan_devices.json',
      JSON.stringify({
        scan_id: scanId,
        total: devicesResponse.hits.total.value,
        devices: devicesResponse.hits.hits
      }, null, 2)
    );
    console.log('✅ Devices data saved to: latest_scan_devices.json');

    console.log('\n' + '█'.repeat(80));
    console.log('✅ LATEST SCAN DATA FETCH COMPLETED');
    console.log('█'.repeat(80));
    console.log(`\n📁 Files created:`);
    console.log(`   - latest_scan_complete.json (${latestScanData.devices.length} devices + scan metadata)`);
    console.log(`   - latest_scan_only.json (scan metadata only)`);
    console.log(`   - latest_scan_devices.json (${latestScanData.devices.length} devices only)`);
    console.log('\n');

  } catch (error) {
    console.error('\n' + '█'.repeat(80));
    console.error('❌ DATA FETCH FAILED');
    console.error('█'.repeat(80));
    console.error(error);
    process.exit(1);
  }
}

// Execute
main();
