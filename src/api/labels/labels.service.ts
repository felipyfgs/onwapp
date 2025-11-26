import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { validateSocket } from '../../common/utils/socket-validator';
import {
  ExtendedWASocket,
  hasMethod,
} from '../../common/utils/extended-socket.type';

@Injectable()
export class LabelsService {
  private readonly logger = new Logger(LabelsService.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  private getSocket(sessionId: string): ExtendedWASocket {
    const socket = this.whatsappService.getSocket(
      sessionId,
    ) as ExtendedWASocket;
    validateSocket(socket);
    return socket;
  }

  async createLabel(sessionId: string, name: string, color: number) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'addLabel')) {
      throw new BadRequestException(
        'Label methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(`[${sessionId}] Criando label: ${name}`);
      const result = await socket.addLabel(name, color);
      this.logger.log(`[${sessionId}] Label criada com sucesso`);
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao criar label: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao criar label: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async addChatLabel(sessionId: string, chatId: string, labelId: string) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'addChatLabel')) {
      throw new BadRequestException(
        'Label methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Adicionando label ${labelId} ao chat ${chatId}`,
      );
      await socket.addChatLabel(chatId, labelId);
      return { success: true, message: 'Label adicionada ao chat' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao adicionar label ao chat: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao adicionar label ao chat: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async removeChatLabel(sessionId: string, chatId: string, labelId: string) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'removeChatLabel')) {
      throw new BadRequestException(
        'Label methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Removendo label ${labelId} do chat ${chatId}`,
      );
      await socket.removeChatLabel(chatId, labelId);
      return { success: true, message: 'Label removida do chat' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao remover label do chat: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao remover label do chat: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async addMessageLabel(
    sessionId: string,
    chatId: string,
    messageId: string,
    labelId: string,
  ) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'addMessageLabel')) {
      throw new BadRequestException(
        'Label methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Adicionando label ${labelId} à mensagem ${messageId}`,
      );
      await socket.addMessageLabel(chatId, messageId, labelId);
      return { success: true, message: 'Label adicionada à mensagem' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao adicionar label à mensagem: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao adicionar label à mensagem: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async removeMessageLabel(
    sessionId: string,
    chatId: string,
    messageId: string,
    labelId: string,
  ) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'removeMessageLabel')) {
      throw new BadRequestException(
        'Label methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Removendo label ${labelId} da mensagem ${messageId}`,
      );
      await socket.removeMessageLabel(chatId, messageId, labelId);
      return { success: true, message: 'Label removida da mensagem' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao remover label da mensagem: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao remover label da mensagem: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }
}
