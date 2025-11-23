import { Injectable, BadRequestException } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ArchiveChatDto } from './dto/archive-chat.dto';
import { MuteChatDto } from './dto/mute-chat.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { ClearMessagesDto } from './dto/clear-messages.dto';
import { ReadMessagesDto } from './dto/read-messages.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly whatsappService: WhatsAppService) {}

  async archiveChat(
    sessionId: string,
    jid: string,
    dto: ArchiveChatDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

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
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

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
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    await socket.chatModify(
      {
        mute: dto.duration,
      },
      jid,
    );
  }

  async unmuteChat(sessionId: string, jid: string): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    await socket.chatModify(
      {
        mute: null,
      },
      jid,
    );
  }

  async pinChat(sessionId: string, jid: string): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    await socket.chatModify(
      {
        pin: true,
      },
      jid,
    );
  }

  async unpinChat(sessionId: string, jid: string): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

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
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

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
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

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
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

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
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

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
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    await socket.readMessages(dto.keys);
  }
}
