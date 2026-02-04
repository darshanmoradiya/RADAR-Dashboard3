import https from 'https';

const options = {
  hostname: '192.168.92.143',
  port: 9200,
  path: '/radar-scans/_search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from('admin:TestPass@123!').toString('base64')
  },
  rejectUnauthorized: false
};

const query = JSON.stringify({
  query: { match_all: {} },
  size: 10,
  sort: [{ 'scan_id': { order: 'desc' } }],
  _source: ['scan_id', '@timestamp', 'export_timestamp', 'total_devices', 'active_devices']
});

console.log('\n🔍 Fetching all scans from OpenSearch...\n');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const result = JSON.parse(data);
    
    console.log(`Total scans in radar-scans: ${result.hits.total.value}\n`);
    console.log('Latest 10 scans (sorted by scan_id desc):');
    console.log('='.repeat(80));
    
    result.hits.hits.forEach((hit, idx) => {
      const source = hit._source;
      console.log(`\n${idx + 1}. scan_id: ${source.scan_id}`);
      console.log(`   @timestamp: ${source['@timestamp']}`);
      console.log(`   export_timestamp: ${source.export_timestamp || 'N/A'}`);
      console.log(`   total_devices: ${source.total_devices || 'N/A'}`);
      console.log(`   active_devices: ${source.active_devices || 'N/A'}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 The backend should fetch:', result.hits.hits[0]._source.scan_id);
    console.log('');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(query);
req.end();
