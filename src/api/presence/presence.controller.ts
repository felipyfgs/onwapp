import {
  Controller,
  Get,
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
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PresenceService } from './presence.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { SubscribePresenceDto } from './dto/subscribe-presence.dto';
import { PresenceCacheResponseDto } from './dto/presence-cache-response.dto';

@ApiTags('Presence')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Post('update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Atualizar presença',
    description:
      'Envia atualização de presença (online, offline, digitando, gravando). A presença expira após ~10 segundos',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: UpdatePresenceDto })
  @ApiNoContentResponse({ description: 'Presença atualizada com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async updatePresence(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdatePresenceDto,
  ): Promise<void> {
    return this.presenceService.updatePresence(sessionId, dto);
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Inscrever-se em atualizações de presença',
    description:
      'Inscreve-se para receber atualizações de presença de um contato. Os eventos serão armazenados em cache',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SubscribePresenceDto })
  @ApiNoContentResponse({ description: 'Inscrição realizada com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async subscribePresence(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubscribePresenceDto,
  ): Promise<void> {
    return this.presenceService.subscribePresence(sessionId, dto);
  }

  @Get('cache')
  @ApiOperation({
    summary: 'Obter cache de presenças',
    description:
      'Retorna as presenças armazenadas em cache (TTL de 5 minutos). Pode filtrar por JID específico',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiQuery({
    name: 'jid',
    required: false,
    description: 'JID do contato (opcional, retorna todas se não fornecido)',
  })
  @ApiOkResponse({
    description: 'Cache de presenças retornado com sucesso',
    type: PresenceCacheResponseDto,
  })
  getPresenceCache(
    @Param('sessionId') sessionId: string,
    @Query('jid') jid?: string,
  ): PresenceCacheResponseDto {
    return this.presenceService.getPresenceCache(sessionId, jid);
  }
}
