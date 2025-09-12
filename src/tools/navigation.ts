import { z } from 'zod';
import { ToolDefinition, ToolContext, createToolResult, createErrorResult } from '../server/mcp-server';

// Schema definitions
const GenerateDeeplinkSchema = z.object({
  resourceType: z.enum(['dashboard', 'panel', 'explore']).describe('Type of resource'),
  dashboardUid: z.string().optional().describe('Dashboard UID (required for dashboard and panel types)'),
  panelId: z.number().optional().describe('Panel ID (required for panel type)'),
  datasourceUid: z.string().optional().describe('Datasource UID (required for explore type)'),
  timeRange: z.object({
    from: z.string().describe('Start time (e.g., "now-1h")'),
    to: z.string().describe('End time (e.g., "now")'),
  }).optional().describe('Time range for the link'),
  queryParams: z.record(z.string()).optional().describe('Additional query parameters'),
});

// Tool definitions
export const generateDeeplink: ToolDefinition = {
  name: 'generate_deeplink',
  description: 'Generate deeplink URLs for Grafana resources. Supports dashboards, panels, and Explore queries',
  inputSchema: GenerateDeeplinkSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const baseUrl = context.config.grafanaConfig.url;
      let url = '';
      const queryParams = new URLSearchParams();
      
      // Add time range if provided
      if (params.timeRange) {
        queryParams.append('from', params.timeRange.from);
        queryParams.append('to', params.timeRange.to);
      }
      
      // Add additional query params
      if (params.queryParams) {
        Object.entries(params.queryParams).forEach(([key, value]) => {
          queryParams.append(key, String(value));
        });
      }
      
      switch (params.resourceType) {
        case 'dashboard':
          if (!params.dashboardUid) {
            return createErrorResult('dashboardUid is required for dashboard type');
          }
          url = `${baseUrl}/d/${params.dashboardUid}`;
          break;
          
        case 'panel':
          if (!params.dashboardUid || params.panelId === undefined) {
            return createErrorResult('dashboardUid and panelId are required for panel type');
          }
          url = `${baseUrl}/d/${params.dashboardUid}`;
          queryParams.append('viewPanel', params.panelId.toString());
          break;
          
        case 'explore':
          if (!params.datasourceUid) {
            return createErrorResult('datasourceUid is required for explore type');
          }
          url = `${baseUrl}/explore`;
          queryParams.append('left', JSON.stringify({
            datasource: params.datasourceUid,
            queries: [],
            range: params.timeRange || { from: 'now-1h', to: 'now' },
          }));
          break;
          
        default:
          return createErrorResult(`Unknown resource type: ${params.resourceType}`);
      }
      
      // Append query params to URL
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      return createToolResult({ url });
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export function registerNavigationTools(server: any) {
  server.registerTool(generateDeeplink);
}