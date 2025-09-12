import { z } from 'zod';
import { ToolDefinition, ToolContext, createToolResult, createErrorResult } from '../server/mcp-server';
import { GrafanaClient } from '../clients/grafana-client';

const SearchDashboardsSchema = z.object({
  query: z.string().describe('The query to search for'),
});

export const searchDashboards: ToolDefinition = {
  name: 'search_dashboards',
  description: 'Search for Grafana dashboards by a query string. Returns a list of matching dashboards with details like title, UID, folder, tags, and URL.',
  inputSchema: SearchDashboardsSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new GrafanaClient(context.config.grafanaConfig);
      const results = await client.searchDashboards(params.query);
      
      // Format results for better readability
      const formatted = results.map(dashboard => ({
        uid: dashboard.uid,
        title: dashboard.title,
        url: dashboard.url,
        tags: dashboard.tags || [],
        folderTitle: dashboard.folderTitle,
        type: dashboard.type,
      }));
      
      return createToolResult(formatted);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export function registerSearchTools(server: any) {
  server.registerTool(searchDashboards);
}