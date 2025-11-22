import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { PairPhoneDto } from './dto/pair-phone.dto';
import { ApiKeyGuard } from '../../guards/api-key.guard';

@Controller('sessions')
@UseGuards(ApiKeyGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * GET /sessions/webhook/events - Listar todos os eventos suportados
   */
  @Get('webhook/events')
  listWebhookEvents() {
    return this.sessionService.listWebhookEvents();
  }

  /**
   * POST /sessions/create - Criar nova sessão
   */
  @Post('create')
  createSession(@Body() dto: CreateSessionDto) {
    return this.sessionService.createSession(dto);
  }

  /**
   * GET /sessions/list - Listar todas as sessões
   */
  @Get('list')
  getSessions() {
    return this.sessionService.getSessions();
  }

  /**
   * GET /sessions/:id/info - Obter detalhes da sessão
   */
  @Get(':id/info')
  getSession(@Param('id') id: string) {
    return this.sessionService.getSession(id);
  }

  /**
   * DELETE /sessions/:id/delete - Deletar sessão
   */
  @Delete(':id/delete')
  deleteSession(@Param('id') id: string) {
    return this.sessionService.deleteSession(id);
  }

  /**
   * POST /sessions/:id/connect - Conectar sessão
   */
  @Post(':id/connect')
  connectSession(@Param('id') id: string) {
    return this.sessionService.connectSession(id);
  }

  /**
   * POST /sessions/:id/disconnect - Desconectar sessão
   */
  @Post(':id/disconnect')
  disconnectSession(@Param('id') id: string) {
    return this.sessionService.disconnectSession(id);
  }

  /**
   * GET /sessions/:id/qr - Obter QR Code atual
   */
  @Get(':id/qr')
  getQRCode(@Param('id') id: string) {
    return this.sessionService.getQRCode(id);
  }

  /**
   * POST /sessions/:id/pair - Parear com telefone
   */
  @Post(':id/pair')
  pairPhone(@Param('id') id: string, @Body() dto: PairPhoneDto) {
    return this.sessionService.pairPhone(id, dto);
  }

  /**
   * GET /sessions/:id/status - Obter status da sessão
   */
  @Get(':id/status')
  getSessionStatus(@Param('id') id: string) {
    return this.sessionService.getSessionStatus(id);
  }
}
