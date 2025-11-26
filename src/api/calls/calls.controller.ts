import {
  Controller,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Calls')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('link')
  @ApiOperation({ summary: 'Criar link de chamada' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiOkResponse({ description: 'Link de chamada criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao criar link de chamada' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async createCallLink(@Param('sessionId') sessionId: string) {
    return this.callsService.createCallLink(sessionId);
  }
}
