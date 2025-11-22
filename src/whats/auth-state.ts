import { PrismaService } from '@/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { LoggerService } from '@/logger/logger.service';
import { proto } from 'whaileys';

type AuthenticationCreds = any;
type SignalDataTypeMap = any;

/**
 * Database-backed authentication state for WhatsApp sessions
 * Implements complete auth state storage compatible with Baileys/Whaileys
 * Similar to Evolution API implementation
 */
export class DatabaseAuthState {
    private readonly logger: any;

    constructor(
        private prisma: PrismaService,
        private sessionId: string,
        logger?: any
    ) {
        this.logger = logger || new Logger(DatabaseAuthState.name);
    }

    /**
     * Get authentication state from database
     */
    async getState(): Promise<{ creds: any; keys: any }> {
        const isVerbose = process.env.LOG_VERBOSE === 'true';
        
        if (isVerbose) {
            this.logger.debug(`[LOAD] Starting to load state for session ${this.sessionId}`);
        }
        
        // Find the most recent AuthState record for this session (sessionId is no longer unique)
        const authState = await this.prisma.authState.findFirst({
            where: { sessionId: this.sessionId },
            orderBy: { updatedAt: 'desc' }
        });
        const authStateAny = authState as any;

        if (!authState) {
            if (isVerbose) {
                this.logger.debug(`[LOAD] No auth state found in DB for session ${this.sessionId}`);
            }
            return {
                creds: {},
                keys: {}
            };
        }

        if (isVerbose) {
            this.logger.debug(`[LOAD] Auth state found in DB`);
            this.logger.debug(`[LOAD] DB data keys: ${Object.keys((authStateAny?.data) || {}).join(', ')}`);
        }

        // 🎯 DEBUG: Verificar todos os registros AuthState para esta sessão
        if (isVerbose) {
            try {
                const allAuthStates = await this.prisma.authState.findMany({
                    where: { sessionId: this.sessionId }
                });
                this.logger.debug(`[LOAD] Found ${allAuthStates.length} total AuthState records for session ${this.sessionId}`);
                
                for (const record of allAuthStates) {
                    this.logger.debug(`[LOAD] Record - keyId: ${(record as any).keyId}, data keys: ${Object.keys((record as any).data as any).join(', ')}`);
                    if ((record as any).data && typeof (record as any).data === 'object') {
                        const recordData = this.bufferFromJSON((record as any).data);
                        const recordCreds = recordData.creds || {};
                        this.logger.debug(`[LOAD] Record - creds keys: ${Object.keys(recordCreds).join(', ')}`);
                        this.logger.debug(`[LOAD] Record - has noiseKey: ${!!recordCreds.noiseKey}`);
                    }
                }
            } catch (error) {
                this.logger.debug(`[LOAD] Error checking all AuthState records:`, error.message);
            }
        }

        // Deserializar Buffers do campo data unificado
        const deserializedData = this.bufferFromJSON((authState as any).data || {});

        // Separar creds e keys do campo data unificado
        let deserializedCreds = deserializedData.creds || {};
        const deserializedKeys = deserializedData.keys || {};

        // 🎯 CRITICAL: Reconstruir chaves individuais dos registros separados
        try {
            const allAuthStates = await this.prisma.authState.findMany({
                where: { sessionId: this.sessionId }
            });

            if (isVerbose) {
                this.logger.debug(`[LOAD] 🔍 RECONSTRUCTING - Starting individual key reconstruction`);
            }
            
            for (const record of allAuthStates) {
                if ((record as any).data && typeof (record as any).data === 'object') {
                    const recordData = this.bufferFromJSON((record as any).data);
                    const recordCreds = recordData.creds || {};
                    
                    // Mesclar chaves individuais nas credenciais principais
                    for (const [keyName, keyValue] of Object.entries(recordCreds)) {
                        if (!deserializedCreds[keyName]) {
                            deserializedCreds[keyName] = keyValue;
                            if (isVerbose) {
                                this.logger.debug(`[LOAD] 🔍 RECONSTRUCTED - Added key: ${keyName}`);
                            }
                        } else {
                            if (isVerbose) {
                                this.logger.debug(`[LOAD] 🔍 SKIPPED - Key already exists: ${keyName}`);
                            }
                        }
                    }
                }
            }
            
            if (isVerbose) {
                this.logger.debug(`[LOAD] 🔍 RECONSTRUCTION COMPLETE - Final creds keys: ${Object.keys(deserializedCreds).join(', ')}`);
            }
        } catch (error) {
            this.logger.error(`[LOAD] ❌ Failed to reconstruct individual keys:`, error);
        }

        if (isVerbose) {
            this.logger.debug(`[LOAD] Deserialized creds keys: ${Object.keys(deserializedCreds).join(', ')}`);
            this.logger.debug(`[LOAD] Has noiseKey after deserialize: ${!!deserializedCreds.noiseKey}`);
            if (deserializedCreds.noiseKey) {
                this.logger.debug(`[LOAD] noiseKey.public type: ${deserializedCreds.noiseKey.public?.constructor?.name}, length: ${deserializedCreds.noiseKey.public?.length}`);
                this.logger.debug(`[LOAD] noiseKey.private type: ${deserializedCreds.noiseKey.private?.constructor?.name}, length: ${deserializedCreds.noiseKey.private?.length}`);
                this.logger.debug(`[LOAD] noiseKey.public isBuffer: ${Buffer.isBuffer(deserializedCreds.noiseKey.public)}`);
                this.logger.debug(`[LOAD] noiseKey.private isBuffer: ${Buffer.isBuffer(deserializedCreds.noiseKey.private)}`);
            }
        }

        return {
            creds: deserializedCreds,
            keys: deserializedKeys
        };
    }

    /**
     * Save credentials to database
     */
    async saveCreds(creds: any): Promise<void> {
        const isVerbose = process.env.LOG_VERBOSE === 'true';
        
        try {
            if (isVerbose) {
                this.logger.debug(`[SAVE] Starting to save credentials for session ${this.sessionId}`);
                this.logger.debug(`[SAVE] Incoming creds keys: ${Object.keys(creds).join(', ')}`);
                this.logger.debug(`[SAVE] Has noiseKey: ${!!creds.noiseKey}`);
                if (creds.noiseKey) {
                    this.logger.debug(`[SAVE] noiseKey.public type: ${creds.noiseKey.public?.constructor?.name}, length: ${creds.noiseKey.public?.length}`);
                    this.logger.debug(`[SAVE] noiseKey.private type: ${creds.noiseKey.private?.constructor?.name}, length: ${creds.noiseKey.private?.length}`);
                }
            }

            const authState = await this.prisma.authState.findFirst({
                where: { sessionId: this.sessionId },
                orderBy: { updatedAt: 'desc' }
            });
            const authStateAny = authState as any;

            if (isVerbose) {
                this.logger.debug(`[SAVE] Current DB state exists: ${!!authState}`);
            }
            
            // Obter estado atual deserializado
            let currentData = { creds: {}, keys: {} };
            if ((authState as any)?.data && typeof (authState as any).data === 'object') {
                currentData = this.bufferFromJSON((authState as any).data);
                if (isVerbose) {
                    this.logger.debug(`[SAVE] Current DB data keys: ${Object.keys(currentData).join(', ')}`);
                }
            }

            // Garantir que currentCreds seja um objeto
            const currentCreds = currentData.creds || {};
            const currentKeys = currentData.keys || {};
            
            // Extrair chaves individuais das credenciais e salvar separadamente
            const individualKeys: Record<string, any> = {};
            const keysToExtract = ['noiseKey', 'signedIdentityKey', 'signedPreKey', 'advSecretKey', 'pairingEphemeralKeyPair'];
            
            for (const key of keysToExtract) {
                if (creds[key]) {
                    individualKeys[key] = creds[key];
                    if (isVerbose) {
                        this.logger.debug(`[SAVE] Extracting individual key: ${key}`);
                    }
                }
            }
            
            // Salvar chaves individuais na tabela AuthState
            if (Object.keys(individualKeys).length > 0) {
                await this.saveIndividualKeys(individualKeys);
            }
            
            // Mesclar credenciais existentes com as novas (sem as chaves individuais extraídas)
            const credsForMainTable = { ...creds };
            delete credsForMainTable.noiseKey;
            delete credsForMainTable.signedIdentityKey;
            delete credsForMainTable.signedPreKey;
            delete credsForMainTable.advSecretKey;
            delete credsForMainTable.pairingEphemeralKeyPair;

            const updatedCreds = {
                ...currentCreds,
                ...credsForMainTable
            };

            // Combinar tudo no campo data unificado
            const unifiedData = {
                creds: updatedCreds,
                keys: currentKeys
            };

            if (isVerbose) {
                this.logger.debug(`[SAVE] Final unified data structure ready`);
            }

            // sessionId is not unique anymore — try to find an existing record and update by id, otherwise create
            const existingRecord = await this.prisma.authState.findFirst({
                where: { sessionId: this.sessionId },
                orderBy: { updatedAt: 'desc' }
            });
            if (existingRecord) {
                await this.prisma.authState.update({
                    where: { id: (existingRecord as any).id },
                    data: { data: unifiedData } as any
                });
            } else {
                await this.prisma.authState.create({
                    data: {
                        sessionId: this.sessionId,
                        data: unifiedData
                    } as any
                });
            }

            if (isVerbose) {
                this.logger.debug(`[SAVE] ✅ Credentials saved successfully for session ${this.sessionId}`);
            }
        } catch (error) {
            this.logger.error(`[SAVE] ❌ Failed to save credentials for session ${this.sessionId}:`, error);
        }
    }

    /**
     * Save individual keys to AuthState table
     */
    private async saveIndividualKeys(keys: Record<string, any>): Promise<void> {
        try {
            this.logger.debug(`[SAVE_KEYS] Saving ${Object.keys(keys).length} individual keys for session ${this.sessionId}`);
            
            for (const [keyName, keyData] of Object.entries(keys)) {
                // 🎯 FIX: Usar create em vez de upsert para evitar conflitos
                // Create a dedicated AuthState record for this individual key
                await this.prisma.authState.create({
                    data: {
                        sessionId: this.sessionId,
                        keyId: keyName,
                        data: {
                            creds: {
                                [keyName]: keyData
                            },
                            keys: {}
                        }
                    }
                } as any);
                this.logger.debug(`[SAVE_KEYS] ✅ Saved individual key: ${keyName}`);
            }
        } catch (error) {
            this.logger.error(`[SAVE_KEYS] ❌ Failed to save individual keys for session ${this.sessionId}:`, error);
        }
    }

    /**
     * Get a key from database
     */
    async get(type: string, ids: string[]): Promise<any> {
        const isVerbose = process.env.LOG_VERBOSE === 'true';
        if (isVerbose) {
            this.logger.debug(`[GET_KEYS] Type: ${type}, IDs: ${ids.join(', ')}`);
            this.logger.debug(`[GET_KEYS] 🔍 SEARCHING - Looking for individual keys by keyId`);
        }

        const data: any = {};

        try {
            const authStates = await this.prisma.authState.findMany({
                where: { sessionId: this.sessionId }
            });

            if (isVerbose) {
                this.logger.debug(`[GET_KEYS] 🔍 SEARCHING - Found ${authStates.length} total records for session ${this.sessionId}`);
            }

            for (const authStateRecord of authStates) {
                if (isVerbose) {
                    this.logger.debug(`[GET_KEYS] 🔍 SEARCHING - Checking record with keyId: ${(authStateRecord as any).keyId}`);
                }

                if ((authStateRecord as any).data && typeof (authStateRecord as any).data === 'object') {
                    const authData = this.bufferFromJSON((authStateRecord as any).data);
                    const creds = authData.creds || {};

                    if (isVerbose) {
                        this.logger.debug(`[GET_KEYS] 🔍 SEARCHING - Record ${(authStateRecord as any).keyId} has creds keys: ${Object.keys(creds).join(', ')}`);
                    }

                    if ((authStateRecord as any).keyId && ids.includes((authStateRecord as any).keyId)) {
                        data[(authStateRecord as any).keyId] = creds[(authStateRecord as any).keyId];
                        if (isVerbose) {
                            this.logger.debug(`[GET_KEYS] ✅ FOUND - Individual key ${(authStateRecord as any).keyId} found by keyId match`);
                        }
                    }

                    for (const keyName of Object.keys(creds)) {
                        if (ids.includes(keyName) && !data[keyName]) {
                            data[keyName] = creds[keyName];
                            if (isVerbose) {
                                this.logger.debug(`[GET_KEYS] ✅ FOUND - Individual key ${keyName} found in creds`);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.debug(`[GET_KEYS] Error searching AuthState records:`, error.message);
        }

        // Se não encontrou nas chaves individuais, buscar no campo keys tradicional
        if (Object.keys(data).length < ids.length) {
            this.logger.debug(`[GET_KEYS] Some keys not found in individual records, checking traditional keys field`);
            
            const currentState = await this.getState();
            const keys = currentState.keys || {};

            for (const id of ids) {
                if (!data[id]) { // Só buscar se não encontrou ainda
                    let value = keys[`${type}-${id}`];

                    if (value) {
                        if (typeof value === 'object' && value.data) {
                            // Reconstruir Buffer se necessário
                            value = this.bufferFromJSON(value);
                        }
                        data[id] = value;
                        this.logger.debug(`[GET_KEYS] ✅ Key ${type}-${id} loaded successfully`);
                    } else {
                        this.logger.warn(`[GET_KEYS] ⚠️ Key ${type}-${id} not found in database`);
                    }
                }
            }
        }

        this.logger.debug(`[GET_KEYS] 🔍 FINAL RESULT - Returning ${Object.keys(data).length} keys out of ${ids.length} requested: ${Object.keys(data).join(', ')}`);
        return data;
    }

    /**
     * Set a key in database
     */
    async set(data: any): Promise<void> {
        try {
            this.logger.debug(`[SET_KEYS] Starting to save keys for session ${this.sessionId}`);
            this.logger.debug(`[SET_KEYS] Categories: ${Object.keys(data).join(', ')}`);
            
            const currentState = await this.getState();
            const keys = { ...currentState.keys };

            let keysAdded = 0;
            let keysRemoved = 0;

            for (const category in data) {
                for (const id in data[category]) {
                    const value = data[category][id];
                    const key = `${category}-${id}`;
                    
                    if (value === null) {
                        delete keys[key];
                        keysRemoved++;
                    } else {
                        // Serializar Buffers adequadamente
                        keys[key] = this.serializeBuffer(value);
                        keysAdded++;
                    }
                }
            }

            this.logger.debug(`[SET_KEYS] Keys added: ${keysAdded}, removed: ${keysRemoved}`);
            this.logger.debug(`[SET_KEYS] Total keys in storage: ${Object.keys(keys).length}`);

            // Combinar tudo no campo data unificado
            const unifiedData = {
                creds: currentState.creds,
                keys: keys
            };

            // Update the most recent unified record for this session, or create a new one
            // Find the most recent unified record (keyId == null). Prisma WhereInput may not accept null checks consistently across generated types,
            // so fetch recent records and pick the one with keyId == null.
            const existingUnifiedCandidates = await this.prisma.authState.findMany({
                where: { sessionId: this.sessionId },
                orderBy: { updatedAt: 'desc' },
                take: 10
            });
            const existingUnified = existingUnifiedCandidates.find(r => (r as any).keyId == null);
            if (existingUnified) {
                await this.prisma.authState.update({
                    where: { id: (existingUnified as any).id },
                    data: { data: unifiedData } as any
                });
            } else {
                await this.prisma.authState.create({
                    data: {
                        sessionId: this.sessionId,
                        data: unifiedData
                    } as any
                });
            }

            this.logger.debug(`[SET_KEYS] ✅ Keys saved successfully for session ${this.sessionId}`);
        } catch (error) {
            this.logger.error(`[SET_KEYS] ❌ Failed to save keys for session ${this.sessionId}:`, error);
        }
    }

    /**
     * Serialize Buffer objects and Protobuf objects to JSON-compatible format
     */
    private serializeBuffer(obj: any): any {
        // Handle null/undefined
        if (obj === null || obj === undefined) {
            return obj;
        }

        // Handle Buffer
        if (Buffer.isBuffer(obj)) {
            return {
                type: 'Buffer',
                data: Array.from(obj)
            };
        }

        // Handle Uint8Array
        if (obj instanceof Uint8Array) {
            return {
                type: 'Buffer',
                data: Array.from(obj)
            };
        }

        // Handle Arrays
        if (Array.isArray(obj)) {
            return obj.map(item => this.serializeBuffer(item));
        }

        // Handle objects (including Protobuf objects)
        if (obj && typeof obj === 'object') {
            // Se o objeto tem toJSON mas não é uma função segura (Protobuf), converter para plain object
            if (typeof obj.toJSON === 'function') {
                try {
                    // Tentar usar toJSON
                    const jsonResult = obj.toJSON();
                    // Recursivamente serializar o resultado
                    return this.serializeBuffer(jsonResult);
                } catch (error) {
                    // Se toJSON falhar (Protobuf), iterar pelas propriedades manualmente
                    this.logger.debug(`toJSON failed for object, using manual serialization`);
                }
            }

            // Serialização manual de propriedades
            const serialized: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    serialized[key] = this.serializeBuffer(obj[key]);
                }
            }
            return serialized;
        }

        // Primitivos
        return obj;
    }

    /**
     * Reconstruct Buffer from JSON format
     */
    private bufferFromJSON(obj: any): any {
        if (obj && obj.type === 'Buffer' && Array.isArray(obj.data)) {
            return Buffer.from(obj.data);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.bufferFromJSON(item));
        }

        if (obj && typeof obj === 'object') {
            const reconstructed: any = {};
            for (const key in obj) {
                reconstructed[key] = this.bufferFromJSON(obj[key]);
            }
            return reconstructed;
        }

        return obj;
    }
}

/**
 * Create database-backed auth state compatible with whaileys
 */
export async function useDatabaseAuthState(
    prisma: PrismaService,
    sessionId: string,
    logger?: any
) {
    const authState = new DatabaseAuthState(prisma, sessionId, logger);
    const storedState = await authState.getState();

    return {
        state: {
            creds: storedState.creds,
            keys: {
                get: async (type: string, ids: string[]) => {
                    return await authState.get(type, ids);
                },
                set: async (data: any) => {
                    await authState.set(data);
                }
            }
        },
        saveCreds: async (creds: any) => {
            await authState.saveCreds(creds);
        }
    };
}