import { Injectable, BadRequestException } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { ArchiveChatDto } from './dto/archive-chat.dto';
import { MuteChatDto } from './dto/mute-chat.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { ClearMessagesDto } from './dto/clear-messages.dto';
import { ReadMessagesDto } from './dto/read-messages.dto';
import { validateSocket } from '../../common/utils/socket-validator';

@Injectable()
export class ChatsService {
  constructor(private readonly whatsappService: WhatsAppService) {}

  async archiveChat(
    sessionId: string,
    jid: string,
    dto: ArchiveChatDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.chatModify(
      {
        archive: true,
        lastMessages: dto.lastMessages || [],
      },
      jid,
    );
  }

  async unarchiveChat(
    sessionId: string,
    jid: string,
    dto: ArchiveChatDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.chatModify(
      {
        archive: false,
        lastMessages: dto.lastMessages || [],
      },
      jid,
    );
  }

  async muteChat(
    sessionId: string,
    jid: string,
    dto: MuteChatDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.chatModify(
      {
        mute: dto.duration,
      },
      jid,
    );
  }

  async unmuteChat(sessionId: string, jid: string): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.chatModify(
      {
        mute: null,
      },
      jid,
    );
  }

  async pinChat(sessionId: string, jid: string): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.chatModify(
      {
        pin: true,
      },
      jid,
    );
  }

  async unpinChat(sessionId: string, jid: string): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.chatModify(
      {
        pin: false,
      },
      jid,
    );
  }

  async markChatRead(
    sessionId: string,
    jid: string,
    dto: MarkReadDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.chatModify(
      {
        markRead: true,
        lastMessages: dto.lastMessages || [],
      },
      jid,
    );
  }

  async markChatUnread(
    sessionId: string,
    jid: string,
    dto: MarkReadDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.chatModify(
      {
        markRead: false,
        lastMessages: dto.lastMessages || [],
      },
      jid,
    );
  }

  async deleteChat(
    sessionId: string,
    jid: string,
    dto: ArchiveChatDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.chatModify(
      {
        delete: true,
        lastMessages: dto.lastMessages || [],
      },
      jid,
    );
  }

  async clearMessages(
    sessionId: string,
    jid: string,
    dto: ClearMessagesDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    if (!dto.messages || dto.messages.length === 0) {
      await socket.chatModify(
        {
          clear: 'all',
        },
        jid,
      );
    } else {
      await socket.chatModify(
        {
          clear: {
            messages: dto.messages,
          },
        },
        jid,
      );
    }
  }

  async readMessages(sessionId: string, dto: ReadMessagesDto): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.readMessages(dto.keys);
  }

  async listChats(sessionId: string): Promise<any[]> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      const chats = await socket.groupFetchAllParticipating();
      const chatList = Object.values(chats).map((chat: any) => ({
        id: chat.id,
        name: chat.subject || chat.name,
        unreadCount: chat.unreadCount || 0,
        conversationTimestamp: chat.conversationTimestamp || 0,
      }));
      return chatList;
    } catch (error) {
      throw new BadRequestException(
        `Erro ao listar chats: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async starMessage(
    sessionId: string,
    jid: string,
    messageId: string,
    star: boolean,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    await socket.star(jid, [messageId], star);
  }
}
