import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { SessionService } from './session.service';
import { AuthGuard } from './auth.guard';

@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('webhook/events')
  listWebhookEvents() {
    return [
      'connection.update',
      'messages.upsert',
      'creds.update',
    ];
  }

  @Post('create')
  async createSession(
    @Body('id') id: string,
    @Res() res: Response,
  ) {
    await this.sessionService.createSession(id);
    res.status(HttpStatus.CREATED).json({ success: true, sessionId: id });
  }

  @Get('list')
  async getSessions() {
    const sessions = await this.sessionService.getSessions();
    return { sessions };
  }

  @Get(':id/info')
  async getSession(@Param('id') id: string) {
    const session = await this.sessionService.getSession(id);
    return { session };
  }

  @Delete(':id/delete')
  async deleteSession(@Param('id') id: string) {
    await this.sessionService.deleteSession(id);
    return { success: true };
  }

  @Post(':id/connect')
  async connectSession(@Param('id') id: string) {
    await this.sessionService.connectSession(id);
    return { success: true };
  }

  @Post(':id/disconnect')
  async disconnectSession(@Param('id') id: string) {
    await this.sessionService.disconnectSession(id);
    return { success: true };
  }

  @Get(':id/qr')
  async getQRCode(@Param('id') id: string) {
    const qr = await this.sessionService.getQRCode(id);
    if (!qr) {
      return { qr: null };
    }
    return { qr };
  }

  @Post(':id/pair')
  async pairPhone(@Param('id') id: string, @Body('phoneNumber') phoneNumber: string) {
    const code = await this.sessionService.pairPhone(id, phoneNumber);
    return { code };
  }

  @Get(':id/status')
  async getSessionStatus(@Param('id') id: string) {
    const status = await this.sessionService.getSessionStatus(id);
    return { status };
  }
}