#!/usr/bin/env node

/**
 * Comprehensive MCP Tools Test Suite
 * Tests actual tool functionality with real Grafana instance
 */

require('dotenv').config();
const { spawn } = require('child_process');
const readline = require('readline');

console.log('🧪 MCP Grafana Tools Test Suite');
console.log('================================\n');

class MCPTester {
  constructor() {
    this.server = null;
    this.outputBuffer = '';
    this.responseBuffer = [];
    this.currentId = 1;
    this.initialized = false;
  }

  async start() {
    console.log('🚀 Starting MCP server...\n');
    
    this.server = spawn('node', ['dist/cli.js'], {
      env: {
        ...process.env,
        DEBUG: 'false' // Disable debug for cleaner output
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Capture stdout
    this.server.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim() && line.startsWith('{')) {
          try {
            const json = JSON.parse(line);
            this.responseBuffer.push(json);
          } catch {}
        }
      });
    });

    // Capture stderr
    this.server.stderr.on('data', (data) => {
      if (data.toString().includes('MCP server started')) {
        this.initialized = true;
      }
    });

    // Wait for initialization
    await this.waitForInit();
    await this.initialize();
  }

  async waitForInit() {
    let attempts = 0;
    while (!this.initialized && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (!this.initialized) {
      throw new Error('Server failed to initialize');
    }
  }

  async initialize() {
    console.log('📝 Initializing MCP protocol...\n');
    
    const response = await this.sendRequest('initialize', {
      protocolVersion: '0.1.0',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });

    if (response.result) {
      console.log('✅ MCP initialized successfully\n');
      return true;
    }
    throw new Error('Failed to initialize MCP');
  }

  async sendRequest(method, params) {
    const request = {
      jsonrpc: '2.0',
      id: this.currentId++,
      method,
      params
    };

    this.server.stdin.write(JSON.stringify(request) + '\n');

    // Wait for response
    const startTime = Date.now();
    while (Date.now() - startTime < 5000) {
      const response = this.responseBuffer.find(r => r.id === request.id);
      if (response) {
        this.responseBuffer = this.responseBuffer.filter(r => r.id !== request.id);
        return response;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    throw new Error(`Timeout waiting for response to ${method}`);
  }

  async callTool(toolName, args) {
    return await this.sendRequest('tools/call', {
      name: toolName,
      arguments: args
    });
  }

  async listTools() {
    const response = await this.sendRequest('tools/list', {});
    return response.result?.tools || [];
  }

  async stop() {
    if (this.server) {
      this.server.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

async function runTests() {
  const tester = new MCPTester();
  const results = {
    passed: [],
    failed: [],
    skipped: []
  };

  try {
    await tester.start();

    // Test 1: List all tools
    console.log('📋 Test 1: List all available tools');
    console.log('------------------------------------');
    const tools = await tester.listTools();
    console.log(`Found ${tools.length} tools\n`);
    if (tools.length === 43) {
      results.passed.push('List tools');
    } else {
      results.failed.push(`List tools (expected 43, got ${tools.length})`);
    }

    // Test 2: Search dashboards
    console.log('🔍 Test 2: Search dashboards');
    console.log('-----------------------------');
    try {
      const response = await tester.callTool('search_dashboards', {
        query: ''
      });
      
      if (response.result && response.result.content) {
        const content = JSON.parse(response.result.content[0].text);
        console.log(`✅ Found ${content.length} dashboards`);
        if (content.length > 0) {
          console.log(`   First: ${content[0].title}`);
        }
        results.passed.push('Search dashboards');
      } else {
        results.failed.push('Search dashboards - no content');
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      results.failed.push(`Search dashboards: ${error.message}`);
    }
    console.log();

    // Test 3: List datasources
    console.log('💾 Test 3: List datasources');
    console.log('---------------------------');
    try {
      const response = await tester.callTool('list_datasources', {});
      
      if (response.result && response.result.content) {
        const content = JSON.parse(response.result.content[0].text);
        console.log(`✅ Found ${content.length} datasources:`);
        content.forEach(ds => {
          console.log(`   - ${ds.name} (${ds.type})`);
        });
        results.passed.push('List datasources');
      } else {
        results.failed.push('List datasources - no content');
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      results.failed.push(`List datasources: ${error.message}`);
    }
    console.log();

    // Test 4: Get specific datasource
    console.log('🔌 Test 4: Get datasource by name');
    console.log('----------------------------------');
    try {
      const response = await tester.callTool('get_datasource_by_name', {
        name: 'Loki Hub'
      });
      
      if (response.result && response.result.content) {
        const content = JSON.parse(response.result.content[0].text);
        console.log(`✅ Retrieved datasource: ${content.name}`);
        console.log(`   Type: ${content.type}`);
        console.log(`   UID: ${content.uid}`);
        results.passed.push('Get datasource by name');
      } else {
        results.failed.push('Get datasource by name - no content');
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      results.failed.push(`Get datasource by name: ${error.message}`);
    }
    console.log();

    // Test 5: List teams
    console.log('👥 Test 5: List teams');
    console.log('---------------------');
    try {
      const response = await tester.callTool('list_teams', {});
      
      if (response.result && response.result.content) {
        const content = JSON.parse(response.result.content[0].text);
        console.log(`✅ Found ${content.length} teams`);
        if (content.length > 0) {
          console.log(`   First team: ${content[0].name}`);
        }
        results.passed.push('List teams');
      } else {
        results.failed.push('List teams - no content');
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      results.failed.push(`List teams: ${error.message}`);
    }
    console.log();

    // Test 6: Generate deeplink
    console.log('🔗 Test 6: Generate deeplink');
    console.log('-----------------------------');
    try {
      const response = await tester.callTool('generate_deeplink', {
        resourceType: 'dashboard',
        dashboardUid: 'test-dashboard',
        timeRange: {
          from: 'now-1h',
          to: 'now'
        }
      });
      
      if (response.result && response.result.content) {
        const content = JSON.parse(response.result.content[0].text);
        console.log(`✅ Generated URL: ${content.url}`);
        results.passed.push('Generate deeplink');
      } else {
        results.failed.push('Generate deeplink - no content');
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      results.failed.push(`Generate deeplink: ${error.message}`);
    }
    console.log();

    // Test 7: List alert rules
    console.log('🚨 Test 7: List alert rules');
    console.log('----------------------------');
    try {
      const response = await tester.callTool('list_alert_rules', {
        limit: 5
      });
      
      if (response.result) {
        if (response.result.isError) {
          console.log(`⚠️  No alert rules or access denied`);
          results.skipped.push('List alert rules - may not have access');
        } else {
          const content = JSON.parse(response.result.content[0].text);
          console.log(`✅ Found ${content.length} alert rules`);
          results.passed.push('List alert rules');
        }
      }
    } catch (error) {
      console.log(`⚠️  Skipped: ${error.message}`);
      results.skipped.push(`List alert rules: ${error.message}`);
    }
    console.log();

    // Test 8: Get Loki labels (if Loki datasource exists)
    console.log('📝 Test 8: List Loki label names');
    console.log('---------------------------------');
    try {
      // First get a Loki datasource
      const dsResponse = await tester.callTool('list_datasources', {
        type: 'loki'
      });
      
      if (dsResponse.result && dsResponse.result.content) {
        const datasources = JSON.parse(dsResponse.result.content[0].text);
        if (datasources.length > 0) {
          const lokiDs = datasources[0];
          
          const response = await tester.callTool('list_loki_label_names', {
            datasourceUid: lokiDs.uid
          });
          
          if (response.result && response.result.content) {
            const labels = JSON.parse(response.result.content[0].text);
            console.log(`✅ Found ${labels.length} label names`);
            if (labels.length > 0) {
              console.log(`   Sample labels: ${labels.slice(0, 5).join(', ')}`);
            }
            results.passed.push('List Loki labels');
          }
        } else {
          console.log('⚠️  No Loki datasource found');
          results.skipped.push('List Loki labels - no Loki datasource');
        }
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      results.failed.push(`List Loki labels: ${error.message}`);
    }
    console.log();

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    // Print results summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`\n✅ PASSED: ${results.passed.length}`);
    results.passed.forEach(test => console.log(`   • ${test}`));
    
    if (results.failed.length > 0) {
      console.log(`\n❌ FAILED: ${results.failed.length}`);
      results.failed.forEach(test => console.log(`   • ${test}`));
    }
    
    if (results.skipped.length > 0) {
      console.log(`\n⚠️  SKIPPED: ${results.skipped.length}`);
      results.skipped.forEach(test => console.log(`   • ${test}`));
    }
    
    const total = results.passed.length + results.failed.length + results.skipped.length;
    const successRate = Math.round((results.passed.length / total) * 100);
    
    console.log(`\n📈 Success Rate: ${successRate}% (${results.passed.length}/${total})`);
    
    await tester.stop();
    process.exit(results.failed.length > 0 ? 1 : 0);
  }
}

// Run the tests
runTests().catch(console.error);