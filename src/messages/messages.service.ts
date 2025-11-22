import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { AnyMessageContent, proto, WASocket } from 'whaileys';
import { MessageResponseDto } from './dto/message-response.dto';
import { SendTextMessageDto } from './dto/send-text-message.dto';
import { SendImageMessageDto } from './dto/send-image-message.dto';
import { SendVideoMessageDto } from './dto/send-video-message.dto';
import { SendAudioMessageDto } from './dto/send-audio-message.dto';
import { SendDocumentMessageDto } from './dto/send-document-message.dto';
import { SendStickerMessageDto } from './dto/send-sticker-message.dto';
import { SendContactMessageDto } from './dto/send-contact-message.dto';
import { SendLocationMessageDto } from './dto/send-location-message.dto';
import { SendReactionMessageDto } from './dto/send-reaction-message.dto';
import { SendForwardMessageDto } from './dto/send-forward-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { SetDisappearingMessagesDto } from './dto/set-disappearing-messages.dto';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
  ) {}

  private async validateSessionConnected(sessionId: string): Promise<WASocket> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const socket = this.whatsapp.getSocket(sessionId);

    if (!socket) {
      throw new BadRequestException(
        `Session ${sessionId} is not connected. Please connect first.`,
      );
    }

    return socket;
  }

  private formatJid(phoneNumber: string): string {
    if (phoneNumber.includes('@')) {
      return phoneNumber;
    }

    const cleaned = phoneNumber.replace(/\D/g, '');
    return `${cleaned}@s.whatsapp.net`;
  }

  private parseMediaUpload(media: string): { url: string } | Buffer {
    if (media.startsWith('http://') || media.startsWith('https://')) {
      return { url: media };
    }

    if (media.startsWith('data:')) {
      const base64Data = media.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    }

    return Buffer.from(media, 'base64');
  }

  private mapToMessageResponseDto(
    message: proto.WebMessageInfo,
  ): MessageResponseDto {
    return {
      id: message.key.id!,
      remoteJid: message.key.remoteJid!,
      fromMe: message.key.fromMe ?? false,
      timestamp: new Date(Number(message.messageTimestamp) * 1000),
      status: proto.WebMessageInfo.Status[message.status ?? 0],
      participant: message.key.participant ? message.key.participant : undefined,
    };
  }

  async sendTextMessage(
    sessionId: string,
    dto: SendTextMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = this.formatJid(dto.to);

    const content: AnyMessageContent = {
      text: dto.text,
      mentions: dto.mentions,
    };

    const options = {
      quoted: dto.quoted as any,
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send message');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendImageMessage(
    sessionId: string,
    dto: SendImageMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = this.formatJid(dto.to);

    const content: AnyMessageContent = {
      image: this.parseMediaUpload(dto.image),
      caption: dto.caption,
      jpegThumbnail: dto.jpegThumbnail,
      mentions: dto.mentions,
      viewOnce: dto.viewOnce,
      mimetype: dto.mimetype,
    };

    const options = {
      quoted: dto.quoted as any,
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send image');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendVideoMessage(
    sessionId: string,
    dto: SendVideoMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = this.formatJid(dto.to);

    const content: AnyMessageContent = {
      video: this.parseMediaUpload(dto.video),
      caption: dto.caption,
      gifPlayback: dto.gifPlayback,
      jpegThumbnail: dto.jpegThumbnail,
      mentions: dto.mentions,
      viewOnce: dto.viewOnce,
      mimetype: dto.mimetype,
    };

    const options = {
      quoted: dto.quoted as any,
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send video');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendAudioMessage(
    sessionId: string,
    dto: SendAudioMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = this.formatJid(dto.to);

    const content: AnyMessageContent = {
      audio: this.parseMediaUpload(dto.audio),
      ptt: dto.ptt,
      seconds: dto.seconds,
      mimetype: dto.mimetype,
    };

    const options = {
      quoted: dto.quoted as any,
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send audio');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendDocumentMessage(
    sessionId: string,
    dto: SendDocumentMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = this.formatJid(dto.to);

    const content: AnyMessageContent = {
      document: this.parseMediaUpload(dto.document),
      mimetype: dto.mimetype,
      fileName: dto.fileName,
    };

    const options = {
      quoted: dto.quoted as any,
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send document');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendStickerMessage(
    sessionId: string,
    dto: SendStickerMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = this.formatJid(dto.to);

    const content: AnyMessageContent = {
      sticker: this.parseMediaUpload(dto.sticker),
      isAnimated: dto.isAnimated,
    };

    const options = {
      quoted: dto.quoted as any,
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send sticker');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendContactMessage(
    sessionId: string,
    dto: SendContactMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = this.formatJid(dto.to);

    const content: AnyMessageContent = {
      contacts: {
        displayName: dto.displayName,
        contacts: dto.contacts.map((c) => ({
          displayName: c.displayName,
          vcard: c.vcard,
        })),
      },
      viewOnce: dto.viewOnce,
    };

    const options = {
      quoted: dto.quoted as any,
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send contact');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendLocationMessage(
    sessionId: string,
    dto: SendLocationMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = this.formatJid(dto.to);

    const content: AnyMessageContent = {
      location: {
        degreesLatitude: dto.latitude,
        degreesLongitude: dto.longitude,
        name: dto.name,
        address: dto.address,
        url: dto.url,
      },
      viewOnce: dto.viewOnce,
    };

    const options = {
      quoted: dto.quoted as any,
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send location');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendReaction(
    sessionId: string,
    dto: SendReactionMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = this.formatJid(dto.to);

    const content: AnyMessageContent = {
      react: {
        text: dto.emoji,
        key: {
          remoteJid: jid,
          fromMe: false,
          id: dto.messageId,
          participant: dto.participant,
        },
      },
    };

    const message = await socket.sendMessage(jid, content);

    if (!message) {
      throw new BadRequestException('Failed to send reaction');
    }

    return this.mapToMessageResponseDto(message);
  }

  async forwardMessage(
    sessionId: string,
    dto: SendForwardMessageDto,
  ): Promise<MessageResponseDto> {
    await this.validateSessionConnected(sessionId);

    throw new BadRequestException(
      'Forward message requires message store implementation. This feature will be available in a future update.',
    );
  }

  async deleteMessage(sessionId: string, dto: DeleteMessageDto): Promise<void> {
    const socket = await this.validateSessionConnected(sessionId);

    const content: AnyMessageContent = {
      delete: {
        remoteJid: dto.remoteJid,
        fromMe: dto.fromMe,
        id: dto.messageId,
        participant: dto.participant,
      },
    };

    await socket.sendMessage(dto.remoteJid, content);
  }

  async setDisappearingMessages(
    sessionId: string,
    dto: SetDisappearingMessagesDto,
  ): Promise<void> {
    const socket = await this.validateSessionConnected(sessionId);

    const content: AnyMessageContent = {
      disappearingMessagesInChat: dto.expiration,
    };

    await socket.sendMessage(dto.jid, content);
  }
}
