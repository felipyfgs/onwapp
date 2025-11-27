import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';
import { SessionStatus } from '@prisma/client';
import {
  CreateGroupDto,
  CreateGroupResponseDto,
  GroupMetadataResponseDto,
  InviteCodeResponseDto,
  GroupInfoByCodeResponseDto,
  ParticipantAction,
  GroupSetting,
} from './dto';

@Injectable()
export class GroupsService {
  constructor(private readonly whaileysService: WhaileysService) {}

  private getSocket(sessionName: string) {
    const session = this.whaileysService.getSession(sessionName);
    if (!session) {
      throw new NotFoundException(`Session '${sessionName}' not found`);
    }
    if (session.status !== SessionStatus.connected) {
      throw new BadRequestException(
        `Session '${sessionName}' is not connected`,
      );
    }
    return session.socket;
  }

  private formatJid(phone: string): string {
    return phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
  }

  private formatGroupJid(groupId: string): string {
    return groupId.includes('@') ? groupId : `${groupId}@g.us`;
  }

  async createGroup(
    sessionName: string,
    dto: CreateGroupDto,
  ): Promise<CreateGroupResponseDto> {
    const socket = this.getSocket(sessionName);
    const participants = dto.participants.map((p) => this.formatJid(p));
    const group = await socket.groupCreate(dto.subject, participants);
    return {
      id: group.id,
      gid: group.id,
    };
  }

  async getGroupMetadata(
    sessionName: string,
    groupId: string,
  ): Promise<GroupMetadataResponseDto> {
    const socket = this.getSocket(sessionName);
    const jid = this.formatGroupJid(groupId);
    const metadata = await socket.groupMetadata(jid);
    return {
      id: metadata.id,
      subject: metadata.subject,
      desc: metadata.desc,
      creation: metadata.creation,
      owner: metadata.owner,
      participants: metadata.participants.map((p) => ({
        id: p.id,
        admin: p.admin || undefined,
      })),
    };
  }

  async updateGroupSubject(
    sessionName: string,
    groupId: string,
    subject: string,
  ): Promise<void> {
    const socket = this.getSocket(sessionName);
    const jid = this.formatGroupJid(groupId);
    await socket.groupUpdateSubject(jid, subject);
  }

  async updateGroupDescription(
    sessionName: string,
    groupId: string,
    description: string,
  ): Promise<void> {
    const socket = this.getSocket(sessionName);
    const jid = this.formatGroupJid(groupId);
    await socket.groupUpdateDescription(jid, description);
  }

  async updateParticipants(
    sessionName: string,
    groupId: string,
    participants: string[],
    action: ParticipantAction,
  ): Promise<unknown> {
    const socket = this.getSocket(sessionName);
    const jid = this.formatGroupJid(groupId);
    const jids = participants.map((p) => this.formatJid(p));
    return socket.groupParticipantsUpdate(jid, jids, action);
  }

  async updateGroupSettings(
    sessionName: string,
    groupId: string,
    setting: GroupSetting,
  ): Promise<void> {
    const socket = this.getSocket(sessionName);
    const jid = this.formatGroupJid(groupId);
    await socket.groupSettingUpdate(jid, setting);
  }

  async getInviteCode(
    sessionName: string,
    groupId: string,
  ): Promise<InviteCodeResponseDto> {
    const socket = this.getSocket(sessionName);
    const jid = this.formatGroupJid(groupId);
    const inviteCode = await socket.groupInviteCode(jid);
    return {
      inviteCode: inviteCode || '',
      inviteLink: `https://chat.whatsapp.com/${inviteCode || ''}`,
    };
  }

  async revokeInviteCode(
    sessionName: string,
    groupId: string,
  ): Promise<InviteCodeResponseDto> {
    const socket = this.getSocket(sessionName);
    const jid = this.formatGroupJid(groupId);
    const inviteCode = await socket.groupRevokeInvite(jid);
    return {
      inviteCode: inviteCode || '',
      inviteLink: `https://chat.whatsapp.com/${inviteCode || ''}`,
    };
  }

  async getGroupInfoByCode(
    sessionName: string,
    inviteCode: string,
  ): Promise<GroupInfoByCodeResponseDto> {
    const socket = this.getSocket(sessionName);
    const info = await socket.groupGetInviteInfo(inviteCode);
    return {
      id: info.id,
      subject: info.subject,
      desc: info.desc,
      size: info.size,
    };
  }

  async joinGroup(sessionName: string, inviteCode: string): Promise<string> {
    const socket = this.getSocket(sessionName);
    const groupId = await socket.groupAcceptInvite(inviteCode);
    return groupId || '';
  }

  async leaveGroup(sessionName: string, groupId: string): Promise<void> {
    const socket = this.getSocket(sessionName);
    const jid = this.formatGroupJid(groupId);
    await socket.groupLeave(jid);
  }

  async updateGroupPicture(
    sessionName: string,
    groupId: string,
    imageUrl: string,
  ): Promise<void> {
    const jid = this.formatGroupJid(groupId);
    await this.whaileysService.updateGroupPicture(sessionName, jid, imageUrl);
  }

  async acceptInviteV4(
    sessionName: string,
    senderId: string,
    inviteMessage: {
      groupJid: string;
      inviteCode: string;
      inviteExpiration: number;
      groupName?: string;
    },
  ): Promise<string> {
    const result = await this.whaileysService.groupAcceptInviteV4(
      sessionName,
      senderId,
      inviteMessage,
    );
    return result || '';
  }

  async fetchAllParticipating(
    sessionName: string,
  ): Promise<Record<string, GroupMetadataResponseDto>> {
    const socket = this.getSocket(sessionName);
    const groups = await socket.groupFetchAllParticipating();
    const result: Record<string, GroupMetadataResponseDto> = {};
    for (const [id, metadata] of Object.entries(groups)) {
      result[id] = {
        id: metadata.id,
        subject: metadata.subject,
        desc: metadata.desc,
        creation: metadata.creation,
        owner: metadata.owner,
        participants: metadata.participants.map((p) => ({
          id: p.id,
          admin: p.admin || undefined,
        })),
      };
    }
    return result;
  }

  async toggleEphemeral(
    sessionName: string,
    groupId: string,
    expiration: number,
  ): Promise<void> {
    const socket = this.getSocket(sessionName);
    const jid = this.formatGroupJid(groupId);
    await socket.groupToggleEphemeral(jid, expiration);
  }
}
