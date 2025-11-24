import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
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
import { MediaService } from './media.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { DownloadMediaDto } from './dto/download-media.dto';
import { DownloadMediaResponseDto } from './dto/download-media-response.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@ApiTags('Media')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('download')
  @ApiOperation({
    summary: 'Fazer download de mídia',
    description:
      'Faz download de uma mídia (imagem, vídeo, áudio, documento) de uma mensagem recebida',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: DownloadMediaDto })
  @ApiOkResponse({
    description: 'Mídia baixada com sucesso',
    type: DownloadMediaResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Sessão desconectada ou erro no download',
  })
  async downloadMedia(
    @Param('sessionId') sessionId: string,
    @Body() dto: DownloadMediaDto,
  ): Promise<DownloadMediaResponseDto> {
    return this.mediaService.downloadMedia(sessionId, dto);
  }

  @Post('update')
  @ApiOperation({
    summary: 'Re-upload de mídia',
    description:
      'Faz re-upload de mídia que foi deletada dos servidores do WhatsApp',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: UpdateMediaDto })
  @ApiOkResponse({
    description: 'Mídia re-enviada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'object', description: 'Mensagem atualizada' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Sessão desconectada ou erro no re-upload',
  })
  async updateMedia(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateMediaDto,
  ): Promise<any> {
    return this.mediaService.updateMedia(sessionId, dto);
  }
}
