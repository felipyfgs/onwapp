import {
  Controller,
  Get,
  Put,
  Post,
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
  ApiBody,
  ApiQuery,
  ApiSecurity,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { UpdateProfileStatusDto } from './dto/update-profile-status.dto';
import { UpdateProfileNameDto } from './dto/update-profile-name.dto';
import { UpdateProfilePictureDto } from './dto/update-profile-picture.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { GetProfilePictureQueryDto } from './dto/get-profile-picture.query';
import { ProfileResponseDto } from './dto/profile-response.dto';

@ApiTags('Profile')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Obter perfil próprio',
    description: 'Retorna informações do perfil da sessão conectada',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Perfil retornado com sucesso',
    type: ProfileResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async fetchProfile(
    @Param('sessionId') sessionId: string,
  ): Promise<ProfileResponseDto> {
    return this.profileService.fetchProfile(sessionId);
  }

  @Get('status/:jid')
  @ApiOperation({
    summary: 'Obter status de um contato',
    description: 'Retorna o status atual de um contato do WhatsApp',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({
    name: 'jid',
    description: 'JID do contato (ex: 5511999999999@s.whatsapp.net)',
  })
  @ApiOkResponse({
    description: 'Status retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'Hey there! I am using WhatsApp' },
        setAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  @ApiNotFoundResponse({ description: 'Status não encontrado' })
  async fetchStatus(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ): Promise<{ status?: string; setAt?: Date }> {
    return this.profileService.fetchStatus(sessionId, jid);
  }

  @Put('status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Atualizar status do perfil',
    description: 'Atualiza o status do próprio perfil do WhatsApp',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: UpdateProfileStatusDto })
  @ApiOkResponse({ description: 'Status atualizado com sucesso' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  async updateStatus(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateProfileStatusDto,
  ): Promise<void> {
    return this.profileService.updateProfileStatus(sessionId, dto);
  }

  @Put('name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Atualizar nome do perfil',
    description: 'Atualiza o nome do próprio perfil do WhatsApp',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: UpdateProfileNameDto })
  @ApiOkResponse({ description: 'Nome atualizado com sucesso' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  async updateName(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateProfileNameDto,
  ): Promise<void> {
    return this.profileService.updateProfileName(sessionId, dto);
  }

  @Get('picture/:jid')
  @ApiOperation({
    summary: 'Obter foto de perfil',
    description: 'Retorna a URL da foto de perfil de um contato ou grupo',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({
    name: 'jid',
    description: 'JID do contato ou grupo',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['image', 'preview'],
    description: 'Tipo de imagem (image = alta resolução, preview = baixa)',
  })
  @ApiQuery({
    name: 'timeout',
    required: false,
    type: Number,
    description: 'Timeout em milissegundos',
  })
  @ApiOkResponse({
    description: 'URL da foto de perfil retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://...' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Foto de perfil não encontrada' })
  async getProfilePicture(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Query() query: GetProfilePictureQueryDto,
  ): Promise<{ url?: string }> {
    return this.profileService.getProfilePicture(sessionId, jid, query);
  }

  @Put('picture')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Atualizar foto do perfil',
    description: 'Atualiza a foto do próprio perfil do WhatsApp',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: UpdateProfilePictureDto })
  @ApiOkResponse({ description: 'Foto de perfil atualizada com sucesso' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  async updatePicture(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateProfilePictureDto,
  ): Promise<void> {
    return this.profileService.updateProfilePicture(sessionId, dto);
  }

  @Put('picture/remove')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover foto do perfil',
    description: 'Remove a foto do próprio perfil do WhatsApp',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiOkResponse({ description: 'Foto de perfil removida com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async removePicture(@Param('sessionId') sessionId: string): Promise<void> {
    return this.profileService.removeProfilePicture(sessionId);
  }

  @Post('block')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Bloquear usuário',
    description: 'Bloqueia um usuário do WhatsApp',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: BlockUserDto })
  @ApiOkResponse({ description: 'Usuário bloqueado com sucesso' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  async blockUser(
    @Param('sessionId') sessionId: string,
    @Body() dto: BlockUserDto,
  ): Promise<void> {
    return this.profileService.blockUser(sessionId, dto);
  }

  @Post('unblock')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desbloquear usuário',
    description: 'Desbloqueia um usuário do WhatsApp',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: BlockUserDto })
  @ApiOkResponse({ description: 'Usuário desbloqueado com sucesso' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  async unblockUser(
    @Param('sessionId') sessionId: string,
    @Body() dto: BlockUserDto,
  ): Promise<void> {
    return this.profileService.unblockUser(sessionId, dto);
  }

  @Get('blocklist')
  @ApiOperation({
    summary: 'Obter lista de bloqueados',
    description: 'Retorna a lista de todos os contatos bloqueados',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Lista de bloqueados retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        blocklist: {
          type: 'array',
          items: { type: 'string' },
          example: ['5511999999999@s.whatsapp.net'],
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async getBlocklist(
    @Param('sessionId') sessionId: string,
  ): Promise<{ blocklist: string[] }> {
    return this.profileService.getBlocklist(sessionId);
  }
}
