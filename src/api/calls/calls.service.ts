import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { validateSocket } from '../../common/utils/socket-validator';
import {
  ExtendedWASocket,
  hasMethod,
} from '../../common/utils/extended-socket.type';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  async createCallLink(sessionId: string) {
    const socket = this.whatsappService.getSocket(
      sessionId,
    ) as ExtendedWASocket;
    validateSocket(socket);

    if (!hasMethod(socket, 'createCallLink')) {
      throw new BadRequestException(
        'createCallLink not available in current whaileys version. Please update the library.',
      );
    }

    try {
      this.logger.log(`[${sessionId}] Criando link de chamada`);

      const result = await socket.createCallLink();

      this.logger.log(`[${sessionId}] Link de chamada criado: ${result}`);
      return { link: result };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao criar link de chamada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw new BadRequestException(
        `Erro ao criar link de chamada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  async rejectCall(sessionId: string, callId: string, callFrom: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(
        `[${sessionId}] Rejeitando chamada ${callId} de ${callFrom}`,
      );

      await socket.rejectCall(callId, callFrom);

      this.logger.log(`[${sessionId}] Chamada rejeitada: ${callId}`);
      return { success: true, message: 'Chamada rejeitada com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao rejeitar chamada: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao rejeitar chamada: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }
}
