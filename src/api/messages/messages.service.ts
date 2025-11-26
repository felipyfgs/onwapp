import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { AnyMessageContent, proto, WASocket } from 'whaileys';
import { MessageResponseDto } from './dto/message-response.dto';
import { QuotedMessageDto } from './dto/send-message-base.dto';
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
import { SendButtonsMessageDto } from './dto/send-buttons-message.dto';
import { SendTemplateMessageDto } from './dto/send-template-message.dto';
import { SendListMessageDto } from './dto/send-list-message.dto';
import { SendPollMessageDto } from './dto/send-poll-message.dto';
import { SendInteractiveMessageDto } from './dto/send-interactive-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { SendLiveLocationMessageDto } from './dto/send-live-location-message.dto';
import { AudioService } from '../../core/audio/audio.service';
import { parseMediaBuffer, formatJid } from '../../common/utils';
import { ChatwootService } from '../../integrations/chatwoot/chatwoot.service';
import { PersistenceService } from '../../core/persistence/persistence.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private prisma: DatabaseService,
    private whatsapp: WhatsAppService,
    private audioService: AudioService,
    private chatwootService: ChatwootService,
    private persistenceService: PersistenceService,
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

  /**
   * Transform QuotedMessageDto to Baileys expected format
   * Following Evolution API pattern: { key: proto.IMessageKey, message: proto.IMessage }
   * Baileys expects: { key: { remoteJid, fromMe, id, participant? }, message?: {} }
   */
  private formatQuotedMessage(
    quoted: QuotedMessageDto | undefined,
  ): proto.IWebMessageInfo | undefined {
    if (!quoted?.key) return undefined;

    const result: proto.IWebMessageInfo = {
      key: {
        remoteJid: quoted.key.remoteJid,
        fromMe: quoted.key.fromMe,
        id: quoted.key.id,
        participant: quoted.key.participant,
      },
    };

    // Only include message if it has actual content
    // An empty object {} can cause issues with Baileys
    if (
      quoted.message &&
      typeof quoted.message === 'object' &&
      Object.keys(quoted.message).length > 0
    ) {
      result.message = quoted.message as proto.IMessage;
    }

    return result;
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
      participant: message.key.participant
        ? message.key.participant
        : undefined,
    };
  }

  async sendTextMessage(
    sessionId: string,
    dto: SendTextMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = formatJid(dto.to);

    const content: AnyMessageContent = {
      text: dto.text,
      mentions: dto.mentions,
    };

    const formattedQuoted = this.formatQuotedMessage(dto.quoted);

    const options = {
      quoted: formattedQuoted,
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
    const jid = formatJid(dto.to);

    const content: AnyMessageContent = {
      image: parseMediaBuffer(dto.image),
      caption: dto.caption,
      jpegThumbnail: dto.jpegThumbnail,
      mentions: dto.mentions,
      viewOnce: dto.viewOnce,
      mimetype: dto.mimetype,
    };

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
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
    const jid = formatJid(dto.to);

    const content: AnyMessageContent = {
      video: parseMediaBuffer(dto.video),
      caption: dto.caption,
      gifPlayback: dto.gifPlayback,
      jpegThumbnail: dto.jpegThumbnail,
      mentions: dto.mentions,
      viewOnce: dto.viewOnce,
      mimetype: dto.mimetype,
    };

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
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
    const jid = formatJid(dto.to);

    // Default to encoding=true for PTT (voice notes)
    const shouldEncode = dto.encoding !== false;

    let audioData: Buffer | { url: string };
    let mimetype = dto.mimetype;
    let ptt = dto.ptt;

    if (shouldEncode) {
      // Convert audio to OGG/OPUS for WhatsApp PTT
      const audioBuffer = await this.audioService.processAudio(dto.audio);
      audioData = audioBuffer;
      mimetype = 'audio/ogg; codecs=opus';
      ptt = true;
    } else {
      // Send as-is without conversion
      audioData = parseMediaBuffer(dto.audio);
    }

    const content: AnyMessageContent = {
      audio: audioData,
      ptt,
      seconds: dto.seconds,
      mimetype,
    };

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
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
    const jid = formatJid(dto.to);

    const content: AnyMessageContent = {
      document: parseMediaBuffer(dto.document),
      mimetype: dto.mimetype,
      fileName: dto.fileName,
    };

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
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
    const jid = formatJid(dto.to);

    const content: AnyMessageContent = {
      sticker: parseMediaBuffer(dto.sticker),
      isAnimated: dto.isAnimated,
    };

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
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
    const jid = formatJid(dto.to);

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
      quoted: this.formatQuotedMessage(dto.quoted),
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
    const jid = formatJid(dto.to);

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
      quoted: this.formatQuotedMessage(dto.quoted),
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
    const jid = formatJid(dto.to);

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
    const socket = await this.validateSessionConnected(sessionId);
    const jid = formatJid(dto.to);

    const content: AnyMessageContent = {
      forward: dto.message,
      force: dto.force,
    };

    const message = await socket.sendMessage(jid, content);

    if (!message) {
      throw new BadRequestException('Failed to forward message');
    }

    return this.mapToMessageResponseDto(message);
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

  async sendButtonsMessage(
    sessionId: string,
    dto: SendButtonsMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = formatJid(dto.to);

    if (dto.buttons.length > 3) {
      throw new BadRequestException('Maximum 3 buttons allowed');
    }

    if (dto.headerType === 4 && !dto.image) {
      throw new BadRequestException('Image is required when headerType is 4');
    }

    const content: any = {
      text: dto.text,
      footer: dto.footer,
      buttons: dto.buttons,
      headerType: dto.headerType || 1,
    };

    if (dto.image) {
      content.image = parseMediaBuffer(dto.image);
    }

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send buttons message');
    }

    // Save message to database and forward to Chatwoot
    const messageId = message.key?.id;
    if (messageId) {
      // First persist the message locally
      await this.persistenceService.createMessage(sessionId, {
        remoteJid: jid,
        messageId,
        fromMe: true,
        timestamp: BigInt(Date.now()),
        messageType: 'buttonsMessage',
        textContent: dto.text,
        metadata: { buttonsMessage: content },
      });

      // Then forward to Chatwoot
      this.forwardButtonsToChatwoot(sessionId, jid, dto, messageId).catch(
        (err) =>
          this.logger.error('Falha ao encaminhar botões para Chatwoot', {
            event: 'chatwoot.forward.failure',
            sessionId,
            messageId,
            error: err.message,
          }),
      );
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendTemplateMessage(
    sessionId: string,
    dto: SendTemplateMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = formatJid(dto.to);

    const content: any = {
      text: dto.text,
      footer: dto.footer,
      templateButtons: dto.templateButtons,
    };

    if (dto.image) {
      content.image = parseMediaBuffer(dto.image);
    }

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send template message');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendListMessage(
    sessionId: string,
    dto: SendListMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = formatJid(dto.to);

    if (!dto.buttonText) {
      throw new BadRequestException('buttonText is required');
    }

    if (!dto.sections || dto.sections.length === 0) {
      throw new BadRequestException('At least one section is required');
    }

    if (dto.sections.length > 10) {
      throw new BadRequestException('Maximum 10 sections allowed');
    }

    const content: AnyMessageContent = {
      text: dto.text,
      footer: dto.footer,
      title: dto.title,
      buttonText: dto.buttonText,
      sections: dto.sections,
    };

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send list message');
    }

    // Save message to database and forward to Chatwoot
    const messageId = message.key?.id;
    if (messageId) {
      // First persist the message locally
      await this.persistenceService.createMessage(sessionId, {
        remoteJid: jid,
        messageId,
        fromMe: true,
        timestamp: BigInt(Date.now()),
        messageType: 'listMessage',
        textContent: dto.text,
        metadata: { listMessage: content },
      });

      // Then forward to Chatwoot
      this.forwardListToChatwoot(sessionId, jid, dto, messageId).catch((err) =>
        this.logger.error('Falha ao encaminhar lista para Chatwoot', {
          event: 'chatwoot.forward.failure',
          sessionId,
          messageId,
          error: err.message,
        }),
      );
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendPollMessage(
    sessionId: string,
    dto: SendPollMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = formatJid(dto.to);

    if (!dto.options || dto.options.length < 2) {
      throw new BadRequestException('At least 2 options are required');
    }

    if (dto.options.length > 12) {
      throw new BadRequestException('Maximum 12 options allowed');
    }

    const selectableCount = dto.selectableCount ?? 1;
    if (selectableCount < 0 || selectableCount > dto.options.length) {
      throw new BadRequestException(
        'selectableCount must be between 0 and number of options',
      );
    }

    const content: any = {
      poll: {
        name: dto.name,
        values: dto.options,
        selectableCount,
      },
    };

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send poll message');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendInteractiveMessage(
    sessionId: string,
    dto: SendInteractiveMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = formatJid(dto.to);

    const content: AnyMessageContent = {
      interactiveMessage: dto.interactiveMessage,
      viewOnce: dto.viewOnce,
    };

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send interactive message');
    }

    return this.mapToMessageResponseDto(message);
  }

  async editMessage(
    sessionId: string,
    dto: EditMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = formatJid(dto.to);

    if (!dto.messageKey.fromMe) {
      throw new BadRequestException(
        'Can only edit messages sent by you (fromMe must be true)',
      );
    }

    const content: AnyMessageContent = {
      text: dto.text,
      edit: dto.messageKey,
    };

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to edit message');
    }

    return this.mapToMessageResponseDto(message);
  }

  async sendLiveLocationMessage(
    sessionId: string,
    dto: SendLiveLocationMessageDto,
  ): Promise<MessageResponseDto> {
    const socket = await this.validateSessionConnected(sessionId);
    const jid = formatJid(dto.to);

    const content: any = {
      liveLocation: {
        degreesLatitude: dto.latitude,
        degreesLongitude: dto.longitude,
        accuracyInMeters: dto.accuracy,
        speedInMps: dto.speed,
        degreesClockwiseFromMagneticNorth: dto.degreesClockwise,
        caption: dto.caption,
        sequenceNumber: dto.sequenceNumber,
        timeOffset: dto.timeOffset,
        jpegThumbnail: dto.jpegThumbnail,
      },
    };

    const options = {
      quoted: this.formatQuotedMessage(dto.quoted),
      ephemeralExpiration: dto.ephemeralExpiration,
      statusJidList: dto.statusJidList,
    };

    const message = await socket.sendMessage(jid, content, options);

    if (!message) {
      throw new BadRequestException('Failed to send live location message');
    }

    return this.mapToMessageResponseDto(message);
  }

  /**
   * Helper: Prepares Chatwoot context for forwarding messages
   * Returns null if Chatwoot is not enabled or setup fails
   */
  private async prepareChatwootContext(
    sessionId: string,
    jid: string,
  ): Promise<{ conversationId: number } | null> {
    const config = await this.chatwootService.getConfig(sessionId);
    if (!config?.enabled) return null;

    const inbox = await this.chatwootService.getInbox(sessionId);
    if (!inbox) return null;

    let contact = await this.chatwootService.findContact(sessionId, jid);
    if (!contact) {
      const phoneNumber = jid.replace('@s.whatsapp.net', '').split(':')[0];
      contact = await this.chatwootService.createContact(sessionId, {
        phoneNumber,
        inboxId: inbox.id,
        isGroup: jid.includes('@g.us'),
        name: phoneNumber,
        identifier: jid,
      });
      if (!contact) return null;
    }

    const conversationId = await this.chatwootService.createConversation(
      sessionId,
      { contactId: contact.id, inboxId: inbox.id },
    );
    if (!conversationId) return null;

    return { conversationId };
  }

  /**
   * Helper: Sends message to Chatwoot and updates local tracking
   */
  private async sendToChatwootAndTrack(
    sessionId: string,
    conversationId: number,
    content: string,
    sourceId: string,
    messageType: 'list' | 'buttons',
  ): Promise<void> {
    const cwMessage = await this.chatwootService.createMessage(
      sessionId,
      conversationId,
      {
        content,
        messageType: 'outgoing',
        private: false,
        sourceId,
      },
    );

    if (cwMessage?.id) {
      await this.persistenceService.updateMessageChatwoot(sessionId, sourceId, {
        cwMessageId: cwMessage.id,
        cwConversationId: conversationId,
      });
    }

    this.logger.log('Mensagem encaminhada para Chatwoot', {
      event: 'chatwoot.forward.success',
      sessionId,
      messageType,
      sourceId,
      cwMessageId: cwMessage?.id,
    });
  }

  /**
   * Format list message content for Chatwoot display
   */
  private formatListContent(dto: SendListMessageDto): string {
    const lines: string[] = ['📋 *Lista*'];
    if (dto.text) lines.push(dto.text);
    if (dto.sections) {
      for (const section of dto.sections) {
        if (section.rows) {
          for (const row of section.rows) {
            lines.push(`• ${row.title} (${row.rowId})`);
          }
        }
      }
    }
    return lines.join('\n').trim();
  }

  /**
   * Format buttons message content for Chatwoot display
   */
  private formatButtonsContent(dto: SendButtonsMessageDto): string {
    const lines: string[] = ['🔘 *Botões*'];
    if (dto.text) lines.push(dto.text);
    if (dto.buttons) {
      for (const button of dto.buttons) {
        const text = button.buttonText?.displayText || 'Botão';
        lines.push(`• ${text} (${button.buttonId})`);
      }
    }
    return lines.join('\n').trim();
  }

  /**
   * Forward list message to Chatwoot
   */
  private async forwardListToChatwoot(
    sessionId: string,
    jid: string,
    dto: SendListMessageDto,
    sourceId: string,
  ): Promise<void> {
    try {
      const context = await this.prepareChatwootContext(sessionId, jid);
      if (!context) return;

      const content = this.formatListContent(dto);
      await this.sendToChatwootAndTrack(
        sessionId,
        context.conversationId,
        content,
        sourceId,
        'list',
      );
    } catch (error) {
      this.logger.error('Falha ao encaminhar lista para Chatwoot', {
        event: 'chatwoot.forward.failure',
        sessionId,
        sourceId,
        error: String(error),
      });
    }
  }

  /**
   * Forward buttons message to Chatwoot
   */
  private async forwardButtonsToChatwoot(
    sessionId: string,
    jid: string,
    dto: SendButtonsMessageDto,
    sourceId: string,
  ): Promise<void> {
    try {
      const context = await this.prepareChatwootContext(sessionId, jid);
      if (!context) return;

      const content = this.formatButtonsContent(dto);
      await this.sendToChatwootAndTrack(
        sessionId,
        context.conversationId,
        content,
        sourceId,
        'buttons',
      );
    } catch (error) {
      this.logger.error('Falha ao encaminhar botões para Chatwoot', {
        event: 'chatwoot.forward.failure',
        sessionId,
        sourceId,
        error: String(error),
      });
    }
  }
}
