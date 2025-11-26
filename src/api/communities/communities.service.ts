import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { validateSocket } from '../../common/utils/socket-validator';

@Injectable()
export class CommunitiesService {
  private readonly logger = new Logger(CommunitiesService.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  private normalizeJid(jid: string): string {
    if (!jid.endsWith('@g.us')) {
      return `${jid}@g.us`;
    }
    return jid;
  }

  async create(sessionId: string, subject: string, description?: string, linkedGroups?: string[]) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Criando comunidade: ${subject}`);

      const result = await socket.communityCreate(subject, description, linkedGroups);

      this.logger.log(`[${sessionId}] Comunidade criada: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao criar comunidade: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao criar comunidade: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async getMetadata(sessionId: string, jid: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);

    try {
      this.logger.log(`[${sessionId}] Obtendo metadados da comunidade: ${normalizedJid}`);

      const metadata = await socket.communityMetadata(normalizedJid);

      return metadata;
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao obter metadados: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new NotFoundException(`Comunidade não encontrada: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async leave(sessionId: string, jid: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);

    try {
      this.logger.log(`[${sessionId}] Saindo da comunidade: ${normalizedJid}`);

      await socket.communityLeave(normalizedJid);

      return { success: true, message: 'Saiu da comunidade com sucesso' };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao sair da comunidade: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao sair da comunidade: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async createGroup(sessionId: string, jid: string, subject: string, participants?: string[]) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);

    try {
      this.logger.log(`[${sessionId}] Criando grupo na comunidade: ${normalizedJid}`);

      const result = await socket.communityCreateGroup(normalizedJid, subject, participants || []);

      return result;
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao criar grupo: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao criar grupo: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async linkGroup(sessionId: string, jid: string, groupId: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);
    const normalizedGroupId = this.normalizeJid(groupId);

    try {
      this.logger.log(`[${sessionId}] Vinculando grupo ${normalizedGroupId} à comunidade ${normalizedJid}`);

      await socket.communityLinkGroup(normalizedJid, [normalizedGroupId]);

      return { success: true, message: 'Grupo vinculado com sucesso' };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao vincular grupo: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao vincular grupo: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async unlinkGroup(sessionId: string, jid: string, groupId: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);
    const normalizedGroupId = this.normalizeJid(groupId);

    try {
      this.logger.log(`[${sessionId}] Desvinculando grupo ${normalizedGroupId} da comunidade ${normalizedJid}`);

      await socket.communityUnlinkGroup(normalizedJid, [normalizedGroupId]);

      return { success: true, message: 'Grupo desvinculado com sucesso' };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao desvincular grupo: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao desvincular grupo: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async getLinkedGroups(sessionId: string, jid: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);

    try {
      this.logger.log(`[${sessionId}] Obtendo grupos da comunidade: ${normalizedJid}`);

      const groups = await socket.communityFetchLinkedGroups(normalizedJid);

      return { groups };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao obter grupos: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao obter grupos: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async updateSubject(sessionId: string, jid: string, subject: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);

    try {
      this.logger.log(`[${sessionId}] Atualizando nome da comunidade: ${normalizedJid}`);

      await socket.communityUpdateSubject(normalizedJid, subject);

      return { success: true, message: 'Nome atualizado com sucesso' };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao atualizar nome: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao atualizar nome: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async updateDescription(sessionId: string, jid: string, description: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);

    try {
      this.logger.log(`[${sessionId}] Atualizando descrição da comunidade: ${normalizedJid}`);

      await socket.communityUpdateDescription(normalizedJid, description);

      return { success: true, message: 'Descrição atualizada com sucesso' };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao atualizar descrição: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao atualizar descrição: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async getInviteCode(sessionId: string, jid: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);

    try {
      this.logger.log(`[${sessionId}] Obtendo código de convite da comunidade: ${normalizedJid}`);

      const code = await socket.communityInviteCode(normalizedJid);

      return { code };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao obter código: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao obter código: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async acceptInvite(sessionId: string, code: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    try {
      this.logger.log(`[${sessionId}] Aceitando convite de comunidade: ${code}`);

      const communityId = await socket.communityAcceptInvite(code);

      return { communityId };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao aceitar convite: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao aceitar convite: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async revokeInvite(sessionId: string, jid: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);

    try {
      this.logger.log(`[${sessionId}] Revogando convite da comunidade: ${normalizedJid}`);

      const code = await socket.communityRevokeInvite(normalizedJid);

      return { code };
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao revogar convite: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao revogar convite: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }

  async updateParticipants(
    sessionId: string,
    jid: string,
    participants: string[],
    action: 'add' | 'remove' | 'promote' | 'demote',
  ) {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);
    const normalizedJid = this.normalizeJid(jid);

    try {
      this.logger.log(`[${sessionId}] Atualizando participantes da comunidade: ${normalizedJid}`);

      const result = await socket.communityParticipantsUpdate(
        normalizedJid,
        participants,
        action,
      );

      return result;
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao atualizar participantes: ${error instanceof Error ? error.message : 'Erro'}`);
      throw new BadRequestException(`Erro ao atualizar participantes: ${error instanceof Error ? error.message : 'Erro'}`);
    }
  }
}
