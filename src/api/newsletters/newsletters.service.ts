import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { validateSocket } from '../../common/utils/socket-validator';
import {
  ExtendedWASocket,
  hasMethod,
} from '../../common/utils/extended-socket.type';

@Injectable()
export class NewslettersService {
  private readonly logger = new Logger(NewslettersService.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  private normalizeJid(jid: string): string {
    if (!jid.endsWith('@newsletter')) {
      return `${jid}@newsletter`;
    }
    return jid;
  }

  private getSocket(sessionId: string): ExtendedWASocket {
    const socket = this.whatsappService.getSocket(
      sessionId,
    ) as ExtendedWASocket;
    validateSocket(socket);
    return socket;
  }

  async create(sessionId: string, name: string, description?: string) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'newsletterCreate')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(`[${sessionId}] Criando newsletter: ${name}`);
      const result = await socket.newsletterCreate(name, description);
      this.logger.log(`[${sessionId}] Newsletter criado: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao criar newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao criar newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async getMetadata(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterMetadata')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Obtendo metadados do newsletter: ${normalizedJid}`,
      );
      const metadata = await socket.newsletterMetadata('jid', normalizedJid);
      return metadata;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter metadados: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new NotFoundException(
        `Newsletter não encontrado: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async follow(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterFollow')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(`[${sessionId}] Seguindo newsletter: ${normalizedJid}`);
      await socket.newsletterFollow(normalizedJid);
      return { success: true, message: 'Newsletter seguido com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao seguir newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao seguir newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async unfollow(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterUnfollow')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Deixando de seguir newsletter: ${normalizedJid}`,
      );
      await socket.newsletterUnfollow(normalizedJid);
      return { success: true, message: 'Newsletter desseguido com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao desseguir newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao desseguir newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async mute(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterMute')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Silenciando newsletter: ${normalizedJid}`,
      );
      await socket.newsletterMute(normalizedJid);
      return { success: true, message: 'Newsletter silenciado com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao silenciar newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao silenciar newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async unmute(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterUnmute')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Dessilenciando newsletter: ${normalizedJid}`,
      );
      await socket.newsletterUnmute(normalizedJid);
      return { success: true, message: 'Newsletter dessilenciado com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao dessilenciar newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao dessilenciar newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async updateName(sessionId: string, jid: string, name: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterUpdateName')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Atualizando nome do newsletter: ${normalizedJid}`,
      );
      await socket.newsletterUpdateName(normalizedJid, name);
      return { success: true, message: 'Nome atualizado com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao atualizar nome: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao atualizar nome: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async updateDescription(sessionId: string, jid: string, description: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterUpdateDescription')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Atualizando descrição do newsletter: ${normalizedJid}`,
      );
      await socket.newsletterUpdateDescription(normalizedJid, description);
      return { success: true, message: 'Descrição atualizada com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao atualizar descrição: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao atualizar descrição: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async updatePicture(sessionId: string, jid: string, url: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterUpdatePicture')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Atualizando foto do newsletter: ${normalizedJid}`,
      );
      await socket.newsletterUpdatePicture(normalizedJid, { url });
      return { success: true, message: 'Foto atualizada com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao atualizar foto: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao atualizar foto: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async removePicture(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterRemovePicture')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Removendo foto do newsletter: ${normalizedJid}`,
      );
      await socket.newsletterRemovePicture(normalizedJid);
      return { success: true, message: 'Foto removida com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao remover foto: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao remover foto: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async react(
    sessionId: string,
    jid: string,
    serverId: string,
    reaction?: string,
  ) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterReactMessage')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Reagindo a mensagem do newsletter: ${normalizedJid}`,
      );
      await socket.newsletterReactMessage(normalizedJid, serverId, reaction);
      return {
        success: true,
        message: reaction ? 'Reação adicionada' : 'Reação removida',
      };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao reagir: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao reagir: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async fetchMessages(sessionId: string, jid: string, count: number = 50) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterFetchMessages')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Buscando mensagens do newsletter: ${normalizedJid}`,
      );
      const messages = await socket.newsletterFetchMessages(
        normalizedJid,
        count,
        undefined,
      );
      return { messages };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao buscar mensagens: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao buscar mensagens: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async delete(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterDelete')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(`[${sessionId}] Deletando newsletter: ${normalizedJid}`);
      await socket.newsletterDelete(normalizedJid);
      return { success: true, message: 'Newsletter deletado com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao deletar newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao deletar newsletter: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async getAdminCount(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterAdminCount')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Obtendo contagem de admins do newsletter: ${normalizedJid}`,
      );
      const count = await socket.newsletterAdminCount(normalizedJid);
      return { adminCount: count };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter contagem de admins: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao obter contagem de admins: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async getSubscribers(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);
    const normalizedJid = this.normalizeJid(jid);

    if (!hasMethod(socket, 'newsletterSubscribers')) {
      throw new BadRequestException(
        'Newsletter methods not available in current whaileys version',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Obtendo inscritos do newsletter: ${normalizedJid}`,
      );
      const subscribers = await socket.newsletterSubscribers(normalizedJid);
      return { subscribers };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter inscritos: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao obter inscritos: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }
}
