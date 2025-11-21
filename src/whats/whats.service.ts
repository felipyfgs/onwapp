import { Injectable, Logger } from '@nestjs/common';

// Import WhatsApp client using dynamic import pattern for compatibility
const makeWASocketModule = require('whaileys');
const makeWASocket = makeWASocketModule.default || makeWASocketModule;
const { DisconnectReason, useMultiFileAuthState } = makeWASocketModule;

// Import Boom for error handling
const Boom = require('@hapi/boom').Boom;

// Type definitions
type WASocket = any; // Will be inferred from makeWASocket return type
type ConnectionState = {
    connection?: 'close' | 'open' | 'connecting';
    lastDisconnect?: {
        error: any;
        date: Date;
    };
    qr?: string;
};

@Injectable()
export class WhatsService {
    private readonly logger = new Logger(WhatsService.name);
    private sessions: Map<string, WASocket> = new Map();
    private qrCodes: Map<string, string> = new Map();
    private connectionStatus: Map<string, string> = new Map();

    /**
     * Create a new WhatsApp connection for a session
     */
    async createConnection(sessionId: string, authPath?: string): Promise<void> {
        try {
            // Use auth path or default to session-specific folder
            const authDir = authPath || `./auth_sessions/${sessionId}`;
            const { state, saveCreds } = await useMultiFileAuthState(authDir);

            // Create WhatsApp socket
            const sock = makeWASocket({
                auth: state,
                printQRInTerminal: false, // We'll handle QR ourselves
                logger: this.logger as any,
            });

            // Store session
            this.sessions.set(sessionId, sock);

            // Handle credentials update
            sock.ev.on('creds.update', saveCreds);

            // Handle connection updates
            sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
                this.handleConnectionUpdate(sessionId, update, sock);
            });

            // Handle incoming messages
            sock.ev.on('messages.upsert', async ({ messages }) => {
                this.handleIncomingMessages(sessionId, messages);
            });

            this.logger.log(`WhatsApp connection created for session: ${sessionId}`);
        } catch (error) {
            this.logger.error(`Failed to create connection for session ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Handle connection state updates
     */
    private handleConnectionUpdate(
        sessionId: string,
        update: Partial<ConnectionState>,
        sock: WASocket
    ): void {
        const { connection, lastDisconnect, qr } = update;

        // Handle QR code
        if (qr) {
            this.qrCodes.set(sessionId, qr);
            this.logger.log(`QR code generated for session: ${sessionId}`);
        }

        // Handle connection status
        if (connection) {
            this.connectionStatus.set(sessionId, connection);
            this.logger.log(`Connection status for ${sessionId}: ${connection}`);
        }

        // Handle disconnection
        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            this.logger.log(
                `Connection closed for ${sessionId} due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`
            );

            if (shouldReconnect) {
                // Reconnect automatically
                setTimeout(() => this.createConnection(sessionId), 3000);
            } else {
                // Clean up session
                this.sessions.delete(sessionId);
                this.qrCodes.delete(sessionId);
                this.connectionStatus.delete(sessionId);
            }
        }

        // Handle successful connection
        if (connection === 'open') {
            this.qrCodes.delete(sessionId); // Clear QR code on successful connection
            this.logger.log(`Connection opened for session: ${sessionId}`);
        }
    }

    /**
     * Handle incoming messages
     */
    private handleIncomingMessages(sessionId: string, messages: any[]): void {
        this.logger.debug(`Received ${messages.length} message(s) for session: ${sessionId}`);
        // TODO: Process messages (save to database, trigger webhooks, etc.)
    }

    /**
     * Get QR code for a session
     */
    getQRCode(sessionId: string): string | undefined {
        return this.qrCodes.get(sessionId);
    }

    /**
     * Get connection status for a session
     */
    getConnectionStatus(sessionId: string): string | undefined {
        return this.connectionStatus.get(sessionId);
    }

    /**
     * Check if session is connected
     */
    isConnected(sessionId: string): boolean {
        return this.connectionStatus.get(sessionId) === 'open';
    }

    /**
     * Get WhatsApp socket for a session
     */
    getSocket(sessionId: string): WASocket | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Send a text message
     */
    async sendMessage(sessionId: string, to: string, message: string): Promise<void> {
        const sock = this.sessions.get(sessionId);
        if (!sock) {
            throw new Error(`Session ${sessionId} not found`);
        }

        if (!this.isConnected(sessionId)) {
            throw new Error(`Session ${sessionId} is not connected`);
        }

        try {
            await sock.sendMessage(to, { text: message });
            this.logger.log(`Message sent to ${to} from session ${sessionId}`);
        } catch (error) {
            this.logger.error(`Failed to send message from session ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Disconnect a session
     */
    async disconnect(sessionId: string): Promise<void> {
        const sock = this.sessions.get(sessionId);
        if (sock) {
            await sock.logout();
            this.sessions.delete(sessionId);
            this.qrCodes.delete(sessionId);
            this.connectionStatus.delete(sessionId);
            this.logger.log(`Session ${sessionId} disconnected`);
        }
    }

    /**
     * Get all active sessions
     */
    getActiveSessions(): string[] {
        return Array.from(this.sessions.keys());
    }
}
