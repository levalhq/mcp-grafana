import { z } from 'zod';
import { ToolDefinition, ToolContext, createToolResult, createErrorResult } from '../server/mcp-server';
import { GrafanaClient } from '../clients/grafana-client';

// Schema definitions
const ListTeamsSchema = z.object({
  query: z.string().optional().describe('The query to search for teams'),
});

const ListUsersByOrgSchema = z.object({});

// Tool definitions
export const listTeams: ToolDefinition = {
  name: 'list_teams',
  description: 'Search for Grafana teams by a query string. Returns a list of matching teams with details',
  inputSchema: ListTeamsSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new GrafanaClient(context.config.grafanaConfig);
      const teams = await client.listTeams(params.query);
      
      // Format the response
      const formatted = teams.map(team => ({
        id: team.id,
        name: team.name,
        email: team.email,
        memberCount: team.memberCount,
      }));
      
      return createToolResult(formatted);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export const listUsersByOrg: ToolDefinition = {
  name: 'list_users_by_org',
  description: 'List users by organization. Returns a list of users with details like userid, email, role etc',
  inputSchema: ListUsersByOrgSchema,
  handler: async (_params, context: ToolContext) => {
    try {
      const client = new GrafanaClient(context.config.grafanaConfig);
      const users = await client.listUsers();
      
      // Format the response
      const formatted = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        login: user.login,
        role: user.role,
        lastSeenAt: user.lastSeenAt,
        isDisabled: user.isDisabled,
      }));
      
      return createToolResult(formatted);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export function registerAdminTools(server: any) {
  server.registerTool(listTeams);
  server.registerTool(listUsersByOrg);
}