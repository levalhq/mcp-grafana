import { BaseClient } from './base-client';
import { GrafanaConfig } from '../types/config';

export interface Dashboard {
  uid: string;
  title: string;
  tags?: string[];
  folder?: any;
  panels?: any[];
  templating?: any;
  [key: string]: any;
}

export interface Datasource {
  id: number;
  uid: string;
  name: string;
  type: string;
  url?: string;
  isDefault?: boolean;
  [key: string]: any;
}

export interface AlertRule {
  uid: string;
  title: string;
  state?: string;
  labels?: Record<string, string>;
  [key: string]: any;
}

export interface Team {
  id: number;
  name: string;
  email?: string;
  [key: string]: any;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  login?: string;
  role?: string;
  [key: string]: any;
}

export class GrafanaClient extends BaseClient {
  constructor(config: GrafanaConfig) {
    super(config);
  }

  // Dashboard methods
  async searchDashboards(query: string): Promise<any[]> {
    try {
      const response = await this.client.get('/api/search', {
        params: { query, type: 'dash-db' },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDashboardByUid(uid: string): Promise<Dashboard> {
    try {
      const response = await this.client.get(`/api/dashboards/uid/${uid}`);
      return response.data.dashboard;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateDashboard(dashboard: Dashboard, message?: string): Promise<any> {
    try {
      const response = await this.client.post('/api/dashboards/db', {
        dashboard,
        message: message || 'Updated via MCP',
        overwrite: true,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Datasource methods
  async listDatasources(type?: string): Promise<Datasource[]> {
    try {
      const response = await this.client.get('/api/datasources');
      let datasources = response.data;
      
      if (type) {
        datasources = datasources.filter((ds: Datasource) => ds.type === type);
      }
      
      return datasources;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDatasourceByUid(uid: string): Promise<Datasource> {
    try {
      const response = await this.client.get(`/api/datasources/uid/${uid}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getDatasourceByName(name: string): Promise<Datasource> {
    try {
      const response = await this.client.get(`/api/datasources/name/${name}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Alert methods
  async listAlertRules(filters?: any): Promise<AlertRule[]> {
    try {
      const response = await this.client.get('/api/v1/provisioning/alert-rules', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getAlertRuleByUid(uid: string): Promise<AlertRule> {
    try {
      const response = await this.client.get(`/api/v1/provisioning/alert-rules/${uid}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listContactPoints(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/v1/provisioning/contact-points');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Admin methods
  async listTeams(query?: string): Promise<Team[]> {
    try {
      const response = await this.client.get('/api/teams/search', {
        params: { query },
      });
      return response.data.teams;
    } catch (error) {
      this.handleError(error);
    }
  }

  async listUsers(): Promise<User[]> {
    try {
      const response = await this.client.get('/api/org/users');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}