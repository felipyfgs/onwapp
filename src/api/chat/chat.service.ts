import { Injectable, BadRequestException } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';

@Injectable()
export class ChatService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async archive(sessionName: string, jid: string, archive: boolean) {
    try {
      await this.whaileysService.archiveChat(sessionName, jid, archive);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to modify chat',
      );
    }
  }

  async mute(sessionName: string, jid: string, mute: number | null) {
    try {
      await this.whaileysService.muteChat(sessionName, jid, mute);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to modify chat',
      );
    }
  }

  async pin(sessionName: string, jid: string, pin: boolean) {
    try {
      await this.whaileysService.pinChat(sessionName, jid, pin);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to modify chat',
      );
    }
  }

  async markRead(sessionName: string, jid: string, read: boolean) {
    try {
      await this.whaileysService.markChatRead(sessionName, jid, read);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to modify chat',
      );
    }
  }

  async delete(sessionName: string, jid: string) {
    try {
      await this.whaileysService.deleteChat(sessionName, jid);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to delete chat',
      );
    }
  }

  async setDisappearingMessages(
    sessionName: string,
    jid: string,
    expiration: number | boolean,
  ) {
    try {
      await this.whaileysService.setDisappearingMessages(
        sessionName,
        jid,
        expiration,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to set disappearing messages',
      );
    }
  }

  async starMessage(
    sessionName: string,
    jid: string,
    messageId: string,
    star: boolean,
  ) {
    try {
      await this.whaileysService.starMessage(sessionName, jid, messageId, star);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to star message',
      );
    }
  }
}
