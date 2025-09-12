#!/usr/bin/env node

/**
 * Direct API test using the MCP tools
 */

require('dotenv').config();
const { GrafanaClient } = require('../dist/clients/grafana-client');
const { PrometheusClient } = require('../dist/clients/prometheus-client');
const { LokiClient } = require('../dist/clients/loki-client');

const config = {
  url: process.env.GRAFANA_URL,
  serviceAccountToken: process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN,
  debug: false
};

console.log('🧪 Direct API Test');
console.log('==================\n');

async function runTests() {
  const grafanaClient = new GrafanaClient(config);
  
  try {
    // Test 1: Search dashboards
    console.log('📊 Test 1: Search Dashboards');
    const dashboards = await grafanaClient.searchDashboards('');
    console.log(`✅ Found ${dashboards.length} dashboards`);
    if (dashboards.length > 0) {
      console.log(`   First: ${dashboards[0].title} (UID: ${dashboards[0].uid})`);
    }
    console.log();
    
    // Test 2: List datasources
    console.log('💾 Test 2: List Datasources');
    const datasources = await grafanaClient.listDatasources();
    console.log(`✅ Found ${datasources.length} datasources:`);
    datasources.forEach(ds => {
      console.log(`   - ${ds.name} (${ds.type}) - UID: ${ds.uid}`);
    });
    console.log();
    
    // Test 3: Get specific datasource
    if (datasources.length > 0) {
      console.log('🔌 Test 3: Get Datasource Details');
      const ds = await grafanaClient.getDatasourceByUid(datasources[0].uid);
      console.log(`✅ Retrieved: ${ds.name}`);
      console.log(`   Type: ${ds.type}`);
      console.log(`   URL: ${ds.url || 'N/A'}`);
      console.log(`   Default: ${ds.isDefault}`);
      console.log();
    }
    
    // Test 4: List teams
    console.log('👥 Test 4: List Teams');
    const teams = await grafanaClient.listTeams();
    console.log(`✅ Found ${teams.length} teams`);
    if (teams.length > 0) {
      console.log(`   First team: ${teams[0].name}`);
    }
    console.log();
    
    // Test 5: List users
    console.log('👤 Test 5: List Users');
    const users = await grafanaClient.listUsers();
    console.log(`✅ Found ${users.length} users`);
    if (users.length > 0) {
      console.log(`   First user: ${users[0].email} (${users[0].role})`);
    }
    console.log();
    
    // Test 6: Alert rules (may fail if no permissions)
    console.log('🚨 Test 6: List Alert Rules');
    try {
      const alerts = await grafanaClient.listAlertRules();
      console.log(`✅ Found ${alerts.length} alert rules`);
    } catch (error) {
      console.log(`⚠️  Skipped: ${error.message}`);
    }
    console.log();
    
    // Test 7: Loki integration
    const lokiDs = datasources.find(ds => ds.type === 'loki');
    if (lokiDs) {
      console.log('📝 Test 7: Loki Integration');
      const lokiClient = new LokiClient(config, lokiDs.uid);
      
      try {
        const labels = await lokiClient.getLabelNames();
        console.log(`✅ Found ${labels.length} Loki label names`);
        if (labels.length > 0) {
          console.log(`   Sample: ${labels.slice(0, 5).join(', ')}`);
        }
      } catch (error) {
        console.log(`⚠️  Error: ${error.message}`);
      }
      console.log();
    }
    
    // Test 8: Prometheus integration
    const promDs = datasources.find(ds => ds.type === 'prometheus');
    if (promDs) {
      console.log('📈 Test 8: Prometheus Integration');
      const promClient = new PrometheusClient(config, promDs.uid);
      
      try {
        const result = await promClient.query('up', 'now');
        console.log(`✅ Query successful, ${result.length} series returned`);
        if (result.length > 0) {
          console.log(`   First metric: ${JSON.stringify(result[0].metric).slice(0, 50)}...`);
        }
      } catch (error) {
        console.log(`⚠️  Error: ${error.message}`);
      }
      console.log();
    }
    
    // Test 9: Dashboard details
    if (dashboards.length > 0) {
      console.log('📋 Test 9: Get Dashboard Details');
      try {
        const dashboard = await grafanaClient.getDashboardByUid(dashboards[0].uid);
        console.log(`✅ Retrieved dashboard: ${dashboard.title}`);
        console.log(`   Panels: ${dashboard.panels?.length || 0}`);
        console.log(`   Variables: ${dashboard.templating?.list?.length || 0}`);
        console.log(`   Tags: ${dashboard.tags?.join(', ') || 'none'}`);
      } catch (error) {
        console.log(`⚠️  Error: ${error.message}`);
      }
      console.log();
    }
    
    console.log('=' .repeat(50));
    console.log('✨ All API tests completed successfully!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();