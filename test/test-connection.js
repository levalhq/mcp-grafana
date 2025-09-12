#!/usr/bin/env node

/**
 * Test basic connection to Grafana instance
 */

require('dotenv').config();
const axios = require('axios');

const GRAFANA_URL = process.env.GRAFANA_URL;
const TOKEN = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN;

console.log('🔌 Testing Grafana Connection');
console.log('==============================');
console.log(`URL: ${GRAFANA_URL}`);
console.log(`Token: ${TOKEN ? '✓ Present' : '✗ Missing'}\n`);

async function testConnection() {
  try {
    // Test basic API access
    const response = await axios.get(`${GRAFANA_URL}/api/org`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Connection successful!');
    console.log(`Organization: ${response.data.name}`);
    console.log(`ID: ${response.data.id}\n`);

    // Test datasources endpoint
    const dsResponse = await axios.get(`${GRAFANA_URL}/api/datasources`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    console.log(`📊 Found ${dsResponse.data.length} datasources:`);
    dsResponse.data.forEach(ds => {
      console.log(`  - ${ds.name} (${ds.type})`);
    });

    // Test dashboards search
    const dashResponse = await axios.get(`${GRAFANA_URL}/api/search?type=dash-db`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    console.log(`\n📈 Found ${dashResponse.data.length} dashboards`);
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.error('   Authentication failed - check your service account token');
    }
    return false;
  }
}

testConnection();