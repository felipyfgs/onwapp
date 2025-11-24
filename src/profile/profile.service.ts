import { Injectable, BadRequestException } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { UpdateProfileStatusDto } from './dto/update-profile-status.dto';
import { UpdateProfileNameDto } from './dto/update-profile-name.dto';
import { UpdateProfilePictureDto } from './dto/update-profile-picture.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { GetProfilePictureQueryDto } from './dto/get-profile-picture.query';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { validateSocket } from '../common/utils/socket-validator';
import { parseMediaBuffer } from '../common/utils/media-parser';

@Injectable()
export class ProfileService {
  constructor(private readonly whatsappService: WhatsAppService) {}

  async fetchProfile(sessionId: string): Promise<ProfileResponseDto> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const jid = socket.user?.id;
    if (!jid) {
      throw new BadRequestException('Usuário não autenticado');
    }

    const profile: ProfileResponseDto = {
      jid,
      name: socket.user?.name,
    };

    try {
      const statusResult = await socket.fetchStatus(jid);
      if (statusResult) {
        profile.status = statusResult.status;
      }
    } catch (error) {}

    try {
      const pictureUrl = await socket.profilePictureUrl(jid, 'image');
      if (pictureUrl) {
        profile.profilePictureUrl = pictureUrl;
      }
    } catch (error) {}

    return profile;
  }

  async fetchStatus(
    sessionId: string,
    jid: string,
  ): Promise<{ status?: string; setAt?: Date }> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const result = await socket.fetchStatus(jid);

    if (!result) {
      return {};
    }

    return {
      status: result.status,
      setAt: result.setAt,
    };
  }

  async updateProfileStatus(
    sessionId: string,
    dto: UpdateProfileStatusDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.updateProfileStatus(dto.status);
  }

  async updateProfileName(
    sessionId: string,
    dto: UpdateProfileNameDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.updateProfileName(dto.name);
  }

  async getProfilePicture(
    sessionId: string,
    jid: string,
    query: GetProfilePictureQueryDto,
  ): Promise<{ url?: string }> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const type = query.type || 'preview';
    const timeout = query.timeout || 10000;

    const url = await socket.profilePictureUrl(jid, type, timeout);

    return { url };
  }

  async updateProfilePicture(
    sessionId: string,
    dto: UpdateProfilePictureDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const media = parseMediaBuffer(dto.image);
    const mediaBuffer = Buffer.isBuffer(media) ? media : Buffer.from(media.url);

    const jid = socket.user?.id;
    if (!jid) {
      throw new BadRequestException('Usuário não autenticado');
    }

    await socket.updateProfilePicture(jid, mediaBuffer);
  }

  async removeProfilePicture(sessionId: string): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const jid = socket.user?.id;
    if (!jid) {
      throw new BadRequestException('Usuário não autenticado');
    }

    try {
      await socket.updateProfilePicture(jid, null as any);
    } catch (error) {
      throw new BadRequestException(
        `Erro ao remover foto de perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async blockUser(sessionId: string, dto: BlockUserDto): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.updateBlockStatus(dto.jid, 'block');
  }

  async unblockUser(sessionId: string, dto: BlockUserDto): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.updateBlockStatus(dto.jid, 'unblock');
  }

  async getBlocklist(sessionId: string): Promise<{ blocklist: string[] }> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    const blocklist = await socket.fetchBlocklist();

    return { blocklist };
  }
}
