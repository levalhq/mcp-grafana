import { z } from 'zod';
import { ToolDefinition, ToolContext, createToolResult, createErrorResult } from '../server/mcp-server';
import { GrafanaClient } from '../clients/grafana-client';

// Schema definitions
const ListAlertRulesSchema = z.object({
  label_selectors: z.array(z.object({
    filters: z.array(z.object({
      name: z.string().describe('The name of the label to match against'),
      value: z.string().describe('The value to match against'),
      type: z.enum(['=', '!=', '=~', '!~']).describe('The match operator'),
    })),
  })).optional().describe('Label matchers to filter alert rules'),
  limit: z.number().optional().describe('Maximum number of results to return'),
  page: z.number().optional().describe('Page number to return'),
});

const GetAlertRuleByUidSchema = z.object({
  uid: z.string().describe('The uid of the alert rule'),
});

const ListContactPointsSchema = z.object({
  name: z.string().optional().describe('Filter contact points by name'),
  limit: z.number().optional().describe('Maximum number of results to return'),
});

// Tool definitions
export const listAlertRules: ToolDefinition = {
  name: 'list_alert_rules',
  description: 'Lists Grafana alert rules, returning a summary including UID, title, current state, and labels',
  inputSchema: ListAlertRulesSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new GrafanaClient(context.config.grafanaConfig);
      
      // Build filters object for API
      const filters: any = {};
      if (params.label_selectors) {
        // Convert label selectors to query params
        // Note: Real implementation would need proper label selector formatting
        filters.labels = params.label_selectors;
      }
      if (params.limit) filters.limit = params.limit;
      if (params.page) filters.page = params.page;
      
      const rules = await client.listAlertRules(filters);
      
      // Format the response
      const formatted = rules.map((rule: any) => ({
        uid: rule.uid,
        title: rule.title,
        state: rule.state || 'inactive',
        labels: rule.labels || {},
        folder: rule.folderUID,
      }));
      
      return createToolResult(formatted);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export const getAlertRuleByUid: ToolDefinition = {
  name: 'get_alert_rule_by_uid',
  description: 'Retrieves the full configuration and detailed status of a specific Grafana alert rule',
  inputSchema: GetAlertRuleByUidSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new GrafanaClient(context.config.grafanaConfig);
      const rule = await client.getAlertRuleByUid(params.uid);
      return createToolResult(rule);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export const listContactPoints: ToolDefinition = {
  name: 'list_contact_points',
  description: 'Lists Grafana notification contact points, returning a summary including UID, name, and type',
  inputSchema: ListContactPointsSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new GrafanaClient(context.config.grafanaConfig);
      let contactPoints = await client.listContactPoints();
      
      // Apply filtering if name is provided
      if (params.name) {
        contactPoints = contactPoints.filter((cp: any) => cp.name === params.name);
      }
      
      // Apply limit
      if (params.limit) {
        contactPoints = contactPoints.slice(0, params.limit);
      }
      
      // Format the response
      const formatted = contactPoints.map((cp: any) => ({
        uid: cp.uid,
        name: cp.name,
        type: cp.type,
        settings: cp.settings,
      }));
      
      return createToolResult(formatted);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export function registerAlertingTools(server: any) {
  server.registerTool(listAlertRules);
  server.registerTool(getAlertRuleByUid);
  server.registerTool(listContactPoints);
}