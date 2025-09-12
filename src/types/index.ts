export * from './config';

export interface ToolCategory {
  name: string;
  description: string;
  tools: string[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    name: 'search',
    description: 'Search for dashboards and other resources',
    tools: ['search_dashboards'],
  },
  {
    name: 'dashboard',
    description: 'Dashboard management tools',
    tools: [
      'get_dashboard_by_uid',
      'get_dashboard_summary',
      'get_dashboard_property',
      'get_dashboard_panel_queries',
      'update_dashboard',
    ],
  },
  {
    name: 'datasource',
    description: 'Datasource management tools',
    tools: ['list_datasources', 'get_datasource_by_uid', 'get_datasource_by_name'],
  },
  {
    name: 'prometheus',
    description: 'Prometheus query and metadata tools',
    tools: [
      'query_prometheus',
      'list_prometheus_metric_names',
      'list_prometheus_metric_metadata',
      'list_prometheus_label_names',
      'list_prometheus_label_values',
    ],
  },
  {
    name: 'loki',
    description: 'Loki log query and analysis tools',
    tools: [
      'query_loki_logs',
      'query_loki_stats',
      'list_loki_label_names',
      'list_loki_label_values',
      'find_error_pattern_logs',
    ],
  },
  {
    name: 'incident',
    description: 'Incident management tools',
    tools: ['list_incidents', 'get_incident', 'create_incident', 'add_activity_to_incident'],
  },
  {
    name: 'alerting',
    description: 'Alerting and notification tools',
    tools: ['list_alert_rules', 'get_alert_rule_by_uid', 'list_contact_points'],
  },
  {
    name: 'oncall',
    description: 'OnCall schedule and shift management',
    tools: [
      'list_oncall_schedules',
      'list_oncall_teams',
      'list_oncall_users',
      'get_current_oncall_users',
      'get_oncall_shift',
    ],
  },
  {
    name: 'admin',
    description: 'User and team administration',
    tools: ['list_users_by_org', 'list_teams'],
  },
  {
    name: 'sift',
    description: 'Sift investigation and analysis tools',
    tools: [
      'list_sift_investigations',
      'get_sift_investigation',
      'get_sift_analysis',
      'find_slow_requests',
    ],
  },
  {
    name: 'pyroscope',
    description: 'Profiling and performance analysis',
    tools: [
      'fetch_pyroscope_profile',
      'list_pyroscope_profile_types',
      'list_pyroscope_label_names',
      'list_pyroscope_label_values',
    ],
  },
  {
    name: 'navigation',
    description: 'Generate deeplinks to Grafana resources',
    tools: ['generate_deeplink'],
  },
  {
    name: 'asserts',
    description: 'Entity assertions and validation',
    tools: ['get_assertions'],
  },
];