export interface TLSConfig {
  certFile?: string;
  keyFile?: string;
  caFile?: string;
  skipVerify?: boolean;
}

export interface GrafanaConfig {
  debug: boolean;
  includeArgumentsInSpans: boolean;
  url: string;
  apiKey?: string;
  serviceAccountToken?: string;
  username?: string;
  password?: string;
  accessToken?: string;
  idToken?: string;
  tlsConfig?: TLSConfig;
}

export interface ServerConfig {
  transport: 'stdio' | 'sse' | 'streamable-http';
  address?: string;
  path?: string;
  port?: number;
  enabledTools: Set<string>;
  grafanaConfig: GrafanaConfig;
}