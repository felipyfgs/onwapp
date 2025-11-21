import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    @Get('webhook/events')
    listWebhookEvents() {
        return this.sessionsService.listWebhookEvents();
    }

    @Post('create')
    createSession(@Body('id') id: string) {
        return this.sessionsService.createSession(id);
    }

    @Get('list')
    getSessions() {
        return this.sessionsService.getSessions();
    }

    @Get(':id/info')
    getSession(@Param('id') id: string) {
        return this.sessionsService.getSession(id);
    }

    @Delete(':id/delete')
    deleteSession(@Param('id') id: string) {
        return this.sessionsService.deleteSession(id);
    }

    @Post(':id/connect')
    connectSession(@Param('id') id: string) {
        return this.sessionsService.connectSession(id);
    }

    @Post(':id/disconnect')
    disconnectSession(@Param('id') id: string) {
        return this.sessionsService.disconnectSession(id);
    }

    @Get(':id/qr')
    getQRCode(@Param('id') id: string) {
        return this.sessionsService.getQRCode(id);
    }

    @Post(':id/pair')
    pairPhone(@Param('id') id: string, @Body('phoneNumber') phoneNumber: string) {
        return this.sessionsService.pairPhone(id, phoneNumber);
    }

    @Get(':id/status')
    getSessionStatus(@Param('id') id: string) {
        return this.sessionsService.getSessionStatus(id);
    }

    @Post(':id/logout')
    logoutSession(@Param('id') id: string) {
        return this.sessionsService.logoutSession(id);
    }
}
