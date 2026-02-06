import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOpenSearchConfig, getOpenSearchBaseUrl, getAuthHeader } from './modules/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkRawData() {
  const config = getOpenSearchConfig();
  const baseUrl = getOpenSearchBaseUrl();
  const authHeader = getAuthHeader();

  console.log('\n=== CHECKING RAW OPENSEARCH DATA ===\n');

  try {
    // 1. Get latest scan from radar-scans
    console.log('📊 Fetching latest scan from radar-scans...');
    const scanUrl = `${baseUrl}/${config.indices.scans}/_search`;
    const scanQuery = {
      query: { match_all: {} },
      size: 1,
      sort: [{ '@timestamp': { order: 'desc' } }]
    };

    const scanResponse = await fetch(scanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(scanQuery),
    });

    const scanData = await scanResponse.json();
    const latestScan = scanData.hits.hits[0]?._source;

    if (latestScan) {
      console.log('\n✅ Latest Scan Data:');
      console.log(JSON.stringify(latestScan, null, 2));
      console.log('\n📋 scan_id:', latestScan.scan_id);
      console.log('📋 scan_id type:', typeof latestScan.scan_id);
    }

    // 2. Get sample devices from radar-devices
    console.log('\n\n📱 Fetching sample devices from radar-devices...');
    const deviceUrl = `${baseUrl}/${config.indices.devices}/_search`;
    const deviceQuery = {
      query: { match_all: {} },
      size: 3,
      sort: [{ '@timestamp': { order: 'desc' } }]
    };

    const deviceResponse = await fetch(deviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(deviceQuery),
    });

    const deviceData = await deviceResponse.json();
    
    console.log('\n✅ Sample Device Records:');
    deviceData.hits.hits.forEach((hit, idx) => {
      console.log(`\n--- Device ${idx + 1} ---`);
      console.log(JSON.stringify(hit._source, null, 2));
      console.log('scan_id:', hit._source.scan_id, '(type:', typeof hit._source.scan_id, ')');
    });

    // 3. Get field mappings
    console.log('\n\n🗺️  Checking field mappings...');
    const mappingUrl = `${baseUrl}/${config.indices.devices}/_mapping`;
    const mappingResponse = await fetch(mappingUrl, {
      method: 'GET',
      headers: { Authorization: authHeader },
    });

    const mappingData = await mappingResponse.json();
    const properties = mappingData[config.indices.devices]?.mappings?.properties || {};
    
    console.log('\n✅ Key Field Mappings:');
    console.log('- scan_id:', JSON.stringify(properties.scan_id, null, 2));
    console.log('- device_type:', JSON.stringify(properties.device_type, null, 2));
    console.log('- type:', JSON.stringify(properties.type, null, 2));
    console.log('- hostname:', JSON.stringify(properties.hostname, null, 2));
    console.log('- name:', JSON.stringify(properties.name, null, 2));

    // 4. Get device type aggregation
    console.log('\n\n📊 Device Type Distribution...');
    const aggQuery = {
      size: 0,
      aggs: {
        device_types: {
          terms: {
            field: 'device_type.keyword',
            size: 20
          }
        },
        types: {
          terms: {
            field: 'type.keyword',
            size: 20
          }
        }
      }
    };

    const aggResponse = await fetch(deviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(aggQuery),
    });

    const aggData = await aggResponse.json();
    
    console.log('\n✅ Device Types (device_type field):');
    aggData.aggregations.device_types.buckets.forEach(bucket => {
      console.log(`  - ${bucket.key}: ${bucket.doc_count} devices`);
    });

    console.log('\n✅ Types (type field):');
    aggData.aggregations.types.buckets.forEach(bucket => {
      console.log(`  - ${bucket.key}: ${bucket.doc_count} devices`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRawData();
