/**
 * Raw Data Viewer - Shows unformatted JSON data from OpenSearch
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Disable TLS verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Import fetch module
import('./modules/fetch.js').then(async (fetchModule) => {
  console.log('='.repeat(80));
  console.log('RAW DATA FROM OPENSEARCH');
  console.log('='.repeat(80));

  try {
    // Fetch scans silently (returns raw data)
    console.log('\n[FETCHING RADAR SCANS - RAW DATA]');
    console.log('-'.repeat(80));
    const scansResponse = await fetchModule.fetchRadarScans(3, true);
    console.log('\nRAW SCANS RESPONSE:');
    console.log(JSON.stringify(scansResponse, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('\n[FETCHING RADAR DEVICES - RAW DATA]');
    console.log('-'.repeat(80));
    const devicesResponse = await fetchModule.fetchRadarDevices(5, true);
    console.log('\nRAW DEVICES RESPONSE:');
    console.log(JSON.stringify(devicesResponse, null, 2));

    // Save to files
    console.log('\n' + '='.repeat(80));
    console.log('\n[SAVING RAW DATA TO FILES]');
    fs.writeFileSync('raw_scans.json', JSON.stringify(scansResponse, null, 2));
    console.log('✅ Saved to: raw_scans.json');
    
    fs.writeFileSync('raw_devices.json', JSON.stringify(devicesResponse, null, 2));
    console.log('✅ Saved to: raw_devices.json');

    console.log('\n' + '='.repeat(80));
    console.log('✅ RAW DATA FETCH COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Failed to fetch raw data:', error);
    process.exit(1);
  }
}).catch(error => {
  console.error('Failed to load fetch module:', error);
  process.exit(1);
});
