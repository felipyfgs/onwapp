import { Injectable, BadRequestException } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async updateStatus(sessionName: string, status: string): Promise<void> {
    try {
      await this.whaileysService.updateProfileStatus(sessionName, status);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update status',
      );
    }
  }

  async updateName(sessionName: string, name: string): Promise<void> {
    try {
      await this.whaileysService.updateProfileName(sessionName, name);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update name',
      );
    }
  }

  async updatePicture(sessionName: string, imageUrl: string): Promise<void> {
    try {
      await this.whaileysService.updateProfilePicture(sessionName, imageUrl);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update picture',
      );
    }
  }

  async updatePresence(
    sessionName: string,
    presence:
      | 'available'
      | 'unavailable'
      | 'composing'
      | 'recording'
      | 'paused',
    jid?: string,
  ): Promise<void> {
    try {
      await this.whaileysService.sendPresenceUpdate(sessionName, presence, jid);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update presence',
      );
    }
  }

  async subscribePresence(sessionName: string, jid: string): Promise<void> {
    try {
      await this.whaileysService.presenceSubscribe(sessionName, jid);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to subscribe to presence',
      );
    }
  }

  async getProfilePicture(sessionName: string): Promise<string | null> {
    try {
      return await this.whaileysService.getMyProfilePicture(sessionName);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to get profile picture',
      );
    }
  }

  async removeProfilePicture(sessionName: string): Promise<void> {
    try {
      await this.whaileysService.removeProfilePicture(sessionName);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to remove profile picture',
      );
    }
  }

  async getMyStatus(
    sessionName: string,
  ): Promise<{ status?: string; setAt?: Date }> {
    try {
      return await this.whaileysService.getMyStatus(sessionName);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to get status',
      );
    }
  }
}
