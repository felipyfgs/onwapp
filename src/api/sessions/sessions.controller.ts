import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiSecurity,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { PairPhoneDto } from './dto/pair-phone.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Sessions')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova sessão' })
  @ApiBody({ type: CreateSessionDto })
  @ApiCreatedResponse({
    description: 'Sessão criada com sucesso',
    type: SessionResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    return this.sessionsService.createSession(createSessionDto);
  }

  @Get('list')
  @ApiOperation({ summary: 'Listar todas as sessões' })
  @ApiOkResponse({
    description: 'Lista de sessões retornada com sucesso',
    type: [SessionResponseDto],
  })
  async getSessions(): Promise<SessionResponseDto[]> {
    return this.sessionsService.getSessions();
  }

  @Get(':id/info')
  @ApiOperation({ summary: 'Obter sessão por ID' })
  @ApiParam({ name: 'id', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Sessão encontrada',
    type: SessionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async getSession(@Param('id') id: string): Promise<SessionResponseDto> {
    return this.sessionsService.getSession(id);
  }

  @Delete(':id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar sessão' })
  @ApiParam({ name: 'id', description: 'ID da sessão' })
  @ApiNoContentResponse({ description: 'Sessão deletada com sucesso' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async deleteSession(@Param('id') id: string): Promise<void> {
    return this.sessionsService.deleteSession(id);
  }

  @Post(':id/connect')
  @ApiOperation({ summary: 'Conectar sessão' })
  @ApiParam({ name: 'id', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Sessão conectada com sucesso',
    type: SessionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async connectSession(@Param('id') id: string): Promise<SessionResponseDto> {
    return this.sessionsService.connectSession(id);
  }

  @Post(':id/disconnect')
  @ApiOperation({ summary: 'Desconectar sessão' })
  @ApiParam({ name: 'id', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Sessão desconectada com sucesso',
    type: SessionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async disconnectSession(
    @Param('id') id: string,
  ): Promise<SessionResponseDto> {
    return this.sessionsService.disconnectSession(id);
  }

  @Post(':id/logout')
  @ApiOperation({ summary: 'Logout da sessão' })
  @ApiParam({ name: 'id', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Logout realizado com sucesso',
    type: SessionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async logoutSession(@Param('id') id: string): Promise<SessionResponseDto> {
    return this.sessionsService.logoutSession(id);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Obter código QR da sessão' })
  @ApiParam({ name: 'id', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Código QR retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        qrCode: { type: 'string', description: 'Código QR em base64' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async getQRCode(@Param('id') id: string): Promise<{ qrCode?: string }> {
    return this.sessionsService.getQRCode(id);
  }

  @Post(':id/pair')
  @ApiOperation({ summary: 'Parear telefone com a sessão' })
  @ApiParam({ name: 'id', description: 'ID da sessão' })
  @ApiBody({ type: PairPhoneDto })
  @ApiOkResponse({
    description: 'Telefone pareado com sucesso',
    type: SessionResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Número de telefone inválido' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async pairPhone(
    @Param('id') id: string,
    @Body() pairPhoneDto: PairPhoneDto,
  ): Promise<SessionResponseDto> {
    return this.sessionsService.pairPhone(id, pairPhoneDto);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Obter status da sessão' })
  @ApiParam({ name: 'id', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Status da sessão retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Status atual da sessão' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async getSessionStatus(@Param('id') id: string): Promise<{ status: string }> {
    return this.sessionsService.getSessionStatus(id);
  }
}
