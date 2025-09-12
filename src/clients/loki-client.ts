import { BaseClient } from './base-client';
import { GrafanaConfig } from '../types/config';

export interface LokiLogEntry {
  timestamp: string;
  labels: Record<string, string>;
  line?: string;
  value?: string;
}

export interface LokiStats {
  streams: number;
  chunks: number;
  entries: number;
  bytes: number;
}

export class LokiClient extends BaseClient {
  constructor(config: GrafanaConfig, datasourceUid: string) {
    // Use Grafana proxy endpoint for Loki queries
    super(config, `${config.url}/api/datasources/proxy/uid/${datasourceUid}`);
  }

  async queryLogs(
    query: string,
    start?: string,
    end?: string,
    limit?: number,
    direction?: 'forward' | 'backward'
  ): Promise<LokiLogEntry[]> {
    try {
      const params: any = { query };
      if (start) params.start = start;
      if (end) params.end = end;
      if (limit) params.limit = limit;
      if (direction) params.direction = direction;

      const response = await this.client.get('/loki/api/v1/query_range', { params });

      if (response.data.status !== 'success') {
        throw new Error(`Loki query failed: ${response.data.error || 'Unknown error'}`);
      }

      const results: LokiLogEntry[] = [];
      for (const stream of response.data.data.result) {
        const labels = stream.stream;
        for (const [timestamp, line] of stream.values) {
          results.push({
            timestamp,
            labels,
            line,
          });
        }
      }

      return results;
    } catch (error) {
      this.handleError(error);
    }
  }

  async queryStats(query: string, start?: string, end?: string): Promise<LokiStats> {
    try {
      const params: any = { query };
      if (start) params.start = start;
      if (end) params.end = end;

      const response = await this.client.get('/loki/api/v1/index/stats', { params });

      if (response.data.status !== 'success') {
        throw new Error(`Loki stats query failed: ${response.data.error || 'Unknown error'}`);
      }

      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getLabelNames(start?: string, end?: string): Promise<string[]> {
    try {
      const params: any = {};
      if (start) params.start = start;
      if (end) params.end = end;

      const response = await this.client.get('/loki/api/v1/labels', { params });

      if (response.data.status !== 'success') {
        throw new Error(`Failed to get label names: ${response.data.error || 'Unknown error'}`);
      }

      return response.data.data || [];
    } catch (error) {
      this.handleError(error);
    }
  }

  async getLabelValues(label: string, start?: string, end?: string): Promise<string[]> {
    try {
      const params: any = {};
      if (start) params.start = start;
      if (end) params.end = end;

      const response = await this.client.get(`/loki/api/v1/label/${label}/values`, { params });

      if (response.data.status !== 'success') {
        throw new Error(`Failed to get label values: ${response.data.error || 'Unknown error'}`);
      }

      return response.data.data || [];
    } catch (error) {
      this.handleError(error);
    }
  }
}