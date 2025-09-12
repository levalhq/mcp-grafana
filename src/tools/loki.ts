import { z } from 'zod';
import { ToolDefinition, ToolContext, createToolResult, createErrorResult } from '../server/mcp-server';
import { LokiClient } from '../clients/loki-client';

// Helper function to get default time range (last hour)
function getDefaultTimeRange(): { start: string; end: string } {
  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 3600;
  return {
    start: oneHourAgo.toString(),
    end: now.toString(),
  };
}

interface TimeRange {
  start: string;
  end: string;
}

// Schema definitions
const ListLokiLabelNamesSchema = z.object({
  datasourceUid: z.string().describe('The UID of the datasource to query'),
  startRfc3339: z.string().optional().describe('The start time of the query in RFC3339 format'),
  endRfc3339: z.string().optional().describe('The end time of the query in RFC3339 format'),
});

const ListLokiLabelValuesSchema = z.object({
  datasourceUid: z.string().describe('The UID of the datasource to query'),
  labelName: z.string().describe('The name of the label to retrieve values for'),
  startRfc3339: z.string().optional().describe('The start time of the query in RFC3339 format'),
  endRfc3339: z.string().optional().describe('The end time of the query in RFC3339 format'),
});

const QueryLokiLogsSchema = z.object({
  datasourceUid: z.string().describe('The UID of the datasource to query'),
  logql: z.string().describe('The LogQL query to execute against Loki'),
  startRfc3339: z.string().optional().describe('The start time of the query in RFC3339 format'),
  endRfc3339: z.string().optional().describe('The end time of the query in RFC3339 format'),
  limit: z.number().optional().describe('Maximum number of log lines to return (default: 10, max: 100)'),
  direction: z.enum(['forward', 'backward']).optional().describe('Direction of the query'),
});

const QueryLokiStatsSchema = z.object({
  datasourceUid: z.string().describe('The UID of the datasource to query'),
  logql: z.string().describe('The LogQL matcher expression to execute'),
  startRfc3339: z.string().optional().describe('The start time of the query in RFC3339 format'),
  endRfc3339: z.string().optional().describe('The end time of the query in RFC3339 format'),
});

const FindErrorPatternLogsSchema = z.object({
  name: z.string().describe('The name of the investigation'),
  labels: z.record(z.string()).describe('Labels to scope the analysis'),
  start: z.string().optional().describe('Start time for the investigation'),
  end: z.string().optional().describe('End time for the investigation'),
});

// Tool definitions
export const listLokiLabelNames: ToolDefinition = {
  name: 'list_loki_label_names',
  description: 'Lists all available label names (keys) found in logs within a specified Loki datasource and time range',
  inputSchema: ListLokiLabelNamesSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new LokiClient(context.config.grafanaConfig, params.datasourceUid);
      const timeRange: TimeRange = params.startRfc3339 || params.endRfc3339 
        ? { start: '', end: '' } 
        : getDefaultTimeRange();
      
      const labels = await client.getLabelNames(
        params.startRfc3339 || timeRange.start,
        params.endRfc3339 || timeRange.end
      );
      
      return createToolResult(labels);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export const listLokiLabelValues: ToolDefinition = {
  name: 'list_loki_label_values',
  description: 'Retrieves all unique values associated with a specific labelName within a Loki datasource and time range',
  inputSchema: ListLokiLabelValuesSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new LokiClient(context.config.grafanaConfig, params.datasourceUid);
      const timeRange: TimeRange = params.startRfc3339 || params.endRfc3339 
        ? { start: '', end: '' } 
        : getDefaultTimeRange();
      
      const values = await client.getLabelValues(
        params.labelName,
        params.startRfc3339 || timeRange.start,
        params.endRfc3339 || timeRange.end
      );
      
      return createToolResult(values);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export const queryLokiLogs: ToolDefinition = {
  name: 'query_loki_logs',
  description: 'Executes a LogQL query against a Loki datasource to retrieve log entries or metric values',
  inputSchema: QueryLokiLogsSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new LokiClient(context.config.grafanaConfig, params.datasourceUid);
      const timeRange: TimeRange = params.startRfc3339 || params.endRfc3339 
        ? { start: '', end: '' } 
        : getDefaultTimeRange();
      
      const logs = await client.queryLogs(
        params.logql,
        params.startRfc3339 || timeRange.start,
        params.endRfc3339 || timeRange.end,
        Math.min(params.limit || 10, 100),
        params.direction || 'backward'
      );
      
      return createToolResult(logs);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export const queryLokiStats: ToolDefinition = {
  name: 'query_loki_stats',
  description: 'Retrieves statistics about log streams matching a given LogQL selector within a Loki datasource',
  inputSchema: QueryLokiStatsSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = new LokiClient(context.config.grafanaConfig, params.datasourceUid);
      const timeRange: TimeRange = params.startRfc3339 || params.endRfc3339 
        ? { start: '', end: '' } 
        : getDefaultTimeRange();
      
      const stats = await client.queryStats(
        params.logql,
        params.startRfc3339 || timeRange.start,
        params.endRfc3339 || timeRange.end
      );
      
      return createToolResult(stats);
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export const findErrorPatternLogs: ToolDefinition = {
  name: 'find_error_pattern_logs',
  description: 'Searches Loki logs for elevated error patterns compared to the last day\'s average',
  inputSchema: FindErrorPatternLogsSchema,
  handler: async (params, _context: ToolContext) => {
    try {
      // Note: This would require Sift client integration
      // For now, returning a placeholder
      return createToolResult({
        message: 'Sift integration required for error pattern analysis',
        investigation: params.name,
        labels: params.labels,
      });
    } catch (error: any) {
      return createErrorResult(error.message);
    }
  },
};

export function registerLokiTools(server: any) {
  server.registerTool(listLokiLabelNames);
  server.registerTool(listLokiLabelValues);
  server.registerTool(queryLokiLogs);
  server.registerTool(queryLokiStats);
  server.registerTool(findErrorPatternLogs);
}