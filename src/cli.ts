#!/usr/bin/env node

import { Command } from 'commander';
import { MCPServer } from './server/mcp-server';
import { ServerConfig } from './types/config';
import { loadGrafanaConfig, validateGrafanaConfig } from './config/environment';
import { TOOL_CATEGORIES } from './types';

// Import tool registrations
import { registerSearchTools } from './tools/search';
import { registerDashboardTools } from './tools/dashboard';
import { registerDatasourceTools } from './tools/datasource';
import { registerPrometheusTools } from './tools/prometheus';
import { registerLokiTools } from './tools/loki';
import { registerIncidentTools } from './tools/incident';
import { registerAlertingTools } from './tools/alerting';
import { registerOncallTools } from './tools/oncall';
import { registerAdminTools } from './tools/admin';
import { registerSiftTools } from './tools/sift';
import { registerPyroscopeTools } from './tools/pyroscope';
import { registerNavigationTools } from './tools/navigation';
import { registerAssertsTools } from './tools/asserts';

const program = new Command();

program
  .name('mcp-grafana')
  .description('Model Context Protocol server for Grafana')
  .version('1.0.3');

// Transport options
program
  .option('-t, --transport <type>', 'Transport type (stdio, sse, streamable-http)', 'stdio')
  .option('-a, --address <address>', 'Server address for HTTP transports', '127.0.0.1')
  .option('-p, --port <port>', 'Server port for HTTP transports', '3000')
  .option('--path <path>', 'Server path for SSE transport', '/events');

// Tool category options
TOOL_CATEGORIES.forEach(category => {
  program.option(
    `--disable-${category.name}`,
    `Disable ${category.description.toLowerCase()}`
  );
});

// Grafana options
program
  .option('--grafana-url <url>', 'Grafana instance URL (overrides GRAFANA_URL env var)')
  .option('--grafana-token <token>', 'Grafana service account token (overrides env var)')
  .option('--debug', 'Enable debug logging', false);

// Parse command line arguments
program.parse();
const options = program.opts();

async function main() {
  try {
    // Load configuration
    const grafanaConfig = loadGrafanaConfig();
    
    // Override with CLI options
    if (options.grafanaUrl) {
      grafanaConfig.url = options.grafanaUrl;
    }
    if (options.grafanaToken) {
      grafanaConfig.serviceAccountToken = options.grafanaToken;
    }
    if (options.debug) {
      grafanaConfig.debug = true;
    }
    
    // Validate configuration
    const validatedConfig = validateGrafanaConfig(grafanaConfig);
    
    // Determine enabled tools
    const enabledTools = new Set<string>();
    TOOL_CATEGORIES.forEach(category => {
      const disableKey = `disable${category.name.charAt(0).toUpperCase() + category.name.slice(1)}`;
      if (!options[disableKey]) {
        enabledTools.add(category.name);
      }
    });
    
    // Create server configuration
    const serverConfig: ServerConfig = {
      transport: options.transport as 'stdio' | 'sse' | 'streamable-http',
      address: options.address,
      port: parseInt(options.port),
      path: options.path,
      enabledTools,
      grafanaConfig: validatedConfig,
    };
    
    // Create and configure server
    const server = new MCPServer(serverConfig);
    
    // Register tools based on enabled categories
    if (enabledTools.has('search')) {
      registerSearchTools(server);
    }
    if (enabledTools.has('dashboard')) {
      registerDashboardTools(server);
    }
    if (enabledTools.has('datasource')) {
      registerDatasourceTools(server);
    }
    if (enabledTools.has('prometheus')) {
      registerPrometheusTools(server);
    }
    if (enabledTools.has('loki')) {
      registerLokiTools(server);
    }
    if (enabledTools.has('incident')) {
      registerIncidentTools(server);
    }
    if (enabledTools.has('alerting')) {
      registerAlertingTools(server);
    }
    if (enabledTools.has('oncall')) {
      registerOncallTools(server);
    }
    if (enabledTools.has('admin')) {
      registerAdminTools(server);
    }
    if (enabledTools.has('sift')) {
      registerSiftTools(server);
    }
    if (enabledTools.has('pyroscope')) {
      registerPyroscopeTools(server);
    }
    if (enabledTools.has('navigation')) {
      registerNavigationTools(server);
    }
    if (enabledTools.has('asserts')) {
      registerAssertsTools(server);
    }
    
    // Handle shutdown signals
    process.on('SIGINT', async () => {
      console.log('\nShutting down MCP server...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await server.stop();
      process.exit(0);
    });
    
    // Start the server
    console.log(`Starting MCP Grafana server with ${options.transport} transport...`);
    console.log(`Enabled tool categories: ${Array.from(enabledTools).join(', ')}`);
    
    await server.start();
    
  } catch (error: any) {
    console.error('Failed to start MCP server:', error.message);
    process.exit(1);
  }
}

main();