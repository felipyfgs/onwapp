import { Injectable, BadRequestException } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';
import {
  CheckNumberResponseDto,
  ProfilePictureResponseDto,
  ContactStatusResponseDto,
  BusinessProfileResponseDto,
} from './dto';

@Injectable()
export class ContactsService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async block(sessionName: string, jid: string): Promise<void> {
    try {
      await this.whaileysService.blockContact(sessionName, jid);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to block contact',
      );
    }
  }

  async unblock(sessionName: string, jid: string): Promise<void> {
    try {
      await this.whaileysService.unblockContact(sessionName, jid);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to unblock contact',
      );
    }
  }

  async checkNumber(
    sessionName: string,
    phone: string,
  ): Promise<CheckNumberResponseDto> {
    try {
      const result = await this.whaileysService.checkNumberExists(
        sessionName,
        phone,
      );
      return {
        exists: !!result?.exists,
        jid: result?.jid,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to check number',
      );
    }
  }

  async getProfilePicture(
    sessionName: string,
    jid: string,
  ): Promise<ProfilePictureResponseDto> {
    try {
      const url = await this.whaileysService.getProfilePicture(
        sessionName,
        jid,
      );
      return { url };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to get profile picture',
      );
    }
  }

  async getStatus(
    sessionName: string,
    jid: string,
  ): Promise<ContactStatusResponseDto> {
    try {
      const result = await this.whaileysService.getContactStatus(
        sessionName,
        jid,
      );
      const firstResult = Array.isArray(result) ? result[0] : result;
      return {
        status: firstResult?.status as string | undefined,
        setAt: firstResult?.setAt as number | Date | undefined,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to get contact status',
      );
    }
  }

  async getBusinessProfile(
    sessionName: string,
    jid: string,
  ): Promise<BusinessProfileResponseDto> {
    try {
      const profile = await this.whaileysService.getBusinessProfile(
        sessionName,
        jid,
      );
      return {
        name: profile?.wid,
        description: profile?.description,
        category: profile?.category,
        website: Array.isArray(profile?.website)
          ? profile.website[0]
          : profile?.website,
        email: profile?.email,
        address: profile?.address,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to get business profile',
      );
    }
  }

  async getBroadcastListInfo(sessionName: string, broadcastId: string) {
    try {
      return await this.whaileysService.getBroadcastListInfo(
        sessionName,
        broadcastId,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to get broadcast list info',
      );
    }
  }

  async getBlocklist(sessionName: string): Promise<string[]> {
    try {
      return await this.whaileysService.fetchBlocklist(sessionName);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to get blocklist',
      );
    }
  }

  async addContact(
    sessionName: string,
    jid: string,
    contact: { fullName?: string; firstName?: string },
  ): Promise<void> {
    try {
      await this.whaileysService.addOrEditContact(sessionName, jid, contact);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to add contact',
      );
    }
  }

  async removeContact(sessionName: string, jid: string): Promise<void> {
    try {
      await this.whaileysService.removeContact(sessionName, jid);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to remove contact',
      );
    }
  }
}
