import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiSecurity,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { ManageParticipantsDto } from './dto/manage-participants.dto';
import { UpdateGroupSubjectDto } from './dto/update-group-subject.dto';
import { UpdateGroupDescriptionDto } from './dto/update-group-description.dto';
import { UpdateGroupPictureDto } from './dto/update-group-picture.dto';
import { UpdateGroupSettingsDto } from './dto/update-group-settings.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { GroupMetadataResponseDto } from './dto/group-metadata-response.dto';
import { ToggleEphemeralDto } from './dto/toggle-ephemeral.dto';
import { HandleJoinRequestDto } from './dto/handle-join-request.dto';
import { MemberAddModeDto } from './dto/member-add-mode.dto';
import { JoinApprovalModeDto } from './dto/join-approval-mode.dto';

@ApiTags('Groups')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os grupos da sessão' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiOkResponse({ description: 'Lista de grupos obtida com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao listar grupos' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async listGroups(@Param('sessionId') sessionId: string) {
    return this.groupsService.listGroups(sessionId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: CreateGroupDto })
  @ApiOkResponse({ description: 'Grupo criado com sucesso' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou erro ao criar grupo',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async createGroup(
    @Param('sessionId') sessionId: string,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.groupsService.createGroup(sessionId, createGroupDto);
  }

  @Get(':groupId')
  @ApiOperation({ summary: 'Obter informações do grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiOkResponse({
    description: 'Informações do grupo obtidas com sucesso',
    type: GroupMetadataResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Sessão ou grupo não encontrado' })
  async getGroupMetadata(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.getGroupMetadata(sessionId, groupId);
  }

  @Delete(':groupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sair do grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiOkResponse({ description: 'Saiu do grupo com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao sair do grupo' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async leaveGroup(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.leaveGroup(sessionId, groupId);
  }

  @Post(':groupId/participants')
  @ApiOperation({ summary: 'Adicionar participantes ao grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: ManageParticipantsDto })
  @ApiOkResponse({ description: 'Participantes adicionados com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao adicionar participantes' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async addParticipants(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() manageParticipantsDto: ManageParticipantsDto,
  ) {
    return this.groupsService.addParticipants(
      sessionId,
      groupId,
      manageParticipantsDto,
    );
  }

  @Delete(':groupId/participants')
  @ApiOperation({ summary: 'Remover participantes do grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: ManageParticipantsDto })
  @ApiOkResponse({ description: 'Participantes removidos com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao remover participantes' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async removeParticipants(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() manageParticipantsDto: ManageParticipantsDto,
  ) {
    return this.groupsService.removeParticipants(
      sessionId,
      groupId,
      manageParticipantsDto,
    );
  }

  @Post(':groupId/participants/promote')
  @ApiOperation({ summary: 'Promover participantes a admin' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: ManageParticipantsDto })
  @ApiOkResponse({ description: 'Participantes promovidos com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao promover participantes' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async promoteParticipants(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() manageParticipantsDto: ManageParticipantsDto,
  ) {
    return this.groupsService.promoteParticipants(
      sessionId,
      groupId,
      manageParticipantsDto,
    );
  }

  @Post(':groupId/participants/demote')
  @ApiOperation({ summary: 'Rebaixar participantes de admin' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: ManageParticipantsDto })
  @ApiOkResponse({ description: 'Participantes rebaixados com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao rebaixar participantes' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async demoteParticipants(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() manageParticipantsDto: ManageParticipantsDto,
  ) {
    return this.groupsService.demoteParticipants(
      sessionId,
      groupId,
      manageParticipantsDto,
    );
  }

  @Post(':groupId/subject')
  @ApiOperation({ summary: 'Atualizar nome do grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: UpdateGroupSubjectDto })
  @ApiOkResponse({ description: 'Nome do grupo atualizado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar nome do grupo' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async updateSubject(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() updateGroupSubjectDto: UpdateGroupSubjectDto,
  ) {
    return this.groupsService.updateSubject(
      sessionId,
      groupId,
      updateGroupSubjectDto,
    );
  }

  @Post(':groupId/description')
  @ApiOperation({ summary: 'Atualizar descrição do grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: UpdateGroupDescriptionDto })
  @ApiOkResponse({ description: 'Descrição do grupo atualizada com sucesso' })
  @ApiBadRequestResponse({
    description: 'Erro ao atualizar descrição do grupo',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async updateDescription(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() updateGroupDescriptionDto: UpdateGroupDescriptionDto,
  ) {
    return this.groupsService.updateDescription(
      sessionId,
      groupId,
      updateGroupDescriptionDto,
    );
  }

  @Post(':groupId/picture')
  @ApiOperation({ summary: 'Atualizar foto do grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: UpdateGroupPictureDto })
  @ApiOkResponse({ description: 'Foto do grupo atualizada com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar foto do grupo' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async updatePicture(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() updateGroupPictureDto: UpdateGroupPictureDto,
  ) {
    return this.groupsService.updatePicture(
      sessionId,
      groupId,
      updateGroupPictureDto,
    );
  }

  @Get(':groupId/picture')
  @ApiOperation({ summary: 'Obter foto do grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['image', 'preview'],
    description:
      'Tipo de imagem (image = alta resolução, preview = baixa resolução)',
  })
  @ApiOkResponse({ description: 'URL da foto do grupo' })
  @ApiNotFoundResponse({
    description: 'Foto não encontrada ou sessão não encontrada',
  })
  async getPicture(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Query('type') type: 'image' | 'preview' = 'preview',
  ) {
    return this.groupsService.getPicture(sessionId, groupId, type);
  }

  @Post(':groupId/settings')
  @ApiOperation({ summary: 'Atualizar configurações do grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: UpdateGroupSettingsDto })
  @ApiOkResponse({
    description: 'Configurações do grupo atualizadas com sucesso',
  })
  @ApiBadRequestResponse({
    description: 'Erro ao atualizar configurações do grupo',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async updateSettings(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() updateGroupSettingsDto: UpdateGroupSettingsDto,
  ) {
    return this.groupsService.updateSettings(
      sessionId,
      groupId,
      updateGroupSettingsDto,
    );
  }

  @Get(':groupId/invite')
  @ApiOperation({ summary: 'Obter código de convite do grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiOkResponse({ description: 'Código de convite obtido com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter código de convite' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async getInviteCode(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.getInviteCode(sessionId, groupId);
  }

  @Post(':groupId/invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revogar código de convite do grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiOkResponse({ description: 'Código de convite revogado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao revogar código de convite' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async revokeInviteCode(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.revokeInviteCode(sessionId, groupId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Aceitar convite de grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: AcceptInviteDto })
  @ApiOkResponse({ description: 'Convite aceito com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao aceitar convite' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async acceptInvite(
    @Param('sessionId') sessionId: string,
    @Body() acceptInviteDto: AcceptInviteDto,
  ) {
    return this.groupsService.acceptInvite(sessionId, acceptInviteDto);
  }

  @Get('invite/:code')
  @ApiOperation({ summary: 'Obter informações do grupo via código de convite' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'code', description: 'Código do convite' })
  @ApiOkResponse({ description: 'Informações do grupo obtidas com sucesso' })
  @ApiNotFoundResponse({
    description: 'Convite não encontrado ou sessão não encontrada',
  })
  async getInviteInfo(
    @Param('sessionId') sessionId: string,
    @Param('code') code: string,
  ) {
    return this.groupsService.getInviteInfo(sessionId, code);
  }

  @Post(':groupId/ephemeral')
  @ApiOperation({ summary: 'Ativar/desativar mensagens temporárias no grupo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: ToggleEphemeralDto })
  @ApiOkResponse({ description: 'Mensagens temporárias alteradas com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao alterar mensagens temporárias' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async toggleEphemeral(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() dto: ToggleEphemeralDto,
  ) {
    return this.groupsService.toggleEphemeral(sessionId, groupId, dto.expiration);
  }

  @Get(':groupId/requests')
  @ApiOperation({ summary: 'Listar solicitações de entrada pendentes' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiOkResponse({ description: 'Solicitações listadas com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao listar solicitações' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async getJoinRequests(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.getJoinRequests(sessionId, groupId);
  }

  @Post(':groupId/requests')
  @ApiOperation({ summary: 'Aprovar ou rejeitar solicitações de entrada' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: HandleJoinRequestDto })
  @ApiOkResponse({ description: 'Solicitações processadas com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao processar solicitações' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async handleJoinRequest(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() dto: HandleJoinRequestDto,
  ) {
    return this.groupsService.handleJoinRequest(
      sessionId,
      groupId,
      dto.participants,
      dto.action,
    );
  }

  @Post(':groupId/member-add-mode')
  @ApiOperation({ summary: 'Definir quem pode adicionar membros' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: MemberAddModeDto })
  @ApiOkResponse({ description: 'Modo de adição alterado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao alterar modo de adição' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async setMemberAddMode(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() dto: MemberAddModeDto,
  ) {
    return this.groupsService.setMemberAddMode(sessionId, groupId, dto.mode);
  }

  @Post(':groupId/join-approval')
  @ApiOperation({ summary: 'Ativar/desativar aprovação de entrada' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'groupId', description: 'ID do grupo' })
  @ApiBody({ type: JoinApprovalModeDto })
  @ApiOkResponse({ description: 'Modo de aprovação alterado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao alterar modo de aprovação' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async setJoinApprovalMode(
    @Param('sessionId') sessionId: string,
    @Param('groupId') groupId: string,
    @Body() dto: JoinApprovalModeDto,
  ) {
    return this.groupsService.setJoinApprovalMode(sessionId, groupId, dto.mode);
  }
}
