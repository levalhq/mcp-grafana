import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { GrafanaConfig } from '../types/config';
import * as https from 'https';
import * as fs from 'fs';

export abstract class BaseClient {
  protected client: AxiosInstance;
  protected config: GrafanaConfig;

  constructor(config: GrafanaConfig, baseURL?: string) {
    this.config = config;
    
    const axiosConfig: AxiosRequestConfig = {
      baseURL: baseURL || config.url,
      timeout: 30000,
      headers: {
        'User-Agent': 'mcp-grafana/1.0.0',
      },
    };

    // Set up authentication
    if (config.serviceAccountToken) {
      axiosConfig.headers!['Authorization'] = `Bearer ${config.serviceAccountToken}`;
    } else if (config.apiKey) {
      axiosConfig.headers!['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.username && config.password) {
      axiosConfig.auth = {
        username: config.username,
        password: config.password,
      };
    } else if (config.accessToken) {
      axiosConfig.headers!['Authorization'] = `Bearer ${config.accessToken}`;
    }

    // Set up ID token for on-behalf-of auth
    if (config.idToken) {
      axiosConfig.headers!['X-Id-Token'] = config.idToken;
    }

    // Set up TLS configuration
    if (config.tlsConfig) {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: !config.tlsConfig.skipVerify,
      });

      if (config.tlsConfig.certFile && config.tlsConfig.keyFile) {
        httpsAgent.options.cert = fs.readFileSync(config.tlsConfig.certFile);
        httpsAgent.options.key = fs.readFileSync(config.tlsConfig.keyFile);
      }

      if (config.tlsConfig.caFile) {
        httpsAgent.options.ca = fs.readFileSync(config.tlsConfig.caFile);
      }

      axiosConfig.httpsAgent = httpsAgent;
    }

    this.client = axios.create(axiosConfig);

    // Add debug logging if enabled
    if (config.debug) {
      this.client.interceptors.request.use(
        (request) => {
          console.log('Request:', {
            method: request.method,
            url: request.url,
            headers: this.sanitizeHeaders(request.headers),
          });
          return request;
        },
        (error) => {
          console.error('Request Error:', error);
          return Promise.reject(error);
        }
      );

      this.client.interceptors.response.use(
        (response) => {
          console.log('Response:', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
          });
          return response;
        },
        (error) => {
          console.error('Response Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          });
          return Promise.reject(error);
        }
      );
    }
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = '[REDACTED]';
    }
    if (sanitized['X-Id-Token']) {
      sanitized['X-Id-Token'] = '[REDACTED]';
    }
    return sanitized;
  }

  protected handleError(error: any): never {
    if (error.response) {
      const message = error.response.data?.message || error.response.statusText;
      throw new Error(`Grafana API error (${error.response.status}): ${message}`);
    } else if (error.request) {
      throw new Error('No response from Grafana server');
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}