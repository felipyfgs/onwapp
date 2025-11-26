import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { validateSocket } from '../../common/utils/socket-validator';

@Injectable()
export class LabelsService {
  private readonly logger = new Logger(LabelsService.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  async addLabel(sessionId: string, name: string, color: number) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Criando label: ${name}`);

      const result = await socket.addLabel(name, color);

      this.logger.log(`[${sessionId}] Label criado`);
      return result;
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao criar label: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao criar label: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async addChatLabel(sessionId: string, labelId: string, chatId: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Adicionando label ${labelId} ao chat ${chatId}`);

      await socket.addChatLabel(chatId, labelId);

      return { success: true, message: 'Label adicionado ao chat' };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao adicionar label ao chat: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao adicionar label ao chat: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async removeChatLabel(sessionId: string, labelId: string, chatId: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Removendo label ${labelId} do chat ${chatId}`);

      await socket.removeChatLabel(chatId, labelId);

      return { success: true, message: 'Label removido do chat' };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao remover label do chat: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao remover label do chat: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async addMessageLabel(sessionId: string, labelId: string, chatId: string, messageId: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Adicionando label ${labelId} à mensagem ${messageId}`);

      await socket.addMessageLabel(chatId, messageId, labelId);

      return { success: true, message: 'Label adicionado à mensagem' };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao adicionar label à mensagem: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao adicionar label à mensagem: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async removeMessageLabel(sessionId: string, labelId: string, chatId: string, messageId: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Removendo label ${labelId} da mensagem ${messageId}`);

      await socket.removeMessageLabel(chatId, messageId, labelId);

      return { success: true, message: 'Label removido da mensagem' };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao remover label da mensagem: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao remover label da mensagem: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }
}
