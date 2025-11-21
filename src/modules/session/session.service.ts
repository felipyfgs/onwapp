import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WhatsService } from '@/whats/whats.service';
import { useDatabaseAuthState } from '@/whats/database-auth-state';
import { CreateSessionDto, PairPhoneDto } from './dto';

// Webhook events disponíveis
const WEBHOOK_EVENTS = [
    'connection.update',
    'messages.upsert',
    'messages.update',
    'messages.delete',
    'message-receipt.update',
    'groups.upsert',
    'groups.update',
    'group-participants.update',
    'contacts.upsert',
    'contacts.update',
    'presence.update',
    'chats.upsert',
    'chats.update',
    'chats.delete',
];

@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly whatsService: WhatsService
    ) { }

    /**
     * Create a new session
     */
    async createSession(createSessionDto: CreateSessionDto) {
        const { name, webhookUrl, webhookEvents } = createSessionDto;

        // Check if session with same name exists
        const existing = await this.prisma.session.findUnique({
            where: { name }
        });

        if (existing) {
            throw new BadRequestException(`Session with name "${name}" already exists`);
        }

        // Create session in database
        const session = await this.prisma.session.create({
            data: {
                name,
                webhookUrl,
                webhookEvents: webhookEvents || [],
                status: 'disconnected',
            }
        });

        this.logger.log(`Session created: ${session.id} (${session.name})`);

        return session;
    }

    /**
     * Get all sessions
     */
    async findAll() {
        return this.prisma.session.findMany({
            select: {
                id: true,
                name: true,
                status: true,
                phoneNumber: true,
                webhookUrl: true,
                webhookEvents: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    }

    /**
     * Get session by ID
     */
    async findOne(id: string) {
        const session = await this.prisma.session.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                status: true,
                qrCode: true,
                phoneNumber: true,
                webhookUrl: true,
                webhookEvents: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!session) {
            throw new NotFoundException(`Session with ID "${id}" not found`);
        }

        return session;
    }

    /**
     * Delete session
     */
    async deleteSession(id: string) {
        const session = await this.findOne(id);

        // Disconnect if connected
        if (this.whatsService.isConnected(id)) {
            await this.whatsService.disconnect(id);
        }

        // Delete from database
        await this.prisma.session.delete({
            where: { id }
        });

        this.logger.log(`Session deleted: ${id} (${session.name})`);

        return { message: 'Session deleted successfully' };
    }

    /**
     * Connect session to WhatsApp
     */
    async connectSession(id: string) {
        const session = await this.findOne(id);

        // Check if already connected
        if (this.whatsService.isConnected(id)) {
            throw new BadRequestException('Session is already connected');
        }

        // Get auth state from database
        const authState = await useDatabaseAuthState(this.prisma, id);

        // Save credentials callback
        const saveCredsCallback = async (creds: any) => {
            const currentSession = await this.prisma.session.findUnique({
                where: { id },
                select: { creds: true }
            });

            const currentCreds = (currentSession?.creds as any) || { creds: {}, keys: {} };

            await this.prisma.session.update({
                where: { id },
                data: {
                    creds: {
                        ...currentCreds,
                        creds: {
                            ...currentCreds.creds,
                            ...creds
                        }
                    }
                }
            });
        };

        // Create WhatsApp connection
        await this.whatsService.createConnection(id, authState, saveCredsCallback);

        // Update status
        await this.prisma.session.update({
            where: { id },
            data: { status: 'connecting' }
        });

        this.logger.log(`Session connecting: ${id} (${session.name})`);

        return { message: 'Session connection initiated' };
    }

    /**
     * Disconnect session
     */
    async disconnectSession(id: string) {
        const session = await this.findOne(id);

        if (!this.whatsService.getSocket(id)) {
            throw new BadRequestException('Session is not connected');
        }

        await this.whatsService.disconnect(id);

        await this.prisma.session.update({
            where: { id },
            data: { status: 'disconnected', qrCode: null }
        });

        this.logger.log(`Session disconnected: ${id} (${session.name})`);

        return { message: 'Session disconnected successfully' };
    }

    /**
     * Get QR code for session
     */
    async getQRCode(id: string) {
        const session = await this.findOne(id);
        const qrCode = this.whatsService.getQRCode(id);
        const status = this.whatsService.getConnectionStatus(id) || session.status;

        if (!qrCode && status === 'open') {
            return {
                id,
                qrCode: null,
                status,
                message: 'Session is already connected'
            };
        }

        if (!qrCode) {
            return {
                id,
                qrCode: null,
                status,
                message: 'QR code not available. Make sure the session is connecting.'
            };
        }

        // Update QR code in database
        await this.prisma.session.update({
            where: { id },
            data: { qrCode, status }
        });

        return {
            id,
            qrCode,
            status
        };
    }

    /**
     * Pair with phone number
     */
    async pairPhone(id: string, pairPhoneDto: PairPhoneDto) {
        const session = await this.findOne(id);
        const socket = this.whatsService.getSocket(id);

        if (!socket) {
            throw new BadRequestException('Session is not connected. Connect first.');
        }

        // TODO: Implement phone pairing with whaileys
        // This feature may require specific whaileys support

        await this.prisma.session.update({
            where: { id },
            data: { phoneNumber: pairPhoneDto.phoneNumber }
        });

        this.logger.log(`Phone paired for session: ${id} (${pairPhoneDto.phoneNumber})`);

        return { message: 'Phone pairing initiated' };
    }

    /**
     * Get session status
     */
    async getSessionStatus(id: string) {
        const session = await this.findOne(id);
        const whatsStatus = this.whatsService.getConnectionStatus(id);

        // Update status from WhatsApp if available
        if (whatsStatus && whatsStatus !== session.status) {
            await this.prisma.session.update({
                where: { id },
                data: { status: whatsStatus }
            });
        }

        return {
            id: session.id,
            name: session.name,
            status: whatsStatus || session.status,
            phoneNumber: session.phoneNumber
        };
    }

    /**
     * Logout session
     */
    async logoutSession(id: string) {
        const session = await this.findOne(id);

        if (!this.whatsService.getSocket(id)) {
            throw new BadRequestException('Session is not connected');
        }

        await this.whatsService.disconnect(id);

        // Clear credentials from database
        await this.prisma.session.update({
            where: { id },
            data: {
                status: 'disconnected',
                qrCode: null,
                phoneNumber: null,
                creds: null
            }
        });

        this.logger.log(`Session logged out: ${id} (${session.name})`);

        return { message: 'Session logged out successfully' };
    }

    /**
     * List available webhook events
     */
    listWebhookEvents() {
        return { events: WEBHOOK_EVENTS };
    }
}
