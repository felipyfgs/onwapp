import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AnyMessageContent } from 'whaileys';
import { WhaileysService } from '../../core/whaileys/whaileys.service';
import { SessionStatus } from '@prisma/client';
import {
  SendTextDto,
  SendImageDto,
  SendVideoDto,
  SendAudioDto,
  SendDocumentDto,
  SendLocationDto,
  SendContactDto,
  SendStickerDto,
  SendReactionDto,
  SendButtonsDto,
  SendListDto,
  SendTemplateDto,
  SendPollDto,
  EditMessageDto,
  ForwardMessageDto,
  DeleteMessageDto,
  DeleteMessageForMeDto,
  ReadMessagesDto,
  UpdateMediaMessageDto,
  FetchMessageHistoryDto,
  SendReceiptDto,
  SendReceiptsDto,
  RequestPlaceholderResendDto,
  SendCarouselDto,
} from './dto';

/**
 * Service responsible for all message-related operations.
 * Handles sending, editing, deleting, and managing messages across WhatsApp sessions.
 */
@Injectable()
export class MessagesService {
  constructor(private readonly whaileysService: WhaileysService) {}

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Retrieves a connected session or throws an appropriate error
   */
  private getSessionOrThrow(sessionName: string) {
    const session = this.whaileysService.getSession(sessionName);
    if (!session) {
      throw new NotFoundException(`Session '${sessionName}' not found`);
    }
    if (session.status !== SessionStatus.connected) {
      throw new BadRequestException(
        `Session '${sessionName}' is not connected`,
      );
    }
    return session;
  }

  /**
   * Formats a phone number to WhatsApp JID format
   */
  private formatJid(to: string): string {
    return to.includes('@') ? to : `${to}@s.whatsapp.net`;
  }

  // ============================================================================
  // Text & Media Messages
  // ============================================================================

  async sendText(sessionName: string, dto: SendTextDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    const message: { text: string; mentions?: string[] } = { text: dto.text };
    if (dto.mentions?.length) {
      message.mentions = dto.mentions.map((m) => this.formatJid(m));
    }

    return session.socket.sendMessage(jid, message);
  }

  async sendImage(sessionName: string, dto: SendImageDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      image: { url: dto.image },
      caption: dto.caption,
    });
  }

  async sendVideo(sessionName: string, dto: SendVideoDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      video: { url: dto.video },
      caption: dto.caption,
      gifPlayback: dto.gifPlayback || false,
    });
  }

  async sendAudio(sessionName: string, dto: SendAudioDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      audio: { url: dto.audio },
      mimetype: dto.mimetype || 'audio/mp4',
      ptt: dto.ptt || false,
    });
  }

  async sendDocument(sessionName: string, dto: SendDocumentDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      document: { url: dto.document },
      mimetype: dto.mimetype,
      fileName: dto.fileName,
      caption: dto.caption,
    });
  }

  async sendLocation(sessionName: string, dto: SendLocationDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      location: {
        degreesLatitude: dto.latitude,
        degreesLongitude: dto.longitude,
        name: dto.name,
        address: dto.address,
      },
    });
  }

  async sendContact(sessionName: string, dto: SendContactDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${dto.fullName || dto.displayName}\n` +
      (dto.organization ? `ORG:${dto.organization};\n` : '') +
      `TEL;type=CELL;type=VOICE;waid=${dto.phone}:+${dto.phone}\n` +
      'END:VCARD';

    return session.socket.sendMessage(jid, {
      contacts: {
        displayName: dto.displayName,
        contacts: [{ vcard }],
      },
    });
  }

  async sendSticker(sessionName: string, dto: SendStickerDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      sticker: { url: dto.sticker },
    });
  }

  async sendReaction(sessionName: string, dto: SendReactionDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      react: {
        text: dto.emoji,
        key: dto.messageKey,
      },
    });
  }

  // ============================================================================
  // Interactive Messages (Buttons, Lists, Templates, Carousels)
  // ============================================================================

  async sendButtons(sessionName: string, dto: SendButtonsDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    const buttons = dto.buttons.map((btn) => ({
      buttonId: btn.buttonId,
      buttonText: { displayText: btn.displayText },
      type: 1 as const,
    }));

    if (dto.imageUrl) {
      return session.socket.sendMessage(jid, {
        image: { url: dto.imageUrl },
        caption: dto.text,
        footer: dto.footer,
        buttons,
        headerType: 4,
      } as AnyMessageContent);
    }

    return session.socket.sendMessage(jid, {
      text: dto.text,
      footer: dto.footer,
      buttons,
      headerType: 1,
    } as AnyMessageContent);
  }

  async sendList(sessionName: string, dto: SendListDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      text: dto.text,
      footer: dto.footer,
      title: dto.title,
      buttonText: dto.buttonText,
      sections: dto.sections,
    } as AnyMessageContent);
  }

  async sendTemplate(sessionName: string, dto: SendTemplateDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    // Build native flow buttons for @fadzzzslebew/baileys
    const nativeFlowButtons: Array<{
      name: string;
      buttonParamsJson: string;
    }> = [];

    for (const btn of dto.templateButtons) {
      if (btn.urlButton) {
        nativeFlowButtons.push({
          name: 'cta_url',
          buttonParamsJson: JSON.stringify({
            display_text: btn.urlButton.displayText,
            url: btn.urlButton.url,
          }),
        });
      }
      if (btn.callButton) {
        nativeFlowButtons.push({
          name: 'cta_call',
          buttonParamsJson: JSON.stringify({
            display_text: btn.callButton.displayText,
            phone_number: btn.callButton.phoneNumber,
          }),
        });
      }
      if (btn.quickReplyButton) {
        nativeFlowButtons.push({
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: btn.quickReplyButton.displayText,
            id: btn.quickReplyButton.id,
          }),
        });
      }
    }

    // Use the correct format for @fadzzzslebew/baileys interactive buttons
    // Based on documentation: text, footer, interactive array
    return this.whaileysService.sendInteractiveButtons(
      sessionName,
      dto.to,
      dto.text,
      dto.footer || '',
      nativeFlowButtons,
      dto.imageUrl,
    );
  }

  async sendCarousel(sessionName: string, dto: SendCarouselDto) {
    return this.whaileysService.sendCarouselMessage(
      sessionName,
      dto.to,
      dto.text,
      dto.title || '',
      dto.footer || '',
      dto.cards.map((card) => ({
        imageUrl: card.imageUrl,
        videoUrl: card.videoUrl,
        title: card.title,
        body: card.body,
        footer: card.footer,
        buttons: card.buttons,
      })),
    );
  }

  // ============================================================================
  // Message Management (Forward, Delete, Edit, Read)
  // ============================================================================

  async forwardMessage(sessionName: string, dto: ForwardMessageDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      forward: {
        key: dto.messageKey,
      },
    } as AnyMessageContent);
  }

  async deleteMessage(sessionName: string, dto: DeleteMessageDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      delete: dto.messageKey,
    });
  }

  async deleteMessageForMe(sessionName: string, dto: DeleteMessageForMeDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    await session.socket.chatModify(
      {
        clear: {
          messages: [
            {
              id: dto.messageId,
              fromMe: dto.fromMe,
              timestamp: dto.timestamp,
            },
          ],
        },
      } as unknown as Parameters<typeof session.socket.chatModify>[0],
      jid,
    );
  }

  async readMessages(sessionName: string, dto: ReadMessagesDto) {
    const session = this.getSessionOrThrow(sessionName);
    await session.socket.readMessages(dto.keys);
  }

  // ============================================================================
  // Polls & Special Messages
  // ============================================================================

  async sendPoll(sessionName: string, dto: SendPollDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    const pollContent = {
      pollCreationMessage: {
        name: dto.name,
        options: dto.options.map((opt) => ({ optionName: opt })),
        selectableOptionsCount: dto.selectableCount || 1,
      },
    };

    return session.socket.sendMessage(
      jid,
      pollContent as unknown as AnyMessageContent,
    );
  }

  async editMessage(sessionName: string, dto: EditMessageDto) {
    const session = this.getSessionOrThrow(sessionName);
    const jid = this.formatJid(dto.to);

    return session.socket.sendMessage(jid, {
      text: dto.newText,
      edit: dto.messageKey,
    });
  }

  async updateMediaMessage(sessionName: string, dto: UpdateMediaMessageDto) {
    const session = this.getSessionOrThrow(sessionName);
    return session.socket.updateMediaMessage({ key: dto.key });
  }

  async fetchMessageHistory(_sessionName: string, _dto: FetchMessageHistoryDto) {
    throw new Error('fetchMessageHistory not available in @fadzzzslebew/baileys');
  }

  // ============================================================================
  // Receipts & Acknowledgments
  // ============================================================================

  async sendReceipt(sessionName: string, dto: SendReceiptDto) {
    const session = this.getSessionOrThrow(sessionName);
    await session.socket.sendReceipt(
      dto.jid,
      dto.participant,
      dto.messageIds,
      dto.type,
    );
  }

  async sendReceipts(sessionName: string, dto: SendReceiptsDto) {
    const session = this.getSessionOrThrow(sessionName);
    await session.socket.sendReceipts(dto.keys, dto.type);
  }

  async requestPlaceholderResend(
    sessionName: string,
    dto: RequestPlaceholderResendDto,
  ) {
    return this.whaileysService.requestPlaceholderResend(
      sessionName,
      dto.messageKeys,
    );
  }
}
