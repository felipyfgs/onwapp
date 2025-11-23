import { Injectable, BadRequestException } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsResponseDto } from './dto/settings-response.dto';

@Injectable()
export class SettingsService {
  private settingsCache: Map<string, SettingsResponseDto> = new Map();

  constructor(private readonly whatsappService: WhatsAppService) {}

  async updateSettings(
    sessionId: string,
    dto: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    let currentSettings = this.settingsCache.get(sessionId) || {};

    if (dto.rejectCall !== undefined) {
      currentSettings.rejectCall = dto.rejectCall;
    }

    if (dto.groupsIgnore !== undefined) {
      currentSettings.groupsIgnore = dto.groupsIgnore;
    }

    if (dto.alwaysOnline !== undefined) {
      currentSettings.alwaysOnline = dto.alwaysOnline;
    }

    if (dto.readMessages !== undefined) {
      currentSettings.readMessages = dto.readMessages;
    }

    if (dto.readStatus !== undefined) {
      currentSettings.readStatus = dto.readStatus;
    }

    if (dto.syncFullHistory !== undefined) {
      currentSettings.syncFullHistory = dto.syncFullHistory;
    }

    if (dto.profilePicture !== undefined) {
      await socket.updateProfilePicturePrivacy(dto.profilePicture);
      currentSettings.profilePicture = dto.profilePicture;
    }

    if (dto.status !== undefined) {
      await socket.updateStatusPrivacy(dto.status);
      currentSettings.status = dto.status;
    }

    if (dto.lastSeen !== undefined) {
      await socket.updateLastSeenPrivacy(dto.lastSeen);
      currentSettings.lastSeen = dto.lastSeen;
    }

    if (dto.online !== undefined) {
      await socket.updateOnlinePrivacy(dto.online);
      currentSettings.online = dto.online;
    }

    if (dto.call !== undefined) {
      await socket.updateCallPrivacy(dto.call);
      currentSettings.call = dto.call;
    }

    if (dto.messages !== undefined) {
      await socket.updateMessagesPrivacy(dto.messages);
      currentSettings.messages = dto.messages;
    }

    if (dto.readReceipts !== undefined) {
      await socket.updateReadReceiptsPrivacy(dto.readReceipts);
      currentSettings.readReceipts = dto.readReceipts;
    }

    if (dto.groupsAdd !== undefined) {
      await socket.updateGroupsAddPrivacy(dto.groupsAdd);
      currentSettings.groupsAdd = dto.groupsAdd;
    }

    this.settingsCache.set(sessionId, currentSettings);

    return currentSettings;
  }

  getSettings(sessionId: string): SettingsResponseDto {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    return this.settingsCache.get(sessionId) || {};
  }

  clearSettingsCache(sessionId: string) {
    this.settingsCache.delete(sessionId);
  }
}
