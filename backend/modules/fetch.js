/**
 * OpenSearch Data Fetcher Module
 * Fetches data from OpenSearch indices and displays in console
 * 
 * Usage: 
 *   node modules/fetch.js                    - Run as standalone script
 *   import { fetchRadarScans } from './modules/fetch.js'  - Use as module
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  getOpenSearchConfig,
  getOpenSearchBaseUrl,
  getAuthHeader,
} from './config.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Disable TLS certificate verification for self-signed certificates
// WARNING: Only use in development/testing environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Fetch data from OpenSearch with authentication
 */
async function fetchFromOpenSearch(indexName, query = { match_all: {} }, size = 10) {
  const baseUrl = getOpenSearchBaseUrl();
  const authHeader = getAuthHeader();
  const url = `${baseUrl}/${indexName}/_search`;

  const requestBody = {
    query,
    size,
    sort: [{ '@timestamp': { order: 'desc' } }],
  };

  console.log(`\n🔍 Fetching from: ${url}`);
  console.log(`📄 Index: ${indexName}`);
  console.log(`📊 Query size: ${size}`);

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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching from OpenSearch:', error);
    throw error;
  }
}

/**
 * Fetch and display radar scans
 */
export async function fetchRadarScans(size = 10, silent = false) {
  const config = getOpenSearchConfig();
  
  if (!silent) {
    console.log('\n' + '='.repeat(80));
    console.log('📡 FETCHING RADAR SCANS');
    console.log('='.repeat(80));
  }

  try {
    const response = await fetchFromOpenSearch(config.indices.scans, { match_all: {} }, size);

    if (!silent) {
      console.log(`\n✅ Successfully fetched ${response.hits.hits.length} scans`);
      console.log(`📊 Total scans available: ${response.hits.total.value}`);
      console.log(`⏱️  Query took: ${response.took}ms`);

      response.hits.hits.forEach((hit, index) => {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`📋 SCAN #${index + 1}`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`🆔 ID: ${hit._id}`);
        console.log(`🔍 Scan ID: ${hit._source.scan_id}`);
        console.log(`📅 Start Time: ${hit._source.scan_start}`);
        console.log(`📅 End Time: ${hit._source.scan_end}`);
        console.log(`⏱️  Duration: ${hit._source.scan_duration_seconds}s`);
        console.log(`🌐 Networks Scanned: ${hit._source.networks_scanned}`);
        console.log(`🖥️  Total Devices: ${hit._source.total_devices}`);
        console.log(`✅ Active Devices: ${hit._source.active_devices}`);
        console.log(`❌ Inactive Devices: ${hit._source.inactive_devices}`);
        console.log(`🔧 Tool: ${hit._source.tool_name} v${hit._source.tool_version}`);
        console.log(`📦 Export Type: ${hit._source.export_type}`);

        if (hit._source.total_devices > 0) {
          console.log(`\n📊 Device Breakdown:`);
          console.log(`   - Switches: ${hit._source.type_switch_count || 0}`);
          console.log(`   - Routers: ${hit._source.type_router_count || 0}`);
          console.log(`   - Servers: ${hit._source.type_server_count || 0}`);
          console.log(`   - Workstations: ${hit._source.type_workstation_count || 0}`);
          console.log(`   - Access Points: ${hit._source.type_ap_count || 0}`);
          console.log(`   - Printers: ${hit._source.type_printer_count || 0}`);
        }
      });
    }

    return response;
  } catch (error) {
    console.error('❌ Failed to fetch radar scans:', error);
    throw error;
  }
}

/**
 * Fetch and display radar devices
 */
export async function fetchRadarDevices(size = 10, silent = false) {
  const config = getOpenSearchConfig();
  
  if (!silent) {
    console.log('\n' + '='.repeat(80));
    console.log('🖥️  FETCHING RADAR DEVICES');
    console.log('='.repeat(80));
  }

  try {
    const response = await fetchFromOpenSearch(config.indices.devices, { match_all: {} }, size);

    if (!silent) {
      console.log(`\n✅ Successfully fetched ${response.hits.hits.length} devices`);
      console.log(`📊 Total devices available: ${response.hits.total.value}`);
      console.log(`⏱️  Query took: ${response.took}ms`);

      response.hits.hits.forEach((hit, index) => {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`🖥️  DEVICE #${index + 1}`);
        console.log(`${'─'.repeat(80)}`);
        console.log(`🆔 ID: ${hit._id}`);
        console.log(`🔍 Scan ID: ${hit._source.scan_id}`);
        console.log(`🌐 IP Address: ${hit._source.ip}`);
        console.log(`📡 MAC Address: ${hit._source.mac}`);
        console.log(`🏷️  Hostname: ${hit._source.hostname}`);
        console.log(`📛 Name: ${hit._source.name}`);
        console.log(`🔧 Type: ${hit._source.type} (${hit._source.device_type})`);
        console.log(`🏢 Vendor: ${hit._source.vendor}`);
        console.log(`📊 Confidence: ${hit._source.confidence}%`);
        console.log(`🔍 Detection Method: ${hit._source.detection_method}`);
        console.log(`⚡ State: ${hit._source.state}`);
        console.log(`💻 OS Type: ${hit._source.os_type}`);
        console.log(`🌐 Network: ${hit._source.network}`);

        if (hit._source.connected_switch !== 'Unknown') {
          console.log(`🔌 Connected Switch: ${hit._source.connected_switch}`);
          console.log(`🔌 Connected Port: ${hit._source.connected_port}`);
        }

        if (hit._source.vlan_id !== 'Unknown') {
          console.log(`🏷️  VLAN: ${hit._source.vlan_id} (${hit._source.vlan_name})`);
        }

        if (hit._source.open_ports_count > 0) {
          console.log(`🔓 Open Ports: ${hit._source.open_ports_count}`);
        }

        if (hit._source.neighbors_count > 0) {
          console.log(`👥 Neighbors: ${hit._source.neighbors_count}`);
        }
      });
    }

    return response;
  } catch (error) {
    console.error('❌ Failed to fetch radar devices:', error);
    throw error;
  }
}

/**
 * Fetch scans with custom query
 */
export async function fetchScansWithQuery(query, size = 10) {
  const config = getOpenSearchConfig();
  return await fetchFromOpenSearch(config.indices.scans, query, size);
}

/**
 * Fetch devices with custom query
 */
export async function fetchDevicesWithQuery(query, size = 10) {
  const config = getOpenSearchConfig();
  return await fetchFromOpenSearch(config.indices.devices, query, size);
}

/**
 * Test OpenSearch connection
 */
export async function testConnection() {
  const baseUrl = getOpenSearchBaseUrl();
  const authHeader = getAuthHeader();

  console.log('\n' + '='.repeat(80));
  console.log('🔌 TESTING OPENSEARCH CONNECTION');
  console.log('='.repeat(80));
  console.log(`🌐 URL: ${baseUrl}`);

  try {
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Connection successful!');
    console.log(`📦 Cluster Name: ${data.cluster_name}`);
    console.log(`🔖 Version: ${data.version?.number}`);
    console.log(`🏷️  Distribution: ${data.version?.distribution || 'OpenSearch'}`);
    
    return data;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('\n' + '█'.repeat(80));
  console.log('🚀 OPENSEARCH DATA FETCHER');
  console.log('█'.repeat(80));

  try {
    // Load configuration
    const config = getOpenSearchConfig();
    console.log('\n📋 Configuration loaded:');
    console.log(`   - Host: ${config.host}`);
    console.log(`   - Port: ${config.port}`);
    console.log(`   - Protocol: ${config.protocol}`);
    console.log(`   - Dashboard: ${config.dashboardUrl}`);
    console.log(`   - Scans Index: ${config.indices.scans}`);
    console.log(`   - Devices Index: ${config.indices.devices}`);

    // Test connection
    await testConnection();

    // Fetch data from both indices
    await fetchRadarScans(5);
    await fetchRadarDevices(10);

    console.log('\n' + '█'.repeat(80));
    console.log('✅ DATA FETCH COMPLETED SUCCESSFULLY');
    console.log('█'.repeat(80) + '\n');
  } catch (error) {
    console.error('\n' + '█'.repeat(80));
    console.error('❌ DATA FETCH FAILED');
    console.error('█'.repeat(80));
    console.error(error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

export default {
  fetchRadarScans,
  fetchRadarDevices,
  fetchScansWithQuery,
  fetchDevicesWithQuery,
  testConnection,
};
