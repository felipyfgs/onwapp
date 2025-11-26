import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiSecurity,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CreateCommunityGroupDto } from './dto/create-community-group.dto';
import { LinkGroupDto } from './dto/link-group.dto';
import { UpdateCommunitySubjectDto, UpdateCommunityDescriptionDto } from './dto/update-community.dto';
import { AcceptCommunityInviteDto } from './dto/accept-community-invite.dto';
import { UpdateCommunityParticipantsDto } from './dto/update-participants.dto';

@ApiTags('Communities')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar comunidade' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: CreateCommunityDto })
  @ApiOkResponse({ description: 'Comunidade criada com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao criar comunidade' })
  async create(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateCommunityDto,
  ) {
    return this.communitiesService.create(sessionId, dto.subject, dto.description, dto.linkedGroups);
  }

  @Get(':jid')
  @ApiOperation({ summary: 'Obter metadados da comunidade' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiOkResponse({ description: 'Metadados obtidos com sucesso' })
  @ApiNotFoundResponse({ description: 'Comunidade não encontrada' })
  async getMetadata(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.communitiesService.getMetadata(sessionId, jid);
  }

  @Delete(':jid')
  @ApiOperation({ summary: 'Sair da comunidade' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiOkResponse({ description: 'Saiu da comunidade com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao sair da comunidade' })
  async leave(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.communitiesService.leave(sessionId, jid);
  }

  @Post(':jid/groups')
  @ApiOperation({ summary: 'Criar grupo na comunidade' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiBody({ type: CreateCommunityGroupDto })
  @ApiOkResponse({ description: 'Grupo criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao criar grupo' })
  async createGroup(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: CreateCommunityGroupDto,
  ) {
    return this.communitiesService.createGroup(sessionId, jid, dto.subject, dto.participants);
  }

  @Get(':jid/groups')
  @ApiOperation({ summary: 'Listar grupos vinculados' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiOkResponse({ description: 'Grupos obtidos com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao listar grupos' })
  async getLinkedGroups(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.communitiesService.getLinkedGroups(sessionId, jid);
  }

  @Post(':jid/link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vincular grupo à comunidade' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiBody({ type: LinkGroupDto })
  @ApiOkResponse({ description: 'Grupo vinculado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao vincular grupo' })
  async linkGroup(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: LinkGroupDto,
  ) {
    return this.communitiesService.linkGroup(sessionId, jid, dto.groupId);
  }

  @Post(':jid/unlink')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desvincular grupo da comunidade' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiBody({ type: LinkGroupDto })
  @ApiOkResponse({ description: 'Grupo desvinculado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao desvincular grupo' })
  async unlinkGroup(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: LinkGroupDto,
  ) {
    return this.communitiesService.unlinkGroup(sessionId, jid, dto.groupId);
  }

  @Put(':jid/subject')
  @ApiOperation({ summary: 'Atualizar nome da comunidade' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiBody({ type: UpdateCommunitySubjectDto })
  @ApiOkResponse({ description: 'Nome atualizado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar nome' })
  async updateSubject(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: UpdateCommunitySubjectDto,
  ) {
    return this.communitiesService.updateSubject(sessionId, jid, dto.subject);
  }

  @Put(':jid/description')
  @ApiOperation({ summary: 'Atualizar descrição da comunidade' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiBody({ type: UpdateCommunityDescriptionDto })
  @ApiOkResponse({ description: 'Descrição atualizada com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar descrição' })
  async updateDescription(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: UpdateCommunityDescriptionDto,
  ) {
    return this.communitiesService.updateDescription(sessionId, jid, dto.description);
  }

  @Get(':jid/invite')
  @ApiOperation({ summary: 'Obter código de convite' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiOkResponse({ description: 'Código obtido com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter código' })
  async getInviteCode(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.communitiesService.getInviteCode(sessionId, jid);
  }

  @Post(':jid/invite/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revogar código de convite' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiOkResponse({ description: 'Código revogado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao revogar código' })
  async revokeInvite(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.communitiesService.revokeInvite(sessionId, jid);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Aceitar convite de comunidade' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: AcceptCommunityInviteDto })
  @ApiOkResponse({ description: 'Convite aceito com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao aceitar convite' })
  async acceptInvite(
    @Param('sessionId') sessionId: string,
    @Body() dto: AcceptCommunityInviteDto,
  ) {
    return this.communitiesService.acceptInvite(sessionId, dto.code);
  }

  @Post(':jid/participants')
  @ApiOperation({ summary: 'Gerenciar participantes da comunidade' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiBody({ type: UpdateCommunityParticipantsDto })
  @ApiOkResponse({ description: 'Participantes atualizados com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar participantes' })
  async updateParticipants(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: UpdateCommunityParticipantsDto,
  ) {
    return this.communitiesService.updateParticipants(sessionId, jid, dto.participants, dto.action);
  }
}
