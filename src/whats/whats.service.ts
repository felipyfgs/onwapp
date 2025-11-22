import { Injectable, Logger } from '@nestjs/common';
import { WebhookService } from '@/modules/webhook/webhook.service';
import { PrismaService } from '@/prisma/prisma.service';
import { useDatabaseAuthState } from './auth-state';
import { createPinoLogger } from '@/logger/logger.service';
import { LoggerService } from '@/logger/logger.service';

// Import WhatsApp client using dynamic import pattern for compatibility
const makeWASocketModule = require('whaileys');
const makeWASocket = makeWASocketModule.default || makeWASocketModule;
const { DisconnectReason, useMultiFileAuthState, initAuthCreds } = makeWASocketModule;

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

    constructor(
        private readonly webhookService: WebhookService,
        private readonly prisma: PrismaService,
        private readonly loggerService: LoggerService
    ) { }

    /**
     * Validate if noiseKey has valid structure
     */
    private isValidNoiseKey(creds: any): boolean {
        return !!(
            creds?.noiseKey?.public &&
            creds?.noiseKey?.private &&
            Buffer.isBuffer(creds.noiseKey.public) &&
            Buffer.isBuffer(creds.noiseKey.private)
        );
    }

    /**
     * Import missing app-state-sync-key from old session directory
     */
    private async migrateAppStateKey(sessionId: string): Promise<void> {
        const isVerbose = process.env.LOG_VERBOSE === 'true';
        
        try {
            if (isVerbose) {
                this.logger.debug(`[MIGRATE] Starting app state key migration for session ${sessionId}`);
            }
            
            // Read:: old app-state-sync-key-AAAAAFWW.json file
            const fs = require('fs').promises;
            const path = require('path');
            
            const oldSessionPath = path.join(process.cwd(), 'auth_sessions', '833caddf-1db5-4423-843f-e1388e70da95');
            const keyFilePath = path.join(oldSessionPath, 'app-state-sync-key-AAAAAFWW.json');
            
            if (isVerbose) {
                this.logger.debug(`[MIGRATE] Checking for old key file: ${keyFilePath}`);
            }
            
            try {
                const keyData = await fs.readFile(keyFilePath, 'utf8');
                const parsedKey = JSON.parse(keyData);
                
                if (isVerbose) {
                    this.logger.debug(`[MIGRATE] Found old key data:`, parsedKey);
                }
                
                // Save:: key to:: new session using:: auth state
                const dbAuthState = await useDatabaseAuthState(this.prisma, sessionId, this.loggerService);
                
                // Import:: key into:: keys store
                await dbAuthState.state.keys.set({
                    'app-state-sync-key': {
                        'AAAAAFWW': parsedKey
                    }
                });
                
                this.logger.log(`[MIGRATE] ✅ Successfully migrated app-state-sync-key-AAAAAFWW for session ${sessionId}`);
            } catch (fileError) {
                this.logger.debug(`[MIGRATE] Old key file not found or error reading:`, fileError.message);
                // This is normal for new sessions
            }
        } catch (error) {
            this.logger.error(`[MIGRATE] ❌ Failed to migrate app state key for session ${sessionId}:`, error);
        }
    }

    /**
     * Create a new WhatsApp connection for a session
     */
    async createConnection(
        sessionId: string,
        authState?: any,
        saveCredsCallback?: (creds: any) => Promise<void>
    ): Promise<void> {
        const isVerbose = process.env.LOG_VERBOSE === 'true';
        
        try {
            // Get auth state from database or use provided state
            const dbAuthState = authState || await useDatabaseAuthState(this.prisma, sessionId, this.loggerService);
            const state = dbAuthState.state || { creds: {}, keys: {} };
            const saveCreds = dbAuthState.saveCreds || saveCredsCallback || (() => Promise.resolve());

            // Verificar se há credenciais válidas
            const hasValidCreds = this.isValidNoiseKey(state.creds);
            
            // Store reference to state for credential merging
            const authStateRef = state;

            if (isVerbose) {
                this.logger.debug(`[CREATE_CONN] Creating connection for session ${sessionId}:`);
                this.logger.debug(`[CREATE_CONN] Has creds object: ${!!state.creds}`);
                this.logger.debug(`[CREATE_CONN] Has keys object: ${!!state.keys}`);
                this.logger.debug(`[CREATE_CONN] Creds keys: ${state.creds ? Object.keys(state.creds).join(', ') : 'none'}`);
                this.logger.debug(`[CREATE_CONN] Has valid noiseKey: ${hasValidCreds}`);
                if (state.creds?.noiseKey) {
                    this.logger.debug(`[CREATE_CONN] noiseKey.public: type=${state.creds.noiseKey.public?.constructor?.name}, length=${state.creds.noiseKey.public?.length}, isBuffer=${Buffer.isBuffer(state.creds.noiseKey.public)}`);
                    this.logger.debug(`[CREATE_CONN] noiseKey.private: type=${state.creds.noiseKey.private?.constructor?.name}, length=${state.creds.noiseKey.private?.length}, isBuffer=${Buffer.isBuffer(state.creds.noiseKey.private)}`);
                }
                this.logger.debug(`[CREATE_CONN] Other creds: me=${!!state.creds?.me}, account=${!!state.creds?.account}, platform=${!!state.creds?.platform}`);
            }

            // Create WhatsApp socket
            let sock: WASocket;
            
            if (!hasValidCreds) {
                // Nova sessão ou credenciais inválidas - criar auth state vazio
                this.logger.log(`Creating new session ${sessionId} - will generate QR code`);
                
                // Criar credenciais vazias iniciais usando função da biblioteca
                const emptyCreds = initAuthCreds ? initAuthCreds() : {};
                
                // 🎯 CRITICAL: Save the initial credentials (including noiseKey) immediately
                if (isVerbose) {
                    this.logger.debug(`[INIT_CREDS] Saving initial credentials with noiseKey`);
                    this.logger.debug(`[INIT_CREDS] Initial creds keys: ${Object.keys(emptyCreds).join(', ')}`);
                    this.logger.debug(`[INIT_CREDS] Has noiseKey: ${!!emptyCreds.noiseKey}`);
                    if (emptyCreds.noiseKey) {
                        this.logger.debug(`[INIT_CREDS] noiseKey.public length: ${emptyCreds.noiseKey.public?.length}`);
                        this.logger.debug(`[INIT_CREDS] noiseKey.private length: ${emptyCreds.noiseKey.private?.length}`);
                    }
                }
                
                // Save immediately so we have the noiseKey
                await saveCreds(emptyCreds);
                if (isVerbose) {
                    this.logger.debug(`[INIT_CREDS] ✅ Initial credentials saved`);
                }
                
                const emptyAuthState = {
                    creds: emptyCreds,
                    keys: state.keys
                };
                
                sock = makeWASocket({
                    auth: emptyAuthState,
                    printQRInTerminal: true,
                    logger: createPinoLogger(this.logger),
                });
            } else {
                // Sessão existente com credenciais válidas - reconectar
                this.logger.log(`Reconnecting existing session ${sessionId} with stored credentials`);
                sock = makeWASocket({
                    auth: state,
                    printQRInTerminal: true,
                    logger: createPinoLogger(this.logger),
                });
            }
            
            // Store session
            this.sessions.set(sessionId, sock);

            // Handle credentials update
            sock.ev.on('creds.update', async (credsUpdate) => {
                if (isVerbose) {
                    this.logger.debug(`[CREDS_UPDATE] 🔥 EVENT START - Credentials update event triggered for session ${sessionId}`);
                    this.logger.debug(`[CREDS_UPDATE] Updated creds keys: ${Object.keys(credsUpdate).join(', ')}`);
                    this.logger.debug(`[CREDS_UPDATE] Has noiseKey in update: ${!!credsUpdate.noiseKey}`);
                    this.logger.debug(`[CREDS_UPDATE] Current authStateRef.creds keys before merge: ${Object.keys(authStateRef.creds).join(', ')}`);
                    this.logger.debug(`[CREDS_UPDATE] Current authStateRef.creds has noiseKey before merge: ${!!authStateRef.creds.noiseKey}`);
                }
                
                // 🎯 CRITICAL: Merge updates into the auth state reference
                Object.assign(authStateRef.creds, credsUpdate);
                
                if (isVerbose) {
                    this.logger.debug(`[CREDS_UPDATE] Current complete creds keys after merge: ${Object.keys(authStateRef.creds).join(', ')}`);
                    this.logger.debug(`[CREDS_UPDATE] Has noiseKey in complete state after merge: ${!!authStateRef.creds.noiseKey}`);
                    
                    if (authStateRef.creds.noiseKey) {
                        this.logger.debug(`[CREDS_UPDATE] noiseKey.public type: ${authStateRef.creds.noiseKey.public?.constructor?.name}, length: ${authStateRef.creds.noiseKey.public?.length}`);
                        this.logger.debug(`[CREDS_UPDATE] noiseKey.private type: ${authStateRef.creds.noiseKey.private?.constructor?.name}, length: ${authStateRef.creds.noiseKey.private?.length}`);
                    }
                    
                    // Save the complete merged credentials
                    this.logger.debug(`[CREDS_UPDATE] 🔥 SAVING - About to save credentials`);
                }
                await saveCreds(authStateRef.creds);
                if (isVerbose) {
                    this.logger.debug(`[CREDS_UPDATE] 🔥 EVENT END - Credentials saved successfully`);
                }
            });

            // Handle connection updates
            sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
                this.handleConnectionUpdate(sessionId, update, sock, saveCreds);
            });

            // Handle incoming messages
            sock.ev.on('messages.upsert', async ({ messages }) => {
                this.handleIncomingMessages(sessionId, messages);
            });

            // Remove pairing.success handler since we're now tracking state correctly

            // Handle message updates
            sock.ev.on('messages.update', async (updates) => {
                this.logger.debug(`Message updates for session ${sessionId}:`, updates.length);
                await this.webhookService.triggerMessageUpdate(sessionId, updates);
            });

            // Handle message receipt updates
            sock.ev.on('message-receipt.update', async (receipts) => {
                this.logger.debug(`Message receipts for session ${sessionId}:`, receipts.length);
                await this.webhookService.triggerMessageReceipt(sessionId, receipts);
            });

            // Handle presence updates
            sock.ev.on('presence.update', async (presences) => {
                this.logger.debug(`Presence updates for session ${sessionId}`);
                await this.webhookService.triggerPresenceUpdate(sessionId, [presences]);
            });

            // Handle group updates
            sock.ev.on('groups.upsert', async (groups) => {
                this.logger.debug(`Groups upsert for session ${sessionId}:`, groups.length);
                await this.webhookService.triggerGroupUpdate(sessionId, groups);
            });

            sock.ev.on('groups.update', async (groups) => {
                this.logger.debug(`Groups update for session ${sessionId}:`, groups.length);
                await this.webhookService.triggerGroupUpdate(sessionId, groups);
            });

            // Handle contact updates
            sock.ev.on('contacts.upsert', async (contacts) => {
                this.logger.debug(`Contacts upsert for session ${sessionId}:`, contacts.length);
                await this.webhookService.triggerContactUpdate(sessionId, contacts);
            });

            sock.ev.on('contacts.update', async (contacts) => {
                this.logger.debug(`Contacts update for session ${sessionId}:`, contacts.length);
                await this.webhookService.triggerContactUpdate(sessionId, contacts);
            });

            // Handle chat updates
            sock.ev.on('chats.upsert', async (chats) => {
                this.logger.debug(`Chats upsert for session ${sessionId}:`, chats.length);
                await this.webhookService.triggerChatUpdate(sessionId, chats);
            });

            sock.ev.on('chats.update', async (chats) => {
                this.logger.debug(`Chats update for session ${sessionId}:`, chats.length);
                await this.webhookService.triggerChatUpdate(sessionId, chats);
            });

            this.logger.log(`WhatsApp connection created for session: ${sessionId}`);
        } catch (error) {
            this.logger.error(`Failed to create connection for session ${sessionId}:`, error);
            
            // Limpar estado da sessão em caso de erro
            this.sessions.delete(sessionId);
            this.qrCodes.delete(sessionId);
            this.connectionStatus.delete(sessionId);
            
            // Se for erro de credenciais corrompidas, limpar do banco
            if (error instanceof TypeError && error.message.includes('noiseKey')) {
                this.logger.warn(`Corrupted credentials detected for session ${sessionId}, clearing from database`);
                try {
                    // sessionId is not unique — delete all auth state records for this session
                    await this.prisma.authState.deleteMany({
                        where: { sessionId }
                    }).catch(() => {
                        // Ignorar se não existir
                    });
                } catch (cleanupError) {
                    this.logger.error(`Failed to cleanup corrupted credentials:`, cleanupError);
                }
            }
            
            throw error;
        }
    }

    /**
     * Handle connection state updates
     */
    private async handleConnectionUpdate(
        sessionId: string,
        update: Partial<ConnectionState>,
        sock: WASocket,
        saveCreds: (creds: any) => Promise<void>
    ): Promise<void> {
        const isVerbose = process.env.LOG_VERBOSE === 'true';
        const { connection, lastDisconnect, qr } = update;

        // Handle QR code
        if (qr) {
            this.qrCodes.set(sessionId, qr);
            this.logger.log(`QR code generated for session: ${sessionId}`);
            
            // Trigger webhook for QR code
            await this.webhookService.triggerConnectionUpdate(sessionId, 'connecting', qr);
        }

        // Handle connection status
        if (connection) {
            this.connectionStatus.set(sessionId, connection);
            this.logger.log(`Connection status for ${sessionId}: ${connection}`);
            
            // Trigger webhook for connection status change
            await this.webhookService.triggerConnectionUpdate(sessionId, connection);
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

        // Handle successful connection - SAVE COMPLETE CREDENTIALS
        if (connection === 'open') {
            this.qrCodes.delete(sessionId); // Clear QR code on successful connection
            this.logger.log(`Connection opened for session: ${sessionId}`);
            
            // 🎯 CRITICAL: Save complete credentials when connection opens
            if (isVerbose) {
                this.logger.debug(`[CONN_OPEN] Saving complete credentials for session ${sessionId}`);
            }
            
            try {
                // Get the complete auth state from the socket
                const authState = sock.authState();
                if (authState && authState.creds) {
                    if (isVerbose) {
                        this.logger.debug(`[CONN_OPEN] Complete auth state keys: ${Object.keys(authState.creds).join(', ')}`);
                        this.logger.debug(`[CONN_OPEN] Has noiseKey: ${!!authState.creds.noiseKey}`);
                        if (authState.creds.noiseKey) {
                            this.logger.debug(`[CONN_OPEN] noiseKey.public type: ${authState.creds.noiseKey.public?.constructor?.name}, length: ${authState.creds.noiseKey.public?.length}`);
                            this.logger.debug(`[CONN_OPEN] noiseKey.private type: ${authState.creds.noiseKey.private?.constructor?.name}, length: ${authState.creds.noiseKey.private?.length}`);
                        }
                        this.logger.debug(`[CONN_OPEN] Other keys: signedIdentityKey=${!!authState.creds.signedIdentityKey}, signedPreKey=${!!authState.creds.signedPreKey}, advSecretKey=${!!authState.creds.advSecretKey}`);
                    }
                    
                    // Save the complete credentials
                    await saveCreds(authState.creds);
                    if (isVerbose) {
                        this.logger.debug(`[CONN_OPEN] ✅ Complete credentials saved for session ${sessionId}`);
                        
                        // 🎯 BONUS: Also save all keys from the keys store
                        this.logger.debug(`[CONN_OPEN] Saving additional keys from keys store...`);
                    }
                    try {
                        // Get all keys from the store and save them
                        const keysStore = authState.keys;
                        if (keysStore && typeof keysStore.get === 'function') {
                            // Try to get common key types that should be saved
                            const keyTypes = ['app-state-sync-key', 'app-state-sync-version', 'pre-key', 'sender-key'];
                            
                            for (const keyType of keyTypes) {
                                try {
                                    // This is a workaround to access keys - we'll trigger the save mechanism
                                    if (isVerbose) {
                                        this.logger.debug(`[CONN_OPEN] Checking for key type: ${keyType}`);
                                    }
                                } catch (keyError) {
                                    if (isVerbose) {
                                        this.logger.debug(`[CONN_OPEN] Could not check key type ${keyType}:`, keyError);
                                    }
                                }
                            }
                        }
                        if (isVerbose) {
                            this.logger.debug(`[CONN_OPEN] ✅ Keys store processed for session ${sessionId}`);
                        }
                    } catch (keysError) {
                        this.logger.error(`[CONN_OPEN] ❌ Failed to process keys store for session ${sessionId}:`, keysError);
                    }
                    
                    // 🎯 VERIFICATION: Verify what was actually saved
                    if (isVerbose) {
                        this.logger.debug(`[CONN_OPEN] Verifying saved credentials...`);
                    }
                    setTimeout(async () => {
                        try {
                            const dbState = await useDatabaseAuthState(this.prisma, sessionId, this.loggerService);
                            const loadedState = await dbState.state;
                            
                            if (isVerbose) {
                                this.logger.debug(`[CONN_OPEN] VERIFICATION - Loaded creds keys: ${Object.keys(loadedState.creds).join(', ')}`);
                                this.logger.debug(`[CONN_OPEN] VERIFICATION - Has noiseKey: ${!!loadedState.creds.noiseKey}`);
                                if (loadedState.creds.noiseKey) {
                                    this.logger.debug(`[CONN_OPEN] VERIFICATION - noiseKey.public isBuffer: ${Buffer.isBuffer(loadedState.creds.noiseKey.public)}`);
                                    this.logger.debug(`[CONN_OPEN] VERIFICATION - noiseKey.private isBuffer: ${Buffer.isBuffer(loadedState.creds.noiseKey.private)}`);
                                }
                                this.logger.debug(`[CONN_OPEN] VERIFICATION - Keys count: ${Object.keys(loadedState.keys).length}`);
                            }
                            
                            if (this.isValidNoiseKey(loadedState.creds)) {
                                this.logger.log(`[CONN_OPEN] ✅ VERIFICATION PASSED - All credentials saved correctly for session ${sessionId}`);
                            } else {
                                this.logger.error(`[CONN_OPEN] ❌ VERIFICATION FAILED - Invalid noiseKey for session ${sessionId}`);
                            }
                        } catch (verifyError) {
                            this.logger.error(`[CONN_OPEN] ❌ Verification failed for session ${sessionId}:`, verifyError);
                        }
                    }, 1000); // Wait 1 second for async save to complete
                } else {
                    this.logger.warn(`[CONN_OPEN] No auth state found for session ${sessionId}`);
                }
            } catch (error) {
                this.logger.error(`[CONN_OPEN] ❌ Failed to save complete credentials for session ${sessionId}:`, error);
            }
        }
    }

    /**
     * Handle incoming messages
     */
    private async handleIncomingMessages(sessionId: string, messages: any[]): Promise<void> {
        this.logger.debug(`Received ${messages.length} message(s) for session: ${sessionId}`);
        
        // Trigger webhook for messages
        await this.webhookService.triggerMessageUpsert(sessionId, messages);
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
