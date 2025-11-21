import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    ValidationPipe,
    UseGuards,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto, PairPhoneDto } from './dto';
import { ApiKeyGuard } from '@/guards/api-key.guard';

@Controller('sessions')
@UseGuards(ApiKeyGuard)
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    /**
     * GET /sessions/webhook/events
     * List all available webhook events
     */
    @Get('webhook/events')
    listWebhookEvents() {
        return this.sessionService.listWebhookEvents();
    }

    /**
     * POST /sessions/create
     * Create a new session
     */
    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    createSession(@Body(ValidationPipe) createSessionDto: CreateSessionDto) {
        return this.sessionService.createSession(createSessionDto);
    }

    /**
     * GET /sessions/list
     * List all sessions
     */
    @Get('list')
    getSessions() {
        return this.sessionService.findAll();
    }

    /**
     * GET /sessions/:id/info
     * Get session details
     */
    @Get(':id/info')
    getSession(@Param('id') id: string) {
        return this.sessionService.findOne(id);
    }

    /**
     * DELETE /sessions/:id/delete
     * Delete a session
     */
    @Delete(':id/delete')
    deleteSession(@Param('id') id: string) {
        return this.sessionService.deleteSession(id);
    }

    /**
     * POST /sessions/:id/connect
     * Connect a session to WhatsApp
     */
    @Post(':id/connect')
    connectSession(@Param('id') id: string) {
        return this.sessionService.connectSession(id);
    }

    /**
     * POST /sessions/:id/disconnect
     * Disconnect a session from WhatsApp
     */
    @Post(':id/disconnect')
    disconnectSession(@Param('id') id: string) {
        return this.sessionService.disconnectSession(id);
    }

    /**
     * GET /sessions/:id/qr
     * Get QR code for session
     */
    @Get(':id/qr')
    getQRCode(@Param('id') id: string) {
        return this.sessionService.getQRCode(id);
    }

    /**
     * POST /sessions/:id/pair
     * Pair session with phone number
     */
    @Post(':id/pair')
    pairPhone(
        @Param('id') id: string,
        @Body(ValidationPipe) pairPhoneDto: PairPhoneDto
    ) {
        return this.sessionService.pairPhone(id, pairPhoneDto);
    }

    /**
     * GET /sessions/:id/status
     * Get session connection status
     */
    @Get(':id/status')
    getSessionStatus(@Param('id') id: string) {
        return this.sessionService.getSessionStatus(id);
    }

    /**
     * POST /sessions/:id/logout
     * Logout session and clear credentials
     */
    @Post(':id/logout')
    logoutSession(@Param('id') id: string) {
        return this.sessionService.logoutSession(id);
    }
}
