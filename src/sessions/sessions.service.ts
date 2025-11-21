import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
} from 'whaileys';
import * as qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SessionsService {
    private readonly logger = new Logger(SessionsService.name);
    private sessions = new Map<string, any>();
    private retries = new Map<string, number>();

    constructor(private prisma: PrismaService) { }

    async createSession(id: string) {
        const session = await this.prisma.session.findUnique({ where: { id } });
        if (session) {
            throw new Error('Session already exists');
        }
        await this.prisma.session.create({
            data: {
                id,
                data: '{}',
            },
        });
        return { message: 'Session created', id };
    }

    async getSessions() {
        return this.prisma.session.findMany();
    }

    async getSession(id: string) {
        return this.prisma.session.findUnique({ where: { id } });
    }

    async deleteSession(id: string) {
        // Disconnect if active
        await this.disconnectSession(id);

        // Remove from DB
        await this.prisma.session.delete({ where: { id } });

        // Remove auth folder if exists (if we were using file auth, but we want DB auth eventually. 
        // For now, let's use file auth as per standard Baileys example for simplicity, 
        // but mapped to the ID).
        const authPath = path.resolve('sessions_auth', id);
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
        }

        return { message: 'Session deleted', id };
    }

    async connectSession(id: string) {
        if (this.sessions.has(id)) {
            return { message: 'Session already active', id };
        }

        const session = await this.prisma.session.findUnique({ where: { id } });
        if (!session) {
            throw new NotFoundException('Session not found');
        }

        await this.startSession(id);
        return { message: 'Session connecting', id };
    }

    private async startSession(id: string) {
        const authPath = path.resolve('sessions_auth', id);
        if (!fs.existsSync(authPath)) {
            fs.mkdirSync(authPath, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(authPath);
        const { version, isLatest } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: this.logger as any,
            printQRInTerminal: true, // As requested
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, this.logger as any),
            },
            browser: Browsers.ubuntu('Chrome'),
        });

        this.sessions.set(id, sock);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.logger.log(`QR Code for session ${id}:`);
                qrcode.generate(qr, { small: true }); // Print to terminal
                // Store QR in memory or DB if needed for API retrieval
                (sock as any).qr = qr;
            }

            if (connection === 'close') {
                const shouldReconnect =
                    (lastDisconnect?.error as Boom)?.output?.statusCode !==
                    DisconnectReason.loggedOut;

                this.logger.warn(
                    `Connection closed for session ${id}. Reconnecting: ${shouldReconnect}`
                );

                if (shouldReconnect) {
                    // Retry logic
                    this.retrySession(id);
                } else {
                    this.sessions.delete(id);
                    this.logger.log(`Session ${id} logged out.`);
                }
            } else if (connection === 'open') {
                this.logger.log(`Session ${id} connected`);
                this.retries.set(id, 0);
            }
        });
    }

    private async retrySession(id: string) {
        const retryCount = this.retries.get(id) || 0;
        if (retryCount < 5) {
            this.retries.set(id, retryCount + 1);
            setTimeout(() => this.startSession(id), 5000); // Wait 5s before reconnect
        } else {
            this.logger.error(`Max retries reached for session ${id}`);
            this.sessions.delete(id);
        }
    }

    async disconnectSession(id: string) {
        const sock = this.sessions.get(id);
        if (sock) {
            sock.end(undefined);
            this.sessions.delete(id);
            return { message: 'Session disconnected', id };
        }
        return { message: 'Session not active', id };
    }

    async getQRCode(id: string) {
        const sock = this.sessions.get(id);
        if (!sock) {
            throw new NotFoundException('Session not active');
        }
        return { qr: (sock as any).qr };
    }

    async getSessionStatus(id: string) {
        const sock = this.sessions.get(id);
        if (!sock) {
            return { status: 'inactive' };
        }
        // Basic check, can be improved
        return { status: 'active' }; // TODO: Check actual connection state
    }

    async logoutSession(id: string) {
        const sock = this.sessions.get(id);
        if (sock) {
            await sock.logout();
            this.sessions.delete(id);
            // Clean up auth files
            const authPath = path.resolve('sessions_auth', id);
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
            }
            return { message: 'Session logged out', id };
        }
        return { message: 'Session not active', id };
    }

    // Placeholder for other methods
    listWebhookEvents() {
        return ['connection.update', 'messages.upsert'];
    }

    pairPhone(id: string, phoneNumber: string) {
        // TODO: Implement pairing code logic
        return { message: 'Not implemented yet' };
    }
}
