#!/usr/bin/env node

/**
 * Interactive MCP Test Client
 * Allows manual testing of MCP tools
 */

require('dotenv').config();
const { spawn } = require('child_process');
const readline = require('readline');

console.log('🎮 Interactive MCP Test Client');
console.log('==============================\n');
console.log('Starting MCP server with your Grafana instance...\n');

const server = spawn('node', ['dist/cli.js'], {
  env: process.env,
  stdio: ['pipe', 'pipe', 'inherit'] // Show server errors
});

let requestId = 1;
const responses = new Map();

// Parse server output
server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    if (line.trim() && line.startsWith('{')) {
      try {
        const json = JSON.parse(line);
        if (json.id) {
          responses.set(json.id, json);
          
          // Print response
          if (json.result) {
            console.log('\n✅ Response received:');
            if (json.result.content) {
              try {
                const content = JSON.parse(json.result.content[0].text);
                console.log(JSON.stringify(content, null, 2));
              } catch {
                console.log(json.result.content[0].text);
              }
            } else if (json.result.tools) {
              console.log(`Found ${json.result.tools.length} tools`);
              json.result.tools.slice(0, 10).forEach(tool => {
                console.log(`  - ${tool.name}: ${tool.description.slice(0, 60)}...`);
              });
              if (json.result.tools.length > 10) {
                console.log(`  ... and ${json.result.tools.length - 10} more`);
              }
            } else {
              console.log(JSON.stringify(json.result, null, 2));
            }
          } else if (json.error) {
            console.log('\n❌ Error:', json.error.message);
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }
  });
});

function sendRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  };
  
  console.log(`\n→ Sending: ${method}`);
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize MCP
setTimeout(() => {
  console.log('\n🔄 Initializing MCP protocol...');
  sendRequest('initialize', {
    protocolVersion: '0.1.0',
    capabilities: {},
    clientInfo: {
      name: 'interactive-test',
      version: '1.0.0'
    }
  });
  
  setTimeout(() => {
    console.log('\n✨ MCP Server Ready!\n');
    console.log('Available commands:');
    console.log('  list                    - List all available tools');
    console.log('  search <query>          - Search dashboards');
    console.log('  datasources             - List all datasources');
    console.log('  dashboards              - List all dashboards');
    console.log('  teams                   - List teams');
    console.log('  users                   - List users');
    console.log('  alerts                  - List alert rules');
    console.log('  loki <datasourceUid>    - Test Loki queries');
    console.log('  prometheus <uid>        - Test Prometheus queries');
    console.log('  tool <name> <args>      - Call any tool directly');
    console.log('  help                    - Show this help');
    console.log('  exit                    - Exit the client\n');
    
    promptUser();
  }, 1000);
}, 500);

function promptUser() {
  rl.question('mcp> ', (input) => {
    const [command, ...args] = input.trim().split(' ');
    
    switch (command) {
      case 'list':
        sendRequest('tools/list', {});
        break;
        
      case 'search':
        sendRequest('tools/call', {
          name: 'search_dashboards',
          arguments: {
            query: args.join(' ') || ''
          }
        });
        break;
        
      case 'datasources':
        sendRequest('tools/call', {
          name: 'list_datasources',
          arguments: {}
        });
        break;
        
      case 'dashboards':
        sendRequest('tools/call', {
          name: 'search_dashboards',
          arguments: { query: '' }
        });
        break;
        
      case 'teams':
        sendRequest('tools/call', {
          name: 'list_teams',
          arguments: {}
        });
        break;
        
      case 'users':
        sendRequest('tools/call', {
          name: 'list_users_by_org',
          arguments: {}
        });
        break;
        
      case 'alerts':
        sendRequest('tools/call', {
          name: 'list_alert_rules',
          arguments: { limit: 10 }
        });
        break;
        
      case 'loki':
        if (args[0]) {
          sendRequest('tools/call', {
            name: 'list_loki_label_names',
            arguments: {
              datasourceUid: args[0]
            }
          });
        } else {
          console.log('Usage: loki <datasourceUid>');
        }
        break;
        
      case 'prometheus':
        if (args[0]) {
          sendRequest('tools/call', {
            name: 'query_prometheus',
            arguments: {
              datasourceUid: args[0],
              expr: 'up',
              queryType: 'instant',
              startTime: 'now'
            }
          });
        } else {
          console.log('Usage: prometheus <datasourceUid>');
        }
        break;
        
      case 'tool':
        if (args.length >= 1) {
          const toolName = args[0];
          let toolArgs = {};
          
          if (args.length > 1) {
            try {
              // Try to parse remaining args as JSON
              toolArgs = JSON.parse(args.slice(1).join(' '));
            } catch {
              console.log('Error: Arguments must be valid JSON');
              promptUser();
              return;
            }
          }
          
          sendRequest('tools/call', {
            name: toolName,
            arguments: toolArgs
          });
        } else {
          console.log('Usage: tool <name> <json-args>');
        }
        break;
        
      case 'help':
        console.log('\nAvailable commands:');
        console.log('  list                    - List all available tools');
        console.log('  search <query>          - Search dashboards');
        console.log('  datasources             - List all datasources');
        console.log('  dashboards              - List all dashboards'); 
        console.log('  teams                   - List teams');
        console.log('  users                   - List users');
        console.log('  alerts                  - List alert rules');
        console.log('  loki <datasourceUid>    - Test Loki queries');
        console.log('  prometheus <uid>        - Test Prometheus queries');
        console.log('  tool <name> <args>      - Call any tool directly');
        console.log('  help                    - Show this help');
        console.log('  exit                    - Exit the client');
        break;
        
      case 'exit':
        console.log('\nGoodbye! 👋');
        server.kill('SIGTERM');
        process.exit(0);
        break;
        
      default:
        if (command) {
          console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
        }
    }
    
    // Continue prompting
    setTimeout(() => promptUser(), 100);
  });
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  server.kill('SIGTERM');
  process.exit(0);
});