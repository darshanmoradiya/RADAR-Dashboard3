/**
 * OpenSearch Configuration Module
 * Centralizes all OpenSearch-related configuration using environment variables
 */

/**
 * Get OpenSearch configuration from environment variables
 */
export function getOpenSearchConfig() {
  const host = process.env.OPENSEARCH_HOST;
  const port = process.env.OPENSEARCH_PORT;
  const protocol = process.env.OPENSEARCH_PROTOCOL;
  const username = process.env.OPENSEARCH_USERNAME;
  const password = process.env.OPENSEARCH_PASSWORD;
  const dashboardUrl = process.env.OPENSEARCH_DASHBOARD_URL;
  const indexScans = process.env.OPENSEARCH_INDEX_SCANS;
  const indexDevices = process.env.OPENSEARCH_INDEX_DEVICES;

  // Validate required environment variables
  if (!host || !port || !protocol || !username || !password) {
    throw new Error(
      'Missing required OpenSearch environment variables. Please check your .env file.'
    );
  }

  return {
    host,
    port: parseInt(port, 10),
    protocol,
    username,
    password,
    dashboardUrl: dashboardUrl || `${protocol}://${host}:5601`,
    indices: {
      scans: indexScans || 'radar-scans',
      devices: indexDevices || 'radar-devices',
    },
  };
}

/**
 * Get the base URL for OpenSearch API
 */
export function getOpenSearchBaseUrl() {
  const config = getOpenSearchConfig();
  return `${config.protocol}://${config.host}:${config.port}`;
}

/**
 * Get authentication header for OpenSearch
 */
export function getAuthHeader() {
  const config = getOpenSearchConfig();
  const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
  return `Basic ${credentials}`;
}
