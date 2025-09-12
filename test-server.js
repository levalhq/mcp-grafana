#!/usr/bin/env node

/**
 * Test script to verify MCP server functionality
 * This creates a simple test client that connects to the server
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Test configuration
const testConfig = {
  GRAFANA_URL: process.env.GRAFANA_URL || 'https://play.grafana.org',
  GRAFANA_SERVICE_ACCOUNT_TOKEN: process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || ''
};

console.log('🧪 Testing MCP Grafana Server (TypeScript version)');
console.log('==========================================');
console.log(`Grafana URL: ${testConfig.GRAFANA_URL}`);
console.log(`Auth: ${testConfig.GRAFANA_SERVICE_ACCOUNT_TOKEN ? 'Service Account Token' : 'No auth (public instance)'}`);
console.log('');

// Spawn the server
const server = spawn('node', ['dist/cli.js', '--debug'], {
  env: {
    ...process.env,
    ...testConfig
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Create interface for reading server output
const rl = readline.createInterface({
  input: server.stdout,
  crlfDelay: Infinity
});

// Handle server output
rl.on('line', (line) => {
  console.log(`[SERVER] ${line}`);
});

// Handle errors
server.stderr.on('data', (data) => {
  console.error(`[ERROR] ${data.toString()}`);
});

// Send test commands
async function runTests() {
  console.log('\n📋 Sending MCP commands...\n');
  
  // Test 1: Initialize
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
  
  console.log('→ Sending initialize request...');
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Wait a bit for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: List tools
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  
  console.log('→ Sending tools/list request...');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Call a tool (if connected to real Grafana)
  if (testConfig.GRAFANA_SERVICE_ACCOUNT_TOKEN) {
    const callToolRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_dashboards',
        arguments: {
          query: 'test'
        }
      }
    };
    
    console.log('→ Sending tools/call request (search_dashboards)...');
    server.stdin.write(JSON.stringify(callToolRequest) + '\n');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Close the server
  console.log('\n✅ Test completed. Shutting down server...');
  server.kill('SIGTERM');
}

// Handle server exit
server.on('exit', (code) => {
  console.log(`\nServer exited with code ${code}`);
  process.exit(code || 0);
});

// Run tests after a short delay to ensure server is ready
setTimeout(runTests, 500);

// Handle interrupts
process.on('SIGINT', () => {
  console.log('\n⚠️  Test interrupted');
  server.kill('SIGTERM');
  process.exit(1);
});