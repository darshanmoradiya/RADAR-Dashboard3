/**
 * Test runner for fetch module
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Disable TLS verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Import and run
import('./modules/fetch.js').then(async (fetchModule) => {
  console.log('\n' + '█'.repeat(80));
  console.log('🚀 BACKEND OPENSEARCH DATA FETCHER');
  console.log('█'.repeat(80));

  try {
    // Test connection
    await fetchModule.testConnection();

    // Fetch scans
    await fetchModule.fetchRadarScans(5);

    // Fetch devices
    await fetchModule.fetchRadarDevices(10);

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
}).catch(error => {
  console.error('Failed to load fetch module:', error);
  process.exit(1);
});
