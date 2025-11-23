import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
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
import { SettingsService } from './settings.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsResponseDto } from './dto/settings-response.dto';

@ApiTags('Settings')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Atualizar configurações',
    description:
      'Atualiza configurações gerais e de privacidade do WhatsApp. Envie apenas os campos que deseja atualizar.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({
    type: UpdateSettingsDto,
    examples: {
      'Configurações comportamentais': {
        value: {
          rejectCall: true,
          groupsIgnore: false,
          alwaysOnline: true,
          readMessages: true,
          readStatus: false,
          syncFullHistory: false,
        },
      },
      'Configurações de privacidade': {
        value: {
          profilePicture: 'all',
          status: 'contacts',
          lastSeen: 'contacts',
          online: 'all',
          call: 'all',
          messages: 'all',
          readReceipts: 'all',
          groupsAdd: 'contacts',
        },
      },
      'Configurações completas': {
        value: {
          rejectCall: true,
          groupsIgnore: false,
          alwaysOnline: true,
          readMessages: true,
          readStatus: false,
          syncFullHistory: false,
          profilePicture: 'all',
          status: 'contacts',
          lastSeen: 'contacts',
          online: 'all',
          call: 'all',
          messages: 'all',
          readReceipts: 'all',
          groupsAdd: 'contacts',
        },
      },
      'Atualização parcial': {
        value: {
          alwaysOnline: true,
          lastSeen: 'none',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Configurações atualizadas com sucesso',
    type: SettingsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Valores inválidos ou sessão desconectada',
  })
  async updateSettings(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    return this.settingsService.updateSettings(sessionId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obter configurações',
    description:
      'Retorna todas as configurações atuais (do cache local). Apenas as configurações que foram definidas via API serão retornadas.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Configurações retornadas com sucesso',
    type: SettingsResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async getSettings(
    @Param('sessionId') sessionId: string,
  ): Promise<SettingsResponseDto> {
    return this.settingsService.getSettings(sessionId);
  }
}
