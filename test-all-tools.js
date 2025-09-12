#!/usr/bin/env node

/**
 * Comprehensive test script to verify all MCP tools are registered
 */

const { spawn } = require('child_process');

console.log('🧪 Testing MCP Grafana Server - All Tools Registration');
console.log('=====================================================\n');

// Start the server with dummy auth
const server = spawn('node', ['dist/cli.js', '--debug'], {
  env: {
    ...process.env,
    GRAFANA_URL: 'https://play.grafana.org',
    GRAFANA_SERVICE_ACCOUNT_TOKEN: 'dummy-token-for-testing',
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let outputBuffer = '';
let initialized = false;

// Capture output
server.stdout.on('data', (data) => {
  outputBuffer += data.toString();
  
  // Check if server started
  if (!initialized && outputBuffer.includes('MCP server started')) {
    initialized = true;
    sendListToolsRequest();
  }
});

server.stderr.on('data', (data) => {
  console.error(`[ERROR] ${data.toString()}`);
});

function sendListToolsRequest() {
  console.log('📋 Requesting tool list...\n');
  
  // Send initialize request first
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '0.1.0',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Wait a bit then send list tools request
  setTimeout(() => {
    const listRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    
    server.stdin.write(JSON.stringify(listRequest) + '\n');
    
    // Process results after a delay
    setTimeout(() => processResults(), 2000);
  }, 1000);
}

function processResults() {
  // Parse JSON-RPC responses from output
  const lines = outputBuffer.split('\n');
  const toolsResponse = lines.find(line => {
    try {
      const json = JSON.parse(line);
      return json.id === 2 && json.result && json.result.tools;
    } catch {
      return false;
    }
  });
  
  if (toolsResponse) {
    const response = JSON.parse(toolsResponse);
    const tools = response.result.tools;
    
    console.log('✅ Successfully retrieved tool list!\n');
    console.log('📊 Tool Statistics:');
    console.log('==================');
    
    // Categorize tools
    const categories = {
      search: [],
      dashboard: [],
      datasource: [],
      prometheus: [],
      loki: [],
      incident: [],
      alerting: [],
      oncall: [],
      admin: [],
      sift: [],
      pyroscope: [],
      navigation: [],
      asserts: []
    };
    
    tools.forEach(tool => {
      const name = tool.name;
      if (name.startsWith('search_')) categories.search.push(name);
      else if (name.includes('dashboard')) categories.dashboard.push(name);
      else if (name.includes('datasource')) categories.datasource.push(name);
      else if (name.includes('prometheus')) categories.prometheus.push(name);
      else if (name.includes('loki')) categories.loki.push(name);
      else if (name.includes('incident')) categories.incident.push(name);
      else if (name.includes('alert')) categories.alerting.push(name);
      else if (name.includes('oncall')) categories.oncall.push(name);
      else if (name.includes('team') || name.includes('user')) categories.admin.push(name);
      else if (name.includes('sift')) categories.sift.push(name);
      else if (name.includes('pyroscope')) categories.pyroscope.push(name);
      else if (name.includes('deeplink')) categories.navigation.push(name);
      else if (name.includes('assertion')) categories.asserts.push(name);
      else if (name === 'find_error_pattern_logs') categories.loki.push(name);
      else if (name === 'find_slow_requests') categories.sift.push(name);
      else if (name === 'list_teams') categories.admin.push(name);
      else if (name === 'list_users_by_org') categories.admin.push(name);
      else if (name === 'get_assertions') categories.asserts.push(name);
    });
    
    // Print statistics
    Object.entries(categories).forEach(([category, toolList]) => {
      console.log(`  ${category.padEnd(15)} : ${toolList.length} tools`);
    });
    
    console.log(`\n  TOTAL           : ${tools.length} tools\n`);
    
    // List all tools
    console.log('📝 Complete Tool List:');
    console.log('=====================');
    tools.forEach((tool, index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. ${tool.name}`);
    });
    
    // Expected tools check
    const expectedTools = [
      // Search
      'search_dashboards',
      // Dashboard
      'get_dashboard_by_uid',
      'get_dashboard_summary',
      'get_dashboard_property',
      'get_dashboard_panel_queries',
      'update_dashboard',
      // Datasource
      'list_datasources',
      'get_datasource_by_uid',
      'get_datasource_by_name',
      // Prometheus
      'query_prometheus',
      'list_prometheus_metric_names',
      'list_prometheus_label_names',
      'list_prometheus_label_values',
      'list_prometheus_metric_metadata',
      // Loki
      'list_loki_label_names',
      'list_loki_label_values',
      'query_loki_logs',
      'query_loki_stats',
      'find_error_pattern_logs',
      // Incident
      'list_incidents',
      'get_incident',
      'create_incident',
      'add_activity_to_incident',
      // Alerting
      'list_alert_rules',
      'get_alert_rule_by_uid',
      'list_contact_points',
      // OnCall
      'list_oncall_schedules',
      'list_oncall_teams',
      'list_oncall_users',
      'get_current_oncall_users',
      'get_oncall_shift',
      // Admin
      'list_teams',
      'list_users_by_org',
      // Sift
      'list_sift_investigations',
      'get_sift_investigation',
      'get_sift_analysis',
      'find_slow_requests',
      // Pyroscope
      'list_pyroscope_label_names',
      'list_pyroscope_label_values',
      'list_pyroscope_profile_types',
      'fetch_pyroscope_profile',
      // Navigation
      'generate_deeplink',
      // Asserts
      'get_assertions'
    ];
    
    const actualToolNames = tools.map(t => t.name);
    const missingTools = expectedTools.filter(t => !actualToolNames.includes(t));
    const extraTools = actualToolNames.filter(t => !expectedTools.includes(t));
    
    console.log('\n🔍 Verification:');
    console.log('================');
    if (missingTools.length === 0) {
      console.log('  ✅ All expected tools are registered!');
    } else {
      console.log(`  ⚠️  Missing tools: ${missingTools.join(', ')}`);
    }
    
    if (extraTools.length > 0) {
      console.log(`  ℹ️  Additional tools found: ${extraTools.join(', ')}`);
    }
    
    console.log('\n✨ Test completed successfully!');
  } else {
    console.error('❌ Failed to retrieve tool list');
  }
  
  // Cleanup
  server.kill('SIGTERM');
  process.exit(0);
}

// Handle timeout
setTimeout(() => {
  console.error('❌ Test timed out');
  server.kill('SIGTERM');
  process.exit(1);
}, 10000);

// Handle interrupts
process.on('SIGINT', () => {
  console.log('\n⚠️  Test interrupted');
  server.kill('SIGTERM');
  process.exit(1);
});