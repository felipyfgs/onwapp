import { Injectable, BadRequestException } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';
import {
  CheckNumberResponseDto,
  ProfilePictureResponseDto,
  ContactStatusResponseDto,
  BusinessProfileResponseDto,
} from './dto';

@Injectable()
export class ContactService {
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
      return {
        status: result?.status,
        setAt: result?.setAt,
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
}
