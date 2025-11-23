import {
  Injectable,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsResponseDto } from './dto/settings-response.dto';
import { validateSocket } from '../common/utils/socket-validator';

interface SettingsCacheData {
  settings: SettingsResponseDto;
  lastUpdate: Date;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private settingsCache: Map<string, SettingsCacheData> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(
    @Inject(forwardRef(() => WhatsAppService))
    private readonly whatsappService: WhatsAppService,
  ) {}

  onModuleInit() {
    this.startCacheCleanup();
  }

  private startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, data] of this.settingsCache.entries()) {
        if (now - data.lastUpdate.getTime() > this.CACHE_TTL) {
          this.settingsCache.delete(sessionId);
        }
      }
    }, 60000);
  }

  async updateSettings(
    sessionId: string,
    dto: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const cachedData = this.settingsCache.get(sessionId);
    let currentSettings = cachedData?.settings || {};

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

    this.settingsCache.set(sessionId, {
      settings: currentSettings,
      lastUpdate: new Date(),
    });

    return currentSettings;
  }

  getSettings(sessionId: string): SettingsResponseDto {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const cachedData = this.settingsCache.get(sessionId);
    return cachedData?.settings || {};
  }
}
