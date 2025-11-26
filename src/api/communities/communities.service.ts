import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { validateSocket } from '../../common/utils/socket-validator';
import {
  ExtendedWASocket,
  hasMethod,
} from '../../common/utils/extended-socket.type';

@Injectable()
export class CommunitiesService {
  private readonly logger = new Logger(CommunitiesService.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  private getSocket(sessionId: string): ExtendedWASocket {
    const socket = this.whatsappService.getSocket(
      sessionId,
    ) as ExtendedWASocket;
    validateSocket(socket);
    return socket;
  }

  async create(
    sessionId: string,
    subject: string,
    description?: string,
    linkedGroups?: string[],
  ) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityCreate')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(`[${sessionId}] Criando comunidade: ${subject}`);
      const result = await socket.communityCreate(
        subject,
        description,
        linkedGroups,
      );
      this.logger.log(`[${sessionId}] Comunidade criada com sucesso`);
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao criar comunidade: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao criar comunidade: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async getMetadata(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityMetadata')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(`[${sessionId}] Obtendo metadados da comunidade: ${jid}`);
      const metadata = await socket.communityMetadata(jid);
      return metadata;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter metadados: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao obter metadados: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async leave(sessionId: string, jid: string) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityLeave')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(`[${sessionId}] Saindo da comunidade: ${jid}`);
      await socket.communityLeave(jid);
      return { success: true, message: 'Saiu da comunidade com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao sair da comunidade: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao sair da comunidade: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async createGroup(
    sessionId: string,
    communityJid: string,
    subject: string,
    participants?: string[],
  ) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityCreateGroup')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Criando grupo na comunidade ${communityJid}: ${subject}`,
      );
      const result = await socket.communityCreateGroup(
        communityJid,
        subject,
        participants,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao criar grupo: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao criar grupo: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async linkGroups(sessionId: string, communityJid: string, groupIds: string[]) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityLinkGroup')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Vinculando grupos à comunidade ${communityJid}`,
      );
      await socket.communityLinkGroup(communityJid, groupIds);
      return { success: true, message: 'Grupos vinculados com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao vincular grupos: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao vincular grupos: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async unlinkGroups(
    sessionId: string,
    communityJid: string,
    groupIds: string[],
  ) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityUnlinkGroup')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Desvinculando grupos da comunidade ${communityJid}`,
      );
      await socket.communityUnlinkGroup(communityJid, groupIds);
      return { success: true, message: 'Grupos desvinculados com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao desvincular grupos: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao desvincular grupos: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async fetchLinkedGroups(sessionId: string, communityJid: string) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityFetchLinkedGroups')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Buscando grupos vinculados à comunidade ${communityJid}`,
      );
      const groups = await socket.communityFetchLinkedGroups(communityJid);
      return { groups };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao buscar grupos: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao buscar grupos: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async updateSubject(
    sessionId: string,
    communityJid: string,
    subject: string,
  ) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityUpdateSubject')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Atualizando nome da comunidade ${communityJid}`,
      );
      await socket.communityUpdateSubject(communityJid, subject);
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

  async updateDescription(
    sessionId: string,
    communityJid: string,
    description: string,
  ) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityUpdateDescription')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Atualizando descrição da comunidade ${communityJid}`,
      );
      await socket.communityUpdateDescription(communityJid, description);
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

  async getInviteCode(sessionId: string, communityJid: string) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityInviteCode')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Obtendo código de convite da comunidade ${communityJid}`,
      );
      const code = await socket.communityInviteCode(communityJid);
      return { code };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter código: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao obter código: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async acceptInvite(sessionId: string, code: string) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityAcceptInvite')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(`[${sessionId}] Aceitando convite de comunidade: ${code}`);
      const jid = await socket.communityAcceptInvite(code);
      return { jid };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao aceitar convite: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao aceitar convite: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async revokeInvite(sessionId: string, communityJid: string) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityRevokeInvite')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Revogando convite da comunidade ${communityJid}`,
      );
      const newCode = await socket.communityRevokeInvite(communityJid);
      return { code: newCode };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao revogar convite: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao revogar convite: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  async updateParticipants(
    sessionId: string,
    communityJid: string,
    participants: string[],
    action: 'add' | 'remove' | 'promote' | 'demote',
  ) {
    const socket = this.getSocket(sessionId);

    if (!hasMethod(socket, 'communityParticipantsUpdate')) {
      throw new BadRequestException(
        'Community methods not available in current whaileys version. Please update to a newer version.',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Atualizando participantes da comunidade ${communityJid}: ${action}`,
      );
      const result = await socket.communityParticipantsUpdate(
        communityJid,
        participants,
        action,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao atualizar participantes: ${error instanceof Error ? error.message : 'Erro'}`,
      );
      throw new BadRequestException(
        `Erro ao atualizar participantes: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }
}
