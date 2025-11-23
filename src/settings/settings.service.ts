import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsResponseDto } from './dto/settings-response.dto';
import { validateSocket } from '../common/utils/socket-validator';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SettingsService {
  constructor(
    @Inject(forwardRef(() => WhatsAppService))
    private readonly whatsappService: WhatsAppService,
    private readonly prisma: DatabaseService,
  ) {}

  async updateSettings(
    sessionId: string,
    dto: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const updateData: any = {};

    if (dto.rejectCall !== undefined) {
      updateData.rejectCall = dto.rejectCall;
    }

    if (dto.groupsIgnore !== undefined) {
      updateData.groupsIgnore = dto.groupsIgnore;
    }

    if (dto.alwaysOnline !== undefined) {
      updateData.alwaysOnline = dto.alwaysOnline;
    }

    if (dto.readMessages !== undefined) {
      updateData.readMessages = dto.readMessages;
    }

    if (dto.readStatus !== undefined) {
      updateData.readStatus = dto.readStatus;
    }

    if (dto.syncFullHistory !== undefined) {
      updateData.syncFullHistory = dto.syncFullHistory;
    }

    if (dto.profilePicture !== undefined) {
      await socket.updateProfilePicturePrivacy(dto.profilePicture);
      updateData.profilePicture = dto.profilePicture;
    }

    if (dto.status !== undefined) {
      await socket.updateStatusPrivacy(dto.status);
      updateData.status = dto.status;
    }

    if (dto.lastSeen !== undefined) {
      await socket.updateLastSeenPrivacy(dto.lastSeen);
      updateData.lastSeen = dto.lastSeen;
    }

    if (dto.online !== undefined) {
      await socket.updateOnlinePrivacy(dto.online);
      updateData.online = dto.online;
    }

    if (dto.call !== undefined) {
      await socket.updateCallPrivacy(dto.call);
      updateData.call = dto.call;
    }

    if (dto.messages !== undefined) {
      await socket.updateMessagesPrivacy(dto.messages);
      updateData.messages = dto.messages;
    }

    if (dto.readReceipts !== undefined) {
      await socket.updateReadReceiptsPrivacy(dto.readReceipts);
      updateData.readReceipts = dto.readReceipts;
    }

    if (dto.groupsAdd !== undefined) {
      await socket.updateGroupsAddPrivacy(dto.groupsAdd);
      updateData.groupsAdd = dto.groupsAdd;
    }

    const settings = await this.prisma.sessionSettings.upsert({
      where: { sessionId },
      create: {
        sessionId,
        ...updateData,
      },
      update: updateData,
    });

    return {
      rejectCall: settings.rejectCall,
      groupsIgnore: settings.groupsIgnore,
      alwaysOnline: settings.alwaysOnline,
      readMessages: settings.readMessages,
      readStatus: settings.readStatus,
      syncFullHistory: settings.syncFullHistory,
      profilePicture: settings.profilePicture ?? undefined,
      status: settings.status ?? undefined,
      lastSeen: settings.lastSeen ?? undefined,
      online: settings.online ?? undefined,
      call: settings.call ?? undefined,
      messages: settings.messages ?? undefined,
      readReceipts: settings.readReceipts ?? undefined,
      groupsAdd: settings.groupsAdd ?? undefined,
    };
  }

  async getSettings(sessionId: string): Promise<SettingsResponseDto> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const settings = await this.prisma.sessionSettings.findUnique({
      where: { sessionId },
    });

    if (!settings) {
      return {};
    }

    return {
      rejectCall: settings.rejectCall,
      groupsIgnore: settings.groupsIgnore,
      alwaysOnline: settings.alwaysOnline,
      readMessages: settings.readMessages,
      readStatus: settings.readStatus,
      syncFullHistory: settings.syncFullHistory,
      profilePicture: settings.profilePicture ?? undefined,
      status: settings.status ?? undefined,
      lastSeen: settings.lastSeen ?? undefined,
      online: settings.online ?? undefined,
      call: settings.call ?? undefined,
      messages: settings.messages ?? undefined,
      readReceipts: settings.readReceipts ?? undefined,
      groupsAdd: settings.groupsAdd ?? undefined,
    };
  }
}
