import { z } from 'zod';
import { ToolDefinition, ToolContext, createToolResult, createErrorResult } from '../server/mcp-server';
import { GrafanaClient } from '../clients/grafana-client';

const ListDatasourcesSchema = z.object({
  type: z.string().optional().describe('The type of datasources to search for (e.g., "prometheus", "loki")'),
});

const GetDatasourceByUidSchema = z.object({
  uid: z.string().describe('The uid of the datasource'),
});

const GetDatasourceByNameSchema = z.object({
  name: z.string().describe('The name of the datasource'),
});

export const listDatasources: ToolDefinition = {
  name: 'list_datasources',
  description: 'List available Grafana datasources. Optionally filter by datasource type.',
  inputSchema: ListDatasourcesSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new GrafanaClient(context.config.grafanaConfig);
      const datasources = await client.listDatasources(params.type);
      
      // Format for readability
      const formatted = datasources.map(ds => ({
        uid: ds.uid,
        name: ds.name,
        type: ds.type,
        url: ds.url,
        isDefault: ds.isDefault,
      }));
      
      return createToolResult(formatted);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export const getDatasourceByUid: ToolDefinition = {
  name: 'get_datasource_by_uid',
  description: 'Retrieves detailed information about a specific datasource using its UID.',
  inputSchema: GetDatasourceByUidSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new GrafanaClient(context.config.grafanaConfig);
      const datasource = await client.getDatasourceByUid(params.uid);
      return createToolResult(datasource);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export const getDatasourceByName: ToolDefinition = {
  name: 'get_datasource_by_name',
  description: 'Retrieves detailed information about a specific datasource using its name.',
  inputSchema: GetDatasourceByNameSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new GrafanaClient(context.config.grafanaConfig);
      const datasource = await client.getDatasourceByName(params.name);
      return createToolResult(datasource);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export function registerDatasourceTools(server: any) {
  server.registerTool(listDatasources);
  server.registerTool(getDatasourceByUid);
  server.registerTool(getDatasourceByName);
}