import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { validateSocket } from '../../common/utils/socket-validator';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  async createCallLink(sessionId: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

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
}
