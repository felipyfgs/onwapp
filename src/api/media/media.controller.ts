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
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { DownloadMediaDto } from './dto/download-media.dto';
import { DownloadMediaResponseDto } from './dto/download-media-response.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';

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

  @Post('upload')
  @ApiOperation({
    summary: 'Upload de mídia para servidor',
    description:
      'Faz upload de mídia diretamente para os servidores do WhatsApp sem enviar mensagem',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: UploadMediaDto })
  @ApiOkResponse({
    description: 'Mídia enviada com sucesso',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL da mídia' },
        directPath: { type: 'string', description: 'Caminho direto' },
        mediaKey: { type: 'string', description: 'Chave de criptografia (base64)' },
        fileEncSha256: { type: 'string', description: 'SHA256 do arquivo criptografado (base64)' },
        fileSha256: { type: 'string', description: 'SHA256 do arquivo (base64)' },
        fileLength: { type: 'number', description: 'Tamanho do arquivo' },
        mediaKeyTimestamp: { type: 'number', description: 'Timestamp da chave' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Sessão desconectada ou erro no upload',
  })
  async uploadToServer(
    @Param('sessionId') sessionId: string,
    @Body() dto: UploadMediaDto,
  ) {
    const buffer = Buffer.from(dto.base64, 'base64');
    const result = await this.mediaService.uploadToServer(
      sessionId,
      dto.mediaType,
      buffer,
      { mimetype: dto.mimetype, fileEncSha256B64: dto.fileEncSha256B64 },
    );

    return {
      url: result.url,
      directPath: result.directPath,
      mediaKey: result.mediaKey.toString('base64'),
      fileEncSha256: result.fileEncSha256.toString('base64'),
      fileSha256: result.fileSha256.toString('base64'),
      fileLength: result.fileLength,
      mediaKeyTimestamp: result.mediaKeyTimestamp,
    };
  }
}
