import { GrafanaConfig } from '../types/config';
import * as dotenv from 'dotenv';

dotenv.config();

export function loadGrafanaConfig(): Partial<GrafanaConfig> {
  const config: Partial<GrafanaConfig> = {
    debug: process.env.DEBUG === 'true',
    includeArgumentsInSpans: process.env.INCLUDE_ARGUMENTS_IN_SPANS === 'true',
    url: process.env.GRAFANA_URL || '',
  };

  // Service account token (preferred)
  if (process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN) {
    config.serviceAccountToken = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN;
  }
  
  // Legacy API key (deprecated)
  if (process.env.GRAFANA_API_KEY) {
    console.warn(
      'Warning: GRAFANA_API_KEY is deprecated. Please use GRAFANA_SERVICE_ACCOUNT_TOKEN instead.'
    );
    config.apiKey = process.env.GRAFANA_API_KEY;
  }

  // Basic auth
  if (process.env.GRAFANA_USERNAME && process.env.GRAFANA_PASSWORD) {
    config.username = process.env.GRAFANA_USERNAME;
    config.password = process.env.GRAFANA_PASSWORD;
  }

  // Cloud tokens
  if (process.env.GRAFANA_ACCESS_TOKEN) {
    config.accessToken = process.env.GRAFANA_ACCESS_TOKEN;
  }

  if (process.env.GRAFANA_ID_TOKEN) {
    config.idToken = process.env.GRAFANA_ID_TOKEN;
  }

  // TLS config
  if (
    process.env.TLS_CERT_FILE ||
    process.env.TLS_KEY_FILE ||
    process.env.TLS_CA_FILE ||
    process.env.TLS_SKIP_VERIFY
  ) {
    config.tlsConfig = {
      certFile: process.env.TLS_CERT_FILE,
      keyFile: process.env.TLS_KEY_FILE,
      caFile: process.env.TLS_CA_FILE,
      skipVerify: process.env.TLS_SKIP_VERIFY === 'true',
    };
  }

  return config;
}

export function validateGrafanaConfig(config: Partial<GrafanaConfig>): GrafanaConfig {
  if (!config.url) {
    throw new Error('GRAFANA_URL environment variable is required');
  }

  // Check for at least one auth method
  const hasAuth =
    config.serviceAccountToken ||
    config.apiKey ||
    (config.username && config.password) ||
    config.accessToken;

  if (!hasAuth) {
    throw new Error(
      'At least one authentication method is required: ' +
        'GRAFANA_SERVICE_ACCOUNT_TOKEN, GRAFANA_API_KEY, ' +
        'GRAFANA_USERNAME/PASSWORD, or GRAFANA_ACCESS_TOKEN'
    );
  }

  return config as GrafanaConfig;
}