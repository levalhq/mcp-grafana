import { BaseClient } from './base-client';
import { GrafanaConfig } from '../types/config';

export interface PrometheusQueryResult {
  metric: Record<string, string>;
  value?: [number, string];  // [timestamp, value] for instant queries
  values?: [number, string][];  // Array of [timestamp, value] for range queries
}

export class PrometheusClient extends BaseClient {
  constructor(config: GrafanaConfig, datasourceUid: string) {
    // Use Grafana proxy endpoint for Prometheus queries
    super(config, `${config.url}/api/datasources/proxy/uid/${datasourceUid}`);
  }

  async query(expr: string, time?: string): Promise<PrometheusQueryResult[]> {
    try {
      const params: any = { query: expr };
      if (time) {
        params.time = time;
      }

      const response = await this.client.get('/api/v1/query', { params });
      
      if (response.data.status !== 'success') {
        throw new Error(`Prometheus query failed: ${response.data.error}`);
      }

      return response.data.data.result;
    } catch (error) {
      this.handleError(error);
    }
  }

  async queryRange(
    expr: string,
    start: string,
    end: string,
    step: string
  ): Promise<PrometheusQueryResult[]> {
    try {
      const response = await this.client.get('/api/v1/query_range', {
        params: {
          query: expr,
          start,
          end,
          step,
        },
      });

      if (response.data.status !== 'success') {
        throw new Error(`Prometheus query failed: ${response.data.error}`);
      }

      return response.data.data.result;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getLabelNames(match?: string[], start?: string, end?: string): Promise<string[]> {
    try {
      const params: any = {};
      if (match && match.length > 0) {
        params['match[]'] = match;
      }
      if (start) params.start = start;
      if (end) params.end = end;

      const response = await this.client.get('/api/v1/labels', { params });

      if (response.data.status !== 'success') {
        throw new Error(`Failed to get label names: ${response.data.error}`);
      }

      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getLabelValues(
    label: string,
    match?: string[],
    start?: string,
    end?: string
  ): Promise<string[]> {
    try {
      const params: any = {};
      if (match && match.length > 0) {
        params['match[]'] = match;
      }
      if (start) params.start = start;
      if (end) params.end = end;

      const response = await this.client.get(`/api/v1/label/${label}/values`, { params });

      if (response.data.status !== 'success') {
        throw new Error(`Failed to get label values: ${response.data.error}`);
      }

      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMetricMetadata(metric?: string, limit?: number): Promise<any[]> {
    try {
      const params: any = {};
      if (metric) params.metric = metric;
      if (limit) params.limit = limit;

      const response = await this.client.get('/api/v1/metadata', { params });

      if (response.data.status !== 'success') {
        throw new Error(`Failed to get metric metadata: ${response.data.error}`);
      }

      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getSeries(match: string[], start?: string, end?: string): Promise<any[]> {
    try {
      const params: any = { 'match[]': match };
      if (start) params.start = start;
      if (end) params.end = end;

      const response = await this.client.get('/api/v1/series', { params });

      if (response.data.status !== 'success') {
        throw new Error(`Failed to get series: ${response.data.error}`);
      }

      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}