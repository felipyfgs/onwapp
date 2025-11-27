import { Injectable, BadRequestException } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';
import {
  PrivacyValue,
  PrivacyOnlineValue,
  PrivacyGroupAddValue,
  PrivacyReadReceiptsValue,
  PrivacyCallValue,
  PrivacyMessagesValue,
  PrivacySettingsResponseDto,
} from './dto';

@Injectable()
export class PrivacyService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async getPrivacySettings(
    sessionName: string,
  ): Promise<PrivacySettingsResponseDto> {
    try {
      return await this.whaileysService.fetchPrivacySettings(sessionName);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to fetch privacy settings',
      );
    }
  }

  async updateLastSeenPrivacy(
    sessionName: string,
    value: PrivacyValue,
  ): Promise<void> {
    try {
      await this.whaileysService.updateLastSeenPrivacy(sessionName, value);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to update last seen privacy',
      );
    }
  }

  async updateOnlinePrivacy(
    sessionName: string,
    value: PrivacyOnlineValue,
  ): Promise<void> {
    try {
      await this.whaileysService.updateOnlinePrivacy(sessionName, value);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to update online privacy',
      );
    }
  }

  async updateProfilePicturePrivacy(
    sessionName: string,
    value: PrivacyValue,
  ): Promise<void> {
    try {
      await this.whaileysService.updateProfilePicturePrivacy(
        sessionName,
        value,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to update profile picture privacy',
      );
    }
  }

  async updateStatusPrivacy(
    sessionName: string,
    value: PrivacyValue,
  ): Promise<void> {
    try {
      await this.whaileysService.updateStatusPrivacy(sessionName, value);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to update status privacy',
      );
    }
  }

  async updateReadReceiptsPrivacy(
    sessionName: string,
    value: PrivacyReadReceiptsValue,
  ): Promise<void> {
    try {
      await this.whaileysService.updateReadReceiptsPrivacy(sessionName, value);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to update read receipts privacy',
      );
    }
  }

  async updateGroupsAddPrivacy(
    sessionName: string,
    value: PrivacyGroupAddValue,
  ): Promise<void> {
    try {
      await this.whaileysService.updateGroupsAddPrivacy(sessionName, value);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to update groups add privacy',
      );
    }
  }

  async updateCallPrivacy(
    sessionName: string,
    value: PrivacyCallValue,
  ): Promise<void> {
    try {
      await this.whaileysService.updateCallPrivacy(sessionName, value);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to update call privacy',
      );
    }
  }

  async updateMessagesPrivacy(
    sessionName: string,
    value: PrivacyMessagesValue,
  ): Promise<void> {
    try {
      await this.whaileysService.updateMessagesPrivacy(sessionName, value);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to update messages privacy',
      );
    }
  }
}
