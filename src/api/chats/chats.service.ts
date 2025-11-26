import { Injectable, BadRequestException } from '@nestjs/common';
import { ArchiveChatDto } from './dto/archive-chat.dto';
import { MuteChatDto } from './dto/mute-chat.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { ClearMessagesDto } from './dto/clear-messages.dto';
import { ReadMessagesDto } from './dto/read-messages.dto';
import {
  ExtendedWASocket,
  hasMethod,
} from '../../common/utils/extended-socket.type';
import { SessionValidationService } from '../../common/services/session-validation.service';

@Injectable()
export class ChatsService {
  constructor(
    private readonly sessionValidation: SessionValidationService,
  ) {}

  async archiveChat(
    sessionId: string,
    jid: string,
    dto: ArchiveChatDto,
  ): Promise<void> {
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

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
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

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
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

    await socket.chatModify(
      {
        mute: dto.duration,
      },
      jid,
    );
  }

  async unmuteChat(sessionId: string, jid: string): Promise<void> {
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

    await socket.chatModify(
      {
        mute: null,
      },
      jid,
    );
  }

  async pinChat(sessionId: string, jid: string): Promise<void> {
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

    await socket.chatModify(
      {
        pin: true,
      },
      jid,
    );
  }

  async unpinChat(sessionId: string, jid: string): Promise<void> {
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

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
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

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
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

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
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

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
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

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
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

    await socket.readMessages(dto.keys);
  }

  async listChats(sessionId: string): Promise<any[]> {
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

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
    const socket = this.sessionValidation.getValidatedSocket(
      sessionId,
    ) as ExtendedWASocket;

    if (!hasMethod(socket, 'star')) {
      throw new BadRequestException(
        'star method not available in current whaileys version',
      );
    }

    await socket.star(jid, [messageId], star);
  }

  async fetchMessageHistory(
    sessionId: string,
    count: number,
    oldestMsgId: string,
    oldestMsgFromMe: boolean,
    oldestMsgJid: string,
    oldestMsgTimestamp: number,
  ) {
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

    try {
      const oldestMsgKey = {
        id: oldestMsgId,
        fromMe: oldestMsgFromMe,
        remoteJid: oldestMsgJid,
      };

      const result = await socket.fetchMessageHistory(
        count,
        oldestMsgKey,
        oldestMsgTimestamp,
      );

      return { requestId: result };
    } catch (error) {
      throw new BadRequestException(
        `Erro ao buscar histórico: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async sendReceipt(
    sessionId: string,
    jid: string,
    participant: string | undefined,
    messageIds: string[],
    type: 'read' | 'read-self' | 'played',
  ): Promise<void> {
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

    await socket.sendReceipt(jid, participant, messageIds, type);
  }

  async sendReceipts(
    sessionId: string,
    keys: Array<{
      id: string;
      remoteJid: string;
      fromMe?: boolean;
      participant?: string;
    }>,
    type: 'read' | 'read-self' | 'played',
  ): Promise<void> {
    const socket = this.sessionValidation.getValidatedSocket(sessionId);

    await socket.sendReceipts(keys as any, type);
  }

  async requestPlaceholderResend(
    sessionId: string,
    messageKeys: Array<{
      messageKey: { id: string; remoteJid: string; fromMe?: boolean };
    }>,
  ): Promise<void> {
    const socket = this.sessionValidation.getValidatedSocket(
      sessionId,
    ) as ExtendedWASocket;

    if (!hasMethod(socket, 'requestPlaceholderResend')) {
      throw new BadRequestException(
        'requestPlaceholderResend method not available in current whaileys version',
      );
    }

    await socket.requestPlaceholderResend(messageKeys as any);
  }
}
