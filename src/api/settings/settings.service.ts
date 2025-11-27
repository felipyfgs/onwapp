import { Injectable } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';
import {
  UpdateSettingsDto,
  SettingsResponseDto,
  PrivacySettingsDto,
  ProfileSettingsDto,
  BehaviorSettingsDto,
} from './dto';

@Injectable()
export class SettingsService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async getSettings(sessionName: string): Promise<SettingsResponseDto> {
    const privacy = await this.getPrivacySettings(sessionName);
    const profile = await this.getProfileSettings(sessionName);
    const behavior = this.getBehaviorSettings(sessionName);

    return { privacy, profile, behavior };
  }

  async updateSettings(
    sessionName: string,
    settings: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    if (settings.privacy) {
      await this.updatePrivacySettings(sessionName, settings.privacy);
    }

    if (settings.profile) {
      await this.updateProfileSettings(sessionName, settings.profile);
    }

    if (settings.behavior) {
      await this.updateBehaviorSettings(sessionName, settings.behavior);
    }

    return this.getSettings(sessionName);
  }

  private async getPrivacySettings(
    sessionName: string,
  ): Promise<PrivacySettingsDto> {
    const settings = await this.whaileysService.fetchPrivacySettings(sessionName);
    return {
      last_seen: settings?.last as PrivacySettingsDto['last_seen'],
      online: settings?.online as PrivacySettingsDto['online'],
      profile_picture: settings?.profile as PrivacySettingsDto['profile_picture'],
      status: settings?.status as PrivacySettingsDto['status'],
      read_receipts: settings?.readreceipts as PrivacySettingsDto['read_receipts'],
      groups_add: settings?.groupadd as PrivacySettingsDto['groups_add'],
      calls: settings?.calladd as PrivacySettingsDto['calls'],
      messages: settings?.messages as PrivacySettingsDto['messages'],
    };
  }

  private async getProfileSettings(
    sessionName: string,
  ): Promise<ProfileSettingsDto> {
    const [picture, status] = await Promise.all([
      this.whaileysService.getMyProfilePicture(sessionName),
      this.whaileysService.getMyStatus(sessionName),
    ]);

    return {
      picture: picture ?? undefined,
      status: status?.status,
    };
  }

  private getBehaviorSettings(sessionName: string): BehaviorSettingsDto {
    return this.whaileysService.getBehaviorSettings(sessionName);
  }

  private async updatePrivacySettings(
    sessionName: string,
    privacy: PrivacySettingsDto,
  ): Promise<void> {
    const updates: Promise<void>[] = [];

    if (privacy.last_seen !== undefined) {
      updates.push(
        this.whaileysService.updateLastSeenPrivacy(sessionName, privacy.last_seen),
      );
    }
    if (privacy.online !== undefined) {
      updates.push(
        this.whaileysService.updateOnlinePrivacy(sessionName, privacy.online),
      );
    }
    if (privacy.profile_picture !== undefined) {
      updates.push(
        this.whaileysService.updateProfilePicturePrivacy(
          sessionName,
          privacy.profile_picture,
        ),
      );
    }
    if (privacy.status !== undefined) {
      updates.push(
        this.whaileysService.updateStatusPrivacy(sessionName, privacy.status),
      );
    }
    if (privacy.read_receipts !== undefined) {
      updates.push(
        this.whaileysService.updateReadReceiptsPrivacy(
          sessionName,
          privacy.read_receipts,
        ),
      );
    }
    if (privacy.groups_add !== undefined) {
      updates.push(
        this.whaileysService.updateGroupsAddPrivacy(sessionName, privacy.groups_add),
      );
    }
    if (privacy.calls !== undefined) {
      updates.push(
        this.whaileysService.updateCallPrivacy(sessionName, privacy.calls),
      );
    }
    if (privacy.messages !== undefined) {
      updates.push(
        this.whaileysService.updateMessagesPrivacy(sessionName, privacy.messages),
      );
    }

    await Promise.all(updates);
  }

  private async updateProfileSettings(
    sessionName: string,
    profile: ProfileSettingsDto,
  ): Promise<void> {
    const updates: Promise<void>[] = [];

    if (profile.name !== undefined) {
      updates.push(this.whaileysService.updateProfileName(sessionName, profile.name));
    }
    if (profile.status !== undefined) {
      updates.push(
        this.whaileysService.updateProfileStatus(sessionName, profile.status),
      );
    }
    if (profile.picture !== undefined) {
      updates.push(
        this.whaileysService.updateProfilePicture(sessionName, profile.picture),
      );
    }

    await Promise.all(updates);
  }

  private async updateBehaviorSettings(
    sessionName: string,
    behavior: BehaviorSettingsDto,
  ): Promise<void> {
    this.whaileysService.updateBehaviorSettings(sessionName, behavior);
  }
}
