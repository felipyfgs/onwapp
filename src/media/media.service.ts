import { Injectable, BadRequestException } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { downloadMediaMessage } from 'whaileys';
import { DownloadMediaDto } from './dto/download-media.dto';
import { DownloadMediaResponseDto } from './dto/download-media-response.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediaService {
  constructor(private readonly whatsappService: WhatsAppService) {}

  private createSilentLogger() {
    return {
      level: 'silent',
      fatal: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
      trace: () => {},
      silent: () => {},
      child: () => this.createSilentLogger(),
    };
  }

  async downloadMedia(
    sessionId: string,
    dto: DownloadMediaDto,
  ): Promise<DownloadMediaResponseDto> {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    try {
      const buffer = await downloadMediaMessage(
        dto.message,
        'buffer',
        {},
        {
          logger: this.createSilentLogger() as any,
          reuploadRequest: socket.updateMediaMessage.bind(socket),
        },
      );

      if (!buffer) {
        throw new BadRequestException('Falha ao fazer download da mídia');
      }

      const messageType =
        dto.messageType ||
        Object.keys(dto.message.message || {})[0] ||
        'unknown';

      let mimetype: string | undefined;
      let fileName: string | undefined;

      const mediaMessage = dto.message.message?.[messageType];
      if (mediaMessage) {
        mimetype = mediaMessage.mimetype;
        fileName = mediaMessage.fileName;
      }

      return {
        buffer: (buffer as Buffer).toString('base64'),
        mimetype,
        fileName,
      };
    } catch (error) {
      throw new BadRequestException(
        `Erro ao fazer download da mídia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async updateMedia(sessionId: string, dto: UpdateMediaDto): Promise<any> {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    try {
      const updatedMessage = await socket.updateMediaMessage(dto.message);
      return updatedMessage;
    } catch (error) {
      throw new BadRequestException(
        `Erro ao fazer re-upload da mídia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }
}
