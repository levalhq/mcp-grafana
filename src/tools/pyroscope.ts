import { z } from 'zod';
import { ToolDefinition, ToolContext, createToolResult, createErrorResult } from '../server/mcp-server';
import axios from 'axios';

// Schema definitions
const ListPyroscopeLabelNamesSchema = z.object({
  data_source_uid: z.string().describe('The UID of the datasource to query'),
  start_rfc_3339: z.string().optional().describe('Start time in RFC3339 format'),
  end_rfc_3339: z.string().optional().describe('End time in RFC3339 format'),
  matchers: z.string().optional().describe('Prometheus-style matchers'),
});

const ListPyroscopeLabelValuesSchema = z.object({
  data_source_uid: z.string().describe('The UID of the datasource to query'),
  name: z.string().describe('A label name'),
  start_rfc_3339: z.string().optional().describe('Start time in RFC3339 format'),
  end_rfc_3339: z.string().optional().describe('End time in RFC3339 format'),
  matchers: z.string().optional().describe('Prometheus-style matchers'),
});

const ListPyroscopeProfileTypesSchema = z.object({
  data_source_uid: z.string().describe('The UID of the datasource to query'),
  start_rfc_3339: z.string().optional().describe('Start time in RFC3339 format'),
  end_rfc_3339: z.string().optional().describe('End time in RFC3339 format'),
});

const FetchPyroscopeProfileSchema = z.object({
  data_source_uid: z.string().describe('The UID of the datasource to query'),
  profile_type: z.string().describe('Profile type to fetch'),
  start_rfc_3339: z.string().optional().describe('Start time in RFC3339 format'),
  end_rfc_3339: z.string().optional().describe('End time in RFC3339 format'),
  matchers: z.string().optional().describe('Prometheus-style matchers'),
  max_node_depth: z.number().optional().describe('Maximum depth of nodes in the profile'),
});

// Helper function to create Pyroscope client
function createPyroscopeClient(config: any, datasourceUid: string) {
  const headers: any = {
    'User-Agent': 'mcp-grafana/1.0.0',
  };
  
  if (config.serviceAccountToken) {
    headers['Authorization'] = `Bearer ${config.serviceAccountToken}`;
  } else if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  
  return axios.create({
    baseURL: `${config.url}/api/datasources/proxy/uid/${datasourceUid}`,
    headers,
    timeout: 30000,
  });
}

// Helper function to get default time range (last hour)
function getDefaultTimeRange(): { start: string; end: string } {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  return {
    start: oneHourAgo.toISOString(),
    end: now.toISOString(),
  };
}

// Tool definitions
export const listPyroscopeLabelNames: ToolDefinition = {
  name: 'list_pyroscope_label_names',
  description: 'Lists all available label names found in profiles within a Pyroscope datasource',
  inputSchema: ListPyroscopeLabelNamesSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = createPyroscopeClient(context.config.grafanaConfig, params.data_source_uid);
      const timeRange = params.start_rfc_3339 || params.end_rfc_3339 
        ? { start: '', end: '' } 
        : getDefaultTimeRange();
      
      const queryParams: any = {
        start: params.start_rfc_3339 || timeRange.start,
        end: params.end_rfc_3339 || timeRange.end,
      };
      
      if (params.matchers) {
        queryParams.matchers = params.matchers;
      }
      
      const response = await client.get('/pyroscope/api/v1/label-names', { params: queryParams });
      
      // Filter out internal labels (those starting with __)
      const labels = (response.data.data || []).filter((label: string) => !label.startsWith('__'));
      
      return createToolResult(labels);
    } catch (error: any) {
      return createErrorResult(error.response?.data?.message || error.message);
    }
  },
};

export const listPyroscopeLabelValues: ToolDefinition = {
  name: 'list_pyroscope_label_values',
  description: 'Lists all available label values for a particular label name in profiles',
  inputSchema: ListPyroscopeLabelValuesSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = createPyroscopeClient(context.config.grafanaConfig, params.data_source_uid);
      const timeRange = params.start_rfc_3339 || params.end_rfc_3339 
        ? { start: '', end: '' } 
        : getDefaultTimeRange();
      
      const queryParams: any = {
        label: params.name,
        start: params.start_rfc_3339 || timeRange.start,
        end: params.end_rfc_3339 || timeRange.end,
      };
      
      if (params.matchers) {
        queryParams.matchers = params.matchers;
      }
      
      const response = await client.get('/pyroscope/api/v1/label-values', { params: queryParams });
      
      return createToolResult(response.data.data || []);
    } catch (error: any) {
      return createErrorResult(error.response?.data?.message || error.message);
    }
  },
};

export const listPyroscopeProfileTypes: ToolDefinition = {
  name: 'list_pyroscope_profile_types',
  description: 'Lists all available profile types in a Pyroscope datasource',
  inputSchema: ListPyroscopeProfileTypesSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = createPyroscopeClient(context.config.grafanaConfig, params.data_source_uid);
      const timeRange = params.start_rfc_3339 || params.end_rfc_3339 
        ? { start: '', end: '' } 
        : getDefaultTimeRange();
      
      const queryParams: any = {
        start: params.start_rfc_3339 || timeRange.start,
        end: params.end_rfc_3339 || timeRange.end,
      };
      
      const response = await client.get('/pyroscope/api/v1/profile-types', { params: queryParams });
      
      return createToolResult(response.data.data || []);
    } catch (error: any) {
      return createErrorResult(error.response?.data?.message || error.message);
    }
  },
};

export const fetchPyroscopeProfile: ToolDefinition = {
  name: 'fetch_pyroscope_profile',
  description: 'Fetches a profile from a Pyroscope data source for a given time range',
  inputSchema: FetchPyroscopeProfileSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = createPyroscopeClient(context.config.grafanaConfig, params.data_source_uid);
      const timeRange = params.start_rfc_3339 || params.end_rfc_3339 
        ? { start: '', end: '' } 
        : getDefaultTimeRange();
      
      const queryParams: any = {
        query: params.profile_type,
        from: params.start_rfc_3339 || timeRange.start,
        until: params.end_rfc_3339 || timeRange.end,
        format: 'dot', // Return in DOT format
      };
      
      if (params.matchers) {
        queryParams.query = `${params.profile_type}${params.matchers}`;
      }
      
      if (params.max_node_depth !== undefined && params.max_node_depth !== -1) {
        queryParams.max_nodes = params.max_node_depth;
      }
      
      const response = await client.get('/pyroscope/render', { params: queryParams });
      
      // Clean up DOT format output
      let dotContent = response.data;
      if (typeof dotContent === 'object') {
        dotContent = JSON.stringify(dotContent, null, 2);
      }
      
      return createToolResult({
        profile_type: params.profile_type,
        format: 'dot',
        content: dotContent,
      });
    } catch (error: any) {
      return createErrorResult(error.response?.data?.message || error.message);
    }
  },
};

export function registerPyroscopeTools(server: any) {
  server.registerTool(listPyroscopeLabelNames);
  server.registerTool(listPyroscopeLabelValues);
  server.registerTool(listPyroscopeProfileTypes);
  server.registerTool(fetchPyroscopeProfile);
}