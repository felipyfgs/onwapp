import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiSecurity,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { NewslettersService } from './newsletters.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterNameDto } from './dto/update-newsletter-name.dto';
import { UpdateNewsletterDescriptionDto } from './dto/update-newsletter-description.dto';
import { UpdateNewsletterPictureDto } from './dto/update-newsletter-picture.dto';
import { ReactNewsletterMessageDto } from './dto/react-newsletter-message.dto';

@ApiTags('Newsletters')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/newsletters')
export class NewslettersController {
  constructor(private readonly newslettersService: NewslettersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar canal/newsletter' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: CreateNewsletterDto })
  @ApiOkResponse({ description: 'Canal criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao criar canal' })
  async create(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateNewsletterDto,
  ) {
    return this.newslettersService.create(sessionId, dto.name, dto.description);
  }

  @Get(':jid')
  @ApiOperation({ summary: 'Obter metadados do canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiOkResponse({ description: 'Metadados obtidos com sucesso' })
  @ApiNotFoundResponse({ description: 'Canal não encontrado' })
  async getMetadata(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.newslettersService.getMetadata(sessionId, jid);
  }

  @Post(':jid/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seguir canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiOkResponse({ description: 'Canal seguido com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao seguir canal' })
  async follow(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.newslettersService.follow(sessionId, jid);
  }

  @Post(':jid/unfollow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deixar de seguir canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiOkResponse({ description: 'Canal desseguido com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao desseguir canal' })
  async unfollow(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.newslettersService.unfollow(sessionId, jid);
  }

  @Post(':jid/mute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Silenciar canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiOkResponse({ description: 'Canal silenciado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao silenciar canal' })
  async mute(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.newslettersService.mute(sessionId, jid);
  }

  @Post(':jid/unmute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dessilenciar canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiOkResponse({ description: 'Canal dessilenciado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao dessilenciar canal' })
  async unmute(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.newslettersService.unmute(sessionId, jid);
  }

  @Put(':jid/name')
  @ApiOperation({ summary: 'Atualizar nome do canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiBody({ type: UpdateNewsletterNameDto })
  @ApiOkResponse({ description: 'Nome atualizado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar nome' })
  async updateName(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: UpdateNewsletterNameDto,
  ) {
    return this.newslettersService.updateName(sessionId, jid, dto.name);
  }

  @Put(':jid/description')
  @ApiOperation({ summary: 'Atualizar descrição do canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiBody({ type: UpdateNewsletterDescriptionDto })
  @ApiOkResponse({ description: 'Descrição atualizada com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar descrição' })
  async updateDescription(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: UpdateNewsletterDescriptionDto,
  ) {
    return this.newslettersService.updateDescription(sessionId, jid, dto.description);
  }

  @Put(':jid/picture')
  @ApiOperation({ summary: 'Atualizar foto do canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiBody({ type: UpdateNewsletterPictureDto })
  @ApiOkResponse({ description: 'Foto atualizada com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao atualizar foto' })
  async updatePicture(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: UpdateNewsletterPictureDto,
  ) {
    return this.newslettersService.updatePicture(sessionId, jid, dto.url);
  }

  @Delete(':jid/picture')
  @ApiOperation({ summary: 'Remover foto do canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiOkResponse({ description: 'Foto removida com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao remover foto' })
  async removePicture(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.newslettersService.removePicture(sessionId, jid);
  }

  @Post(':jid/react')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reagir a mensagem do canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiBody({ type: ReactNewsletterMessageDto })
  @ApiOkResponse({ description: 'Reação enviada com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao reagir' })
  async react(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: ReactNewsletterMessageDto,
  ) {
    return this.newslettersService.react(sessionId, jid, dto.serverId, dto.reaction);
  }

  @Get(':jid/messages')
  @ApiOperation({ summary: 'Buscar mensagens do canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiQuery({ name: 'count', required: false, description: 'Número de mensagens (padrão: 50)' })
  @ApiOkResponse({ description: 'Mensagens obtidas com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao buscar mensagens' })
  async fetchMessages(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Query('count') count?: number,
  ) {
    return this.newslettersService.fetchMessages(sessionId, jid, count || 50);
  }

  @Delete(':jid')
  @ApiOperation({ summary: 'Deletar canal' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiOkResponse({ description: 'Canal deletado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao deletar canal' })
  async delete(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.newslettersService.delete(sessionId, jid);
  }

  @Get(':jid/admin-count')
  @ApiOperation({ summary: 'Obter contagem de administradores' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiOkResponse({ description: 'Contagem obtida com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter contagem' })
  async getAdminCount(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.newslettersService.getAdminCount(sessionId, jid);
  }

  @Get(':jid/subscribers')
  @ApiOperation({ summary: 'Obter lista de inscritos' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do canal' })
  @ApiOkResponse({ description: 'Lista obtida com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao obter lista' })
  async getSubscribers(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ) {
    return this.newslettersService.getSubscribers(sessionId, jid);
  }
}
