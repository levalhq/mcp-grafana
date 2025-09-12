import { z } from 'zod';
import { ToolDefinition, ToolContext, createToolResult, createErrorResult } from '../server/mcp-server';
import axios from 'axios';

// Schema definitions
const GetAssertionsSchema = z.object({
  entityType: z.string().describe('The type of the entity (e.g., Service, Node, Pod)'),
  entityName: z.string().describe('The name of the entity'),
  env: z.string().optional().describe('The environment of the entity'),
  site: z.string().optional().describe('The site of the entity'),
  namespace: z.string().optional().describe('The namespace of the entity'),
  startTime: z.string().describe('The start time in RFC3339 format'),
  endTime: z.string().describe('The end time in RFC3339 format'),
});

// Helper function to create Asserts client
function createAssertsClient(config: any) {
  const headers: any = {
    'User-Agent': 'mcp-grafana/1.0.0',
    'Content-Type': 'application/json',
  };
  
  if (config.serviceAccountToken) {
    headers['Authorization'] = `Bearer ${config.serviceAccountToken}`;
  } else if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  
  // Asserts uses a different base URL pattern
  const baseUrl = config.url.replace(/\/$/, '');
  const assertsUrl = baseUrl.includes('grafana.net')
    ? baseUrl.replace('grafana.net', 'asserts.grafana.net')
    : `${baseUrl}/api/plugins/grafana-asserts-app/resources`;
  
  return axios.create({
    baseURL: assertsUrl,
    headers,
    timeout: 30000,
  });
}

// Tool definitions
export const getAssertions: ToolDefinition = {
  name: 'get_assertions',
  description: 'Get assertion summary for a given entity with its type, name, env, site, namespace, and time range',
  inputSchema: GetAssertionsSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = createAssertsClient(context.config.grafanaConfig);
      
      // Build the query parameters
      const queryParams: any = {
        entity_type: params.entityType,
        entity_name: params.entityName,
        start_time: params.startTime,
        end_time: params.endTime,
      };
      
      if (params.env) queryParams.env = params.env;
      if (params.site) queryParams.site = params.site;
      if (params.namespace) queryParams.namespace = params.namespace;
      
      const response = await client.get('/api/v1/assertions', { params: queryParams });
      
      const assertions = response.data.assertions || [];
      
      // Format the response
      const formatted = {
        entity: {
          type: params.entityType,
          name: params.entityName,
          env: params.env,
          site: params.site,
          namespace: params.namespace,
        },
        timeRange: {
          start: params.startTime,
          end: params.endTime,
        },
        assertions: assertions.map((assertion: any) => ({
          id: assertion.id,
          name: assertion.name,
          status: assertion.status,
          severity: assertion.severity,
          message: assertion.message,
          lastTriggered: assertion.last_triggered,
          count: assertion.count,
        })),
        summary: {
          total: assertions.length,
          critical: assertions.filter((a: any) => a.severity === 'critical').length,
          warning: assertions.filter((a: any) => a.severity === 'warning').length,
          info: assertions.filter((a: any) => a.severity === 'info').length,
        },
      };
      
      return createToolResult(formatted);
    } catch (error: any) {
      return createErrorResult(error.response?.data?.message || error.message);
    }
  },
};

export function registerAssertsTools(server: any) {
  server.registerTool(getAssertions);
}