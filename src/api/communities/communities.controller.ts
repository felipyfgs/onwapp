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
} from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CreateCommunityGroupDto } from './dto/create-community-group.dto';
import { LinkGroupDto } from './dto/link-group.dto';
import {
  UpdateCommunitySubjectDto,
  UpdateCommunityDescriptionDto,
} from './dto/update-community.dto';
import { UpdateCommunityParticipantsDto } from './dto/update-participants.dto';
import { AcceptCommunityInviteDto } from './dto/accept-community-invite.dto';

@ApiTags('Communities')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar comunidade',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: CreateCommunityDto })
  @ApiOkResponse({ description: 'Comunidade criada com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao criar comunidade' })
  async create(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateCommunityDto,
  ) {
    return this.communitiesService.create(
      sessionId,
      dto.subject,
      dto.description,
      dto.linkedGroups,
    );
  }

  @Get(':jid')
  @ApiOperation({
    summary: 'Obter metadados da comunidade',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiOkResponse({ description: 'Metadados obtidos com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter metadados' })
  async getMetadata(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.communitiesService.getMetadata(sessionId, jid);
  }

  @Delete(':jid')
  @ApiOperation({
    summary: 'Sair da comunidade',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
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
  @ApiOperation({
    summary: 'Criar grupo na comunidade',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
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
    return this.communitiesService.createGroup(
      sessionId,
      jid,
      dto.subject,
      dto.participants,
    );
  }

  @Get(':jid/groups')
  @ApiOperation({
    summary: 'Listar grupos vinculados',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiOkResponse({ description: 'Grupos obtidos com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter grupos' })
  async fetchLinkedGroups(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.communitiesService.fetchLinkedGroups(sessionId, jid);
  }

  @Post(':jid/groups/link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vincular grupos à comunidade',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiBody({ type: LinkGroupDto })
  @ApiOkResponse({ description: 'Grupos vinculados com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao vincular grupos' })
  async linkGroups(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: LinkGroupDto,
  ) {
    return this.communitiesService.linkGroups(sessionId, jid, dto.groupIds);
  }

  @Post(':jid/groups/unlink')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desvincular grupos da comunidade',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiBody({ type: LinkGroupDto })
  @ApiOkResponse({ description: 'Grupos desvinculados com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao desvincular grupos' })
  async unlinkGroups(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: LinkGroupDto,
  ) {
    return this.communitiesService.unlinkGroups(sessionId, jid, dto.groupIds);
  }

  @Put(':jid/subject')
  @ApiOperation({
    summary: 'Atualizar nome da comunidade',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
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
  @ApiOperation({
    summary: 'Atualizar descrição da comunidade',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
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
    return this.communitiesService.updateDescription(
      sessionId,
      jid,
      dto.description,
    );
  }

  @Get(':jid/invite')
  @ApiOperation({
    summary: 'Obter código de convite',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
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

  @Post('invite/accept')
  @ApiOperation({
    summary: 'Aceitar convite de comunidade',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
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

  @Post(':jid/invite/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revogar código de convite',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID da comunidade' })
  @ApiOkResponse({ description: 'Convite revogado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao revogar convite' })
  async revokeInvite(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.communitiesService.revokeInvite(sessionId, jid);
  }

  @Post(':jid/participants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar participantes da comunidade',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
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
    return this.communitiesService.updateParticipants(
      sessionId,
      jid,
      dto.participants,
      dto.action,
    );
  }
}
