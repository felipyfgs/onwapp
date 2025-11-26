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
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { RejectCallDto } from './dto/reject-call.dto';

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

  @Post('reject')
  @ApiOperation({ summary: 'Rejeitar chamada recebida' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: RejectCallDto })
  @ApiOkResponse({ description: 'Chamada rejeitada com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao rejeitar chamada' })
  async rejectCall(
    @Param('sessionId') sessionId: string,
    @Body() dto: RejectCallDto,
  ) {
    return this.callsService.rejectCall(sessionId, dto.callId, dto.callFrom);
  }
}
