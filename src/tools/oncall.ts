import { z } from 'zod';
import { ToolDefinition, ToolContext, createToolResult, createErrorResult } from '../server/mcp-server';
import axios from 'axios';

// Schema definitions
const ListOncallSchedulesSchema = z.object({
  teamId: z.string().optional().describe('The ID of the team to list schedules for'),
  scheduleId: z.string().optional().describe('The ID of a specific schedule to retrieve'),
  page: z.number().optional().describe('The page number to return (1-based)'),
});

const ListOncallTeamsSchema = z.object({
  page: z.number().optional().describe('The page number to return'),
});

const ListOncallUsersSchema = z.object({
  userId: z.string().optional().describe('The ID of a specific user to retrieve'),
  username: z.string().optional().describe('Username to filter by'),
  page: z.number().optional().describe('The page number to return'),
});

const GetCurrentOncallUsersSchema = z.object({
  scheduleId: z.string().describe('The ID of the schedule to get current on-call users for'),
});

const GetOncallShiftSchema = z.object({
  shiftId: z.string().describe('The ID of the shift to get details for'),
});

// Helper function to create OnCall client
function createOncallClient(config: any) {
  const headers: any = {
    'User-Agent': 'mcp-grafana/1.0.0',
  };
  
  if (config.serviceAccountToken) {
    headers['Authorization'] = `Bearer ${config.serviceAccountToken}`;
  } else if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  
  return axios.create({
    baseURL: `${config.url}/api/plugins/grafana-oncall-app/resources/api/v1`,
    headers,
    timeout: 30000,
  });
}

// Tool definitions
export const listOncallSchedules: ToolDefinition = {
  name: 'list_oncall_schedules',
  description: 'List Grafana OnCall schedules, optionally filtering by team ID',
  inputSchema: ListOncallSchedulesSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = createOncallClient(context.config.grafanaConfig);
      
      const queryParams: any = {};
      if (params.teamId) queryParams.team_id = params.teamId;
      if (params.page) queryParams.page = params.page;
      
      let endpoint = '/schedules';
      if (params.scheduleId) {
        endpoint = `/schedules/${params.scheduleId}`;
      }
      
      const response = await client.get(endpoint, { params: queryParams });
      
      const schedules = params.scheduleId ? [response.data] : response.data.results || [];
      
      // Format the response
      const formatted = schedules.map((schedule: any) => ({
        id: schedule.id,
        name: schedule.name,
        teamId: schedule.team_id,
        timezone: schedule.time_zone,
        shiftIds: schedule.on_call_now || [],
      }));
      
      return createToolResult(formatted);
    } catch (error: any) {
      return createErrorResult(error.response?.data?.detail || error.message);
    }
  },
};

export const listOncallTeams: ToolDefinition = {
  name: 'list_oncall_teams',
  description: 'List teams configured in Grafana OnCall',
  inputSchema: ListOncallTeamsSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = createOncallClient(context.config.grafanaConfig);
      
      const queryParams: any = {};
      if (params.page) queryParams.page = params.page;
      
      const response = await client.get('/teams', { params: queryParams });
      
      const teams = response.data.results || [];
      
      // Format the response
      const formatted = teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        email: team.email,
        avatarUrl: team.avatar_url,
      }));
      
      return createToolResult(formatted);
    } catch (error: any) {
      return createErrorResult(error.response?.data?.detail || error.message);
    }
  },
};

export const listOncallUsers: ToolDefinition = {
  name: 'list_oncall_users',
  description: 'List users from Grafana OnCall. Can retrieve all users, a specific user, or filter by username',
  inputSchema: ListOncallUsersSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = createOncallClient(context.config.grafanaConfig);
      
      const queryParams: any = {};
      if (params.username) queryParams.username = params.username;
      if (params.page) queryParams.page = params.page;
      
      let endpoint = '/users';
      if (params.userId) {
        endpoint = `/users/${params.userId}`;
      }
      
      const response = await client.get(endpoint, { params: queryParams });
      
      const users = params.userId ? [response.data] : response.data.results || [];
      
      // Format the response
      const formatted = users.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        timezone: user.timezone,
        teams: user.teams,
      }));
      
      return createToolResult(formatted);
    } catch (error: any) {
      return createErrorResult(error.response?.data?.detail || error.message);
    }
  },
};

export const getCurrentOncallUsers: ToolDefinition = {
  name: 'get_current_oncall_users',
  description: 'Get the list of users currently on-call for a specific Grafana OnCall schedule',
  inputSchema: GetCurrentOncallUsersSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = createOncallClient(context.config.grafanaConfig);
      
      const response = await client.get(`/schedules/${params.scheduleId}`);
      const schedule = response.data;
      
      // Get users currently on call
      const onCallNow = schedule.on_call_now || [];
      const users = [];
      
      for (const userInfo of onCallNow) {
        if (userInfo.user) {
          users.push({
            id: userInfo.user.id,
            username: userInfo.user.username,
            email: userInfo.user.email,
            name: userInfo.user.name,
          });
        }
      }
      
      return createToolResult({
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        currentOncallUsers: users,
      });
    } catch (error: any) {
      return createErrorResult(error.response?.data?.detail || error.message);
    }
  },
};

export const getOncallShift: ToolDefinition = {
  name: 'get_oncall_shift',
  description: 'Get detailed information for a specific Grafana OnCall shift',
  inputSchema: GetOncallShiftSchema,
  handler: async (params, context: ToolContext) => {
    try {
      const client = createOncallClient(context.config.grafanaConfig);
      
      const response = await client.get(`/on_call_shifts/${params.shiftId}`);
      const shift = response.data;
      
      return createToolResult({
        id: shift.id,
        name: shift.name,
        type: shift.type,
        teamId: shift.team_id,
        start: shift.start,
        duration: shift.duration,
        frequency: shift.frequency,
        users: shift.users,
      });
    } catch (error: any) {
      return createErrorResult(error.response?.data?.detail || error.message);
    }
  },
};

export function registerOncallTools(server: any) {
  server.registerTool(listOncallSchedules);
  server.registerTool(listOncallTeams);
  server.registerTool(listOncallUsers);
  server.registerTool(getCurrentOncallUsers);
  server.registerTool(getOncallShift);
}