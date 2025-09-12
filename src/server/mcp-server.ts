import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema,
  Tool,
  CallToolResult,
  TextContent
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import pino from 'pino';
import { ServerConfig } from '../types/config';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  handler: (params: any, context: ToolContext) => Promise<CallToolResult>;
}

export interface ToolContext {
  config: ServerConfig;
  logger: pino.Logger;
}

export class MCPServer {
  private server: Server;
  private tools: Map<string, ToolDefinition> = new Map();
  private config: ServerConfig;
  private logger: pino.Logger;

  constructor(config: ServerConfig) {
    this.config = config;
    this.logger = pino({
      level: config.grafanaConfig.debug ? 'debug' : 'info',
      transport: config.grafanaConfig.debug ? {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      } : undefined
    });

    this.server = new Server(
      {
        name: 'mcp-grafana',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [];
      
      for (const [name, definition] of this.tools) {
        // Check if tool category is enabled
        const category = this.getToolCategory(name);
        if (category && !this.config.enabledTools.has(category)) {
          continue;
        }

        const jsonSchema = zodToJsonSchema(definition.inputSchema);
        
        tools.push({
          name: definition.name,
          description: definition.description,
          inputSchema: jsonSchema as any,
        });
      }

      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Tool "${name}" not found`);
      }

      // Check if tool category is enabled
      const category = this.getToolCategory(name);
      if (category && !this.config.enabledTools.has(category)) {
        throw new Error(`Tool category "${category}" is not enabled`);
      }

      try {
        // Validate input
        const validatedArgs = tool.inputSchema.parse(args);
        
        // Execute tool handler
        const context: ToolContext = {
          config: this.config,
          logger: this.logger.child({ tool: name }),
        };

        const result = await tool.handler(validatedArgs, context);
        
        return result;
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Invalid arguments for tool "${name}": ${error.message}`);
        }
        throw error;
      }
    });
  }

  registerTool(definition: ToolDefinition) {
    this.tools.set(definition.name, definition);
    this.logger.debug(`Registered tool: ${definition.name}`);
  }

  private getToolCategory(toolName: string): string | undefined {
    // Map tool names to categories based on naming patterns
    if (toolName.startsWith('search_')) return 'search';
    if (toolName.includes('dashboard')) return 'dashboard';
    if (toolName.includes('datasource')) return 'datasource';
    if (toolName.includes('prometheus')) return 'prometheus';
    if (toolName.includes('loki')) return 'loki';
    if (toolName.includes('incident')) return 'incident';
    if (toolName.includes('alert')) return 'alerting';
    if (toolName.includes('oncall')) return 'oncall';
    if (toolName.includes('sift')) return 'sift';
    if (toolName.includes('pyroscope')) return 'pyroscope';
    if (toolName.includes('deeplink')) return 'navigation';
    if (toolName.includes('assertion')) return 'asserts';
    if (toolName.includes('team') || toolName.includes('user')) return 'admin';
    
    return undefined;
  }

  async start() {
    switch (this.config.transport) {
      case 'stdio':
        await this.startStdio();
        break;
      case 'sse':
        await this.startSSE();
        break;
      case 'streamable-http':
        await this.startStreamableHTTP();
        break;
      default:
        throw new Error(`Unsupported transport: ${this.config.transport}`);
    }
  }

  private async startStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('MCP server started with stdio transport');
  }

  private async startSSE() {
    // Note: SSE transport would need to be implemented or imported from MCP SDK
    // For now, we'll throw an error
    throw new Error('SSE transport not yet implemented in TypeScript version');
  }

  private async startStreamableHTTP() {
    // Note: Streamable HTTP transport would need to be implemented
    throw new Error('Streamable HTTP transport not yet implemented in TypeScript version');
  }

  async stop() {
    await this.server.close();
    this.logger.info('MCP server stopped');
  }
}

// Helper function to create a tool result
export function createToolResult(content: string | object): CallToolResult {
  if (typeof content === 'string') {
    return {
      content: [{ type: 'text', text: content } as TextContent],
    };
  } else {
    return {
      content: [{ type: 'text', text: JSON.stringify(content, null, 2) } as TextContent],
    };
  }
}

// Helper function for error results
export function createErrorResult(error: string): CallToolResult {
  return {
    content: [{ type: 'text', text: `Error: ${error}` } as TextContent],
    isError: true,
  };
}