import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { ManageParticipantsDto } from './dto/manage-participants.dto';
import { UpdateGroupSubjectDto } from './dto/update-group-subject.dto';
import { UpdateGroupDescriptionDto } from './dto/update-group-description.dto';
import { UpdateGroupPictureDto } from './dto/update-group-picture.dto';
import { UpdateGroupSettingsDto } from './dto/update-group-settings.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  private normalizeGroupId(groupId: string): string {
    if (!groupId.endsWith('@g.us')) {
      return `${groupId}@g.us`;
    }
    return groupId;
  }

  private validateSocket(sessionId: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new NotFoundException(
        `Sessão ${sessionId} não encontrada ou não está conectada`,
      );
    }
    return socket;
  }

  async listGroups(sessionId: string) {
    const socket = this.validateSocket(sessionId);

    try {
      this.logger.log(`[${sessionId}] Listando grupos da sessão`);

      const groups = await socket.groupFetchAllParticipating();

      const groupsList = Object.values(groups).map((group: any) => ({
        id: group.id,
        subject: group.subject,
        owner: group.owner,
        creation: group.creation,
        participants: group.participants?.length || 0,
        desc: group.desc,
        restrict: group.restrict,
        announce: group.announce,
      }));

      this.logger.log(`[${sessionId}] ${groupsList.length} grupos encontrados`);
      return { groups: groupsList, total: groupsList.length };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao listar grupos: ${error.message}`,
      );
      throw new BadRequestException(`Erro ao listar grupos: ${error.message}`);
    }
  }

  async createGroup(sessionId: string, createGroupDto: CreateGroupDto) {
    const socket = this.validateSocket(sessionId);

    try {
      this.logger.log(
        `[${sessionId}] Criando grupo: ${createGroupDto.subject}`,
      );

      const result = await socket.groupCreate(
        createGroupDto.subject,
        createGroupDto.participants,
      );

      this.logger.log(`[${sessionId}] Grupo criado: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`[${sessionId}] Erro ao criar grupo: ${error.message}`);
      throw new BadRequestException(`Erro ao criar grupo: ${error.message}`);
    }
  }

  async getGroupMetadata(sessionId: string, groupId: string) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Obtendo metadados do grupo: ${normalizedGroupId}`,
      );

      const metadata = await socket.groupMetadata(normalizedGroupId);

      return metadata;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter metadados do grupo: ${error.message}`,
      );
      throw new NotFoundException(
        `Grupo não encontrado ou erro: ${error.message}`,
      );
    }
  }

  async leaveGroup(sessionId: string, groupId: string) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(`[${sessionId}] Saindo do grupo: ${normalizedGroupId}`);

      await socket.groupLeave(normalizedGroupId);

      this.logger.log(`[${sessionId}] Saiu do grupo: ${normalizedGroupId}`);
      return { success: true, message: 'Saiu do grupo com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao sair do grupo: ${error.message}`,
      );
      throw new BadRequestException(`Erro ao sair do grupo: ${error.message}`);
    }
  }

  async addParticipants(
    sessionId: string,
    groupId: string,
    manageParticipantsDto: ManageParticipantsDto,
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Adicionando participantes ao grupo: ${normalizedGroupId}`,
      );

      const result = await socket.groupParticipantsUpdate(
        normalizedGroupId,
        manageParticipantsDto.participants,
        'add',
      );

      this.logger.log(
        `[${sessionId}] Participantes adicionados ao grupo: ${normalizedGroupId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao adicionar participantes: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao adicionar participantes: ${error.message}`,
      );
    }
  }

  async removeParticipants(
    sessionId: string,
    groupId: string,
    manageParticipantsDto: ManageParticipantsDto,
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Removendo participantes do grupo: ${normalizedGroupId}`,
      );

      const result = await socket.groupParticipantsUpdate(
        normalizedGroupId,
        manageParticipantsDto.participants,
        'remove',
      );

      this.logger.log(
        `[${sessionId}] Participantes removidos do grupo: ${normalizedGroupId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao remover participantes: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao remover participantes: ${error.message}`,
      );
    }
  }

  async promoteParticipants(
    sessionId: string,
    groupId: string,
    manageParticipantsDto: ManageParticipantsDto,
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Promovendo participantes a admin no grupo: ${normalizedGroupId}`,
      );

      const result = await socket.groupParticipantsUpdate(
        normalizedGroupId,
        manageParticipantsDto.participants,
        'promote',
      );

      this.logger.log(
        `[${sessionId}] Participantes promovidos no grupo: ${normalizedGroupId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao promover participantes: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao promover participantes: ${error.message}`,
      );
    }
  }

  async demoteParticipants(
    sessionId: string,
    groupId: string,
    manageParticipantsDto: ManageParticipantsDto,
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Rebaixando participantes de admin no grupo: ${normalizedGroupId}`,
      );

      const result = await socket.groupParticipantsUpdate(
        normalizedGroupId,
        manageParticipantsDto.participants,
        'demote',
      );

      this.logger.log(
        `[${sessionId}] Participantes rebaixados no grupo: ${normalizedGroupId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao rebaixar participantes: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao rebaixar participantes: ${error.message}`,
      );
    }
  }

  async updateSubject(
    sessionId: string,
    groupId: string,
    updateGroupSubjectDto: UpdateGroupSubjectDto,
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Atualizando nome do grupo: ${normalizedGroupId}`,
      );

      await socket.groupUpdateSubject(
        normalizedGroupId,
        updateGroupSubjectDto.subject,
      );

      this.logger.log(
        `[${sessionId}] Nome do grupo atualizado: ${normalizedGroupId}`,
      );
      return { success: true, message: 'Nome do grupo atualizado com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao atualizar nome do grupo: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao atualizar nome do grupo: ${error.message}`,
      );
    }
  }

  async updateDescription(
    sessionId: string,
    groupId: string,
    updateGroupDescriptionDto: UpdateGroupDescriptionDto,
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Atualizando descrição do grupo: ${normalizedGroupId}`,
      );

      await socket.groupUpdateDescription(
        normalizedGroupId,
        updateGroupDescriptionDto.description,
      );

      this.logger.log(
        `[${sessionId}] Descrição do grupo atualizada: ${normalizedGroupId}`,
      );
      return {
        success: true,
        message: 'Descrição do grupo atualizada com sucesso',
      };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao atualizar descrição do grupo: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao atualizar descrição do grupo: ${error.message}`,
      );
    }
  }

  async updatePicture(
    sessionId: string,
    groupId: string,
    updateGroupPictureDto: UpdateGroupPictureDto,
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    if (!updateGroupPictureDto.url && !updateGroupPictureDto.buffer) {
      throw new BadRequestException(
        'É necessário fornecer url ou buffer da imagem',
      );
    }

    try {
      this.logger.log(
        `[${sessionId}] Atualizando foto do grupo: ${normalizedGroupId}`,
      );

      const content = updateGroupPictureDto.url
        ? { url: updateGroupPictureDto.url }
        : Buffer.from(updateGroupPictureDto.buffer!, 'base64');

      await socket.updateProfilePicture(normalizedGroupId, content);

      this.logger.log(
        `[${sessionId}] Foto do grupo atualizada: ${normalizedGroupId}`,
      );
      return { success: true, message: 'Foto do grupo atualizada com sucesso' };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao atualizar foto do grupo: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao atualizar foto do grupo: ${error.message}`,
      );
    }
  }

  async getPicture(
    sessionId: string,
    groupId: string,
    type: 'image' | 'preview' = 'preview',
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Obtendo foto do grupo: ${normalizedGroupId}`,
      );

      const url = await socket.profilePictureUrl(normalizedGroupId, type);

      return { url };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter foto do grupo: ${error.message}`,
      );
      throw new NotFoundException(
        `Foto do grupo não encontrada ou erro: ${error.message}`,
      );
    }
  }

  async updateSettings(
    sessionId: string,
    groupId: string,
    updateGroupSettingsDto: UpdateGroupSettingsDto,
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    if (
      updateGroupSettingsDto.announcementMode === undefined &&
      updateGroupSettingsDto.locked === undefined
    ) {
      throw new BadRequestException(
        'É necessário fornecer ao menos uma configuração',
      );
    }

    try {
      const results: string[] = [];

      if (updateGroupSettingsDto.announcementMode !== undefined) {
        this.logger.log(
          `[${sessionId}] Atualizando modo de anúncio do grupo: ${normalizedGroupId}`,
        );

        const setting = updateGroupSettingsDto.announcementMode
          ? 'announcement'
          : 'not_announcement';

        await socket.groupSettingUpdate(normalizedGroupId, setting);
        results.push(
          `Modo de anúncio: ${updateGroupSettingsDto.announcementMode ? 'apenas admins' : 'todos'}`,
        );
      }

      if (updateGroupSettingsDto.locked !== undefined) {
        this.logger.log(
          `[${sessionId}] Atualizando bloqueio de edição do grupo: ${normalizedGroupId}`,
        );

        const setting = updateGroupSettingsDto.locked ? 'locked' : 'unlocked';

        await socket.groupSettingUpdate(normalizedGroupId, setting);
        results.push(
          `Edição: ${updateGroupSettingsDto.locked ? 'apenas admins' : 'todos'}`,
        );
      }

      this.logger.log(
        `[${sessionId}] Configurações do grupo atualizadas: ${normalizedGroupId}`,
      );
      return {
        success: true,
        message: `Configurações atualizadas: ${results.join(', ')}`,
      };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao atualizar configurações do grupo: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao atualizar configurações do grupo: ${error.message}`,
      );
    }
  }

  async getInviteCode(sessionId: string, groupId: string) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Obtendo código de convite do grupo: ${normalizedGroupId}`,
      );

      const code = await socket.groupInviteCode(normalizedGroupId);

      return { code };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter código de convite: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao obter código de convite: ${error.message}`,
      );
    }
  }

  async revokeInviteCode(sessionId: string, groupId: string) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Revogando código de convite do grupo: ${normalizedGroupId}`,
      );

      const code = await socket.groupRevokeInvite(normalizedGroupId);

      this.logger.log(
        `[${sessionId}] Código de convite revogado: ${normalizedGroupId}`,
      );
      return { code };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao revogar código de convite: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao revogar código de convite: ${error.message}`,
      );
    }
  }

  async acceptInvite(sessionId: string, acceptInviteDto: AcceptInviteDto) {
    const socket = this.validateSocket(sessionId);

    try {
      this.logger.log(
        `[${sessionId}] Aceitando convite: ${acceptInviteDto.code}`,
      );

      const groupId = await socket.groupAcceptInvite(acceptInviteDto.code);

      this.logger.log(`[${sessionId}] Convite aceito, grupo: ${groupId}`);
      return { groupId };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao aceitar convite: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao aceitar convite: ${error.message}`,
      );
    }
  }

  async getInviteInfo(sessionId: string, code: string) {
    const socket = this.validateSocket(sessionId);

    try {
      this.logger.log(`[${sessionId}] Obtendo informações do convite: ${code}`);

      const info = await socket.groupGetInviteInfo(code);

      return info;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter informações do convite: ${error.message}`,
      );
      throw new NotFoundException(
        `Convite não encontrado ou erro: ${error.message}`,
      );
    }
  }

  async toggleEphemeral(
    sessionId: string,
    groupId: string,
    expiration: number,
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Alterando mensagens temporárias do grupo: ${normalizedGroupId}`,
      );

      await socket.groupToggleEphemeral(normalizedGroupId, expiration);

      this.logger.log(
        `[${sessionId}] Mensagens temporárias alteradas: ${normalizedGroupId}`,
      );
      return {
        success: true,
        message: `Mensagens temporárias ${expiration > 0 ? `ativadas (${expiration}s)` : 'desativadas'}`,
      };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao alterar mensagens temporárias: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao alterar mensagens temporárias: ${error.message}`,
      );
    }
  }

  async getJoinRequests(sessionId: string, groupId: string) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Obtendo solicitações de entrada do grupo: ${normalizedGroupId}`,
      );

      const requests =
        await socket.groupRequestParticipantsList(normalizedGroupId);

      return { requests };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao obter solicitações: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao obter solicitações: ${error.message}`,
      );
    }
  }

  async handleJoinRequest(
    sessionId: string,
    groupId: string,
    participants: string[],
    action: 'approve' | 'reject',
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] ${action === 'approve' ? 'Aprovando' : 'Rejeitando'} solicitações no grupo: ${normalizedGroupId}`,
      );

      const result = await socket.groupRequestParticipantsUpdate(
        normalizedGroupId,
        participants,
        action,
      );

      this.logger.log(
        `[${sessionId}] Solicitações ${action === 'approve' ? 'aprovadas' : 'rejeitadas'}: ${normalizedGroupId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar solicitações: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao processar solicitações: ${error.message}`,
      );
    }
  }

  async setMemberAddMode(
    sessionId: string,
    groupId: string,
    mode: 'all_member_add' | 'admin_add',
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Alterando modo de adição de membros: ${normalizedGroupId}`,
      );

      await socket.groupMemberAddMode(normalizedGroupId, mode);

      this.logger.log(
        `[${sessionId}] Modo de adição alterado: ${normalizedGroupId}`,
      );
      return {
        success: true,
        message: `Modo de adição: ${mode === 'all_member_add' ? 'todos' : 'apenas admins'}`,
      };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao alterar modo de adição: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao alterar modo de adição: ${error.message}`,
      );
    }
  }

  async setJoinApprovalMode(
    sessionId: string,
    groupId: string,
    mode: 'on' | 'off',
  ) {
    const socket = this.validateSocket(sessionId);
    const normalizedGroupId = this.normalizeGroupId(groupId);

    try {
      this.logger.log(
        `[${sessionId}] Alterando aprovação de entrada: ${normalizedGroupId}`,
      );

      await socket.groupJoinApprovalMode(normalizedGroupId, mode);

      this.logger.log(
        `[${sessionId}] Aprovação de entrada alterada: ${normalizedGroupId}`,
      );
      return {
        success: true,
        message: `Aprovação de entrada: ${mode === 'on' ? 'ativada' : 'desativada'}`,
      };
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao alterar aprovação de entrada: ${error.message}`,
      );
      throw new BadRequestException(
        `Erro ao alterar aprovação de entrada: ${error.message}`,
      );
    }
  }
}
