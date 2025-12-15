import { apiClient } from '../api';
import type { 
  Group, 
  GroupInfoResponse, 
  CreateGroupRequest, 
  UpdateGroupRequest, 
  GroupRequest, 
  ApiResponse 
} from '../types/api';

export const groupService = {
  /**
   * Get all groups
   * GET /group/:session
   */
  async getGroups(session: string): Promise<Group[]> {
    const response = await apiClient.get<Group[]>(`/group/${session}`);
    return response.data;
  },

  /**
   * Get group info
   * GET /group/:session/:group/info
   */
  async getGroupInfo(session: string, group: string): Promise<GroupInfoResponse> {
    const response = await apiClient.get<GroupInfoResponse>(`/group/${session}/${group}/info`);
    return response.data;
  },

  /**
   * Create group
   * POST /group/:session
   */
  async createGroup(session: string, name: string, participants: string[], description?: string): Promise<ApiResponse> {
    const request: CreateGroupRequest = { 
      name, 
      participants, 
      description 
    };
    const response = await apiClient.post<ApiResponse>(`/group/${session}`, request);
    return response.data;
  },

  /**
   * Update group
   * PUT /group/:session/:group
   */
  async updateGroup(session: string, group: string, updates: Partial<UpdateGroupRequest>): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/group/${session}/${group}`, updates);
    return response.data;
  },

  /**
   * Delete group
   * DELETE /group/:session/:group
   */
  async deleteGroup(session: string, group: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/group/${session}/${group}`);
    return response.data;
  },

  /**
   * Leave group
   * POST /group/:session/:group/leave
   */
  async leaveGroup(session: string, group: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/group/${session}/${group}/leave`);
    return response.data;
  },

  /**
   * Add participant
   * POST /group/:session/:group/participants
   */
  async addParticipant(session: string, group: string, participant: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/group/${session}/${group}/participants`, { 
      participant 
    });
    return response.data;
  },

  /**
   * Remove participant
   * DELETE /group/:session/:group/participants/:participant
   */
  async removeParticipant(session: string, group: string, participant: string): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(`/group/${session}/${group}/participants/${participant}`);
    return response.data;
  },

  /**
   * Promote participant to admin
   * POST /group/:session/:group/promote/:participant
   */
  async promoteParticipant(session: string, group: string, participant: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/group/${session}/${group}/promote/${participant}`);
    return response.data;
  },

  /**
   * Demote participant from admin
   * POST /group/:session/:group/demote/:participant
   */
  async demoteParticipant(session: string, group: string, participant: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/group/${session}/${group}/demote/${participant}`);
    return response.data;
  },

  /**
   * Get group invite link
   * GET /group/:session/:group/invite
   */
  async getInviteLink(session: string, group: string): Promise<{ inviteLink: string }> {
    const response = await apiClient.get<{ inviteLink: string }>(`/group/${session}/${group}/invite`);
    return response.data;
  },

  /**
   * Revoke invite link
   * POST /group/:session/:group/revoke
   */
  async revokeInviteLink(session: string, group: string): Promise<{ inviteLink: string }> {
    const response = await apiClient.post<{ inviteLink: string }>(`/group/${session}/${group}/revoke`);
    return response.data;
  },

  /**
   * Join group via invite
   * POST /group/:session/join
   */
  async joinGroup(session: string, inviteCode: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/group/${session}/join`, { 
      inviteCode 
    });
    return response.data;
  },

  /**
   * Accept group invite
   * POST /group/:session/:group/accept
   */
  async acceptInvite(session: string, group: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/group/${session}/${group}/accept`);
    return response.data;
  },

  /**
   * Reject group invite
   * POST /group/:session/:group/reject
   */
  async rejectInvite(session: string, group: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/group/${session}/${group}/reject`);
    return response.data;
  },

  /**
   * Get group requests
   * GET /group/:session/requests
   */
  async getGroupRequests(session: string): Promise<GroupRequest[]> {
    const response = await apiClient.get<GroupRequest[]>(`/group/${session}/requests`);
    return response.data;
  },

  /**
   * Accept group request
   * POST /group/:session/:group/requests/:request/accept
   */
  async acceptGroupRequest(session: string, group: string, request: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/group/${session}/${group}/requests/${request}/accept`);
    return response.data;
  },

  /**
   * Reject group request
   * POST /group/:session/:group/requests/:request/reject
   */
  async rejectGroupRequest(session: string, group: string, request: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(`/group/${session}/${group}/requests/${request}/reject`);
    return response.data;
  },

  /**
   * Set group photo
   * PUT /group/:session/:group/photo
   */
  async setGroupPhoto(session: string, group: string, photo: string): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/group/${session}/${group}/photo`, { photo });
    return response.data;
  },

  /**
   * Set group description
   * PUT /group/:session/:group/description
   */
  async setGroupDescription(session: string, group: string, description: string): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/group/${session}/${group}/description`, { description });
    return response.data;
  },

  /**
   * Set group subject
   * PUT /group/:session/:group/subject
   */
  async setGroupSubject(session: string, group: string, subject: string): Promise<ApiResponse> {
    const response = await apiClient.put<ApiResponse>(`/group/${session}/${group}/subject`, { subject });
    return response.data;
  }
};

export default groupService;