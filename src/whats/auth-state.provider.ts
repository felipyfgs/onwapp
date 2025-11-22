import { PrismaService } from '../prisma/prisma.service';
import {
    AuthenticationCreds,
    AuthenticationState,
    BufferJSON,
    initAuthCreds,
    proto,
    SignalDataTypeMap,
} from 'whaileys';

/**
 * Custom Auth State Provider para integração com Prisma
 * Substitui o useMultiFileAuthState do whaileys
 * Armazena credenciais na tabela AuthState ao invés de arquivos
 */
export async function useDatabaseAuthState(
    prisma: PrismaService,
    sessionId: string,
): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}> {
    // Buscar authState existente do banco ou criar novo
    let authState = await prisma.authState.findUnique({
        where: { sessionId },
    });

    // Inicializar credenciais se primeira vez
    let creds: AuthenticationCreds;
    let keys: any = {};

    if (authState) {
        // Carregar credenciais existentes do banco
        creds = authState.creds as unknown as AuthenticationCreds;
        keys = authState.keys || {};
    } else {
        // Primeira vez - inicializar credenciais vazias
        creds = initAuthCreds();
        keys = {};
    }

    // Implementar SignalKeyStore compatível com whaileys
    const keyStore: any = {
        get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
            const data: any = {};
            for (const id of ids) {
                let value = keys[`${type}-${id}`];
                if (type === 'app-state-sync-key' && value) {
                    value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }
                data[id] = value;
            }
            return data;
        },

        set: async (data: any) => {
            for (const category in data) {
                for (const id in data[category]) {
                    const value = data[category][id];
                    const key = `${category}-${id}`;
                    if (value) {
                        keys[key] = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
                    } else {
                        delete keys[key];
                    }
                }
            }
        },
    };

    // Função para salvar credenciais no banco
    const saveCreds = async () => {
        await prisma.authState.upsert({
            where: { sessionId },
            create: {
                sessionId,
                creds: creds as any,
                keys: keys,
            },
            update: {
                creds: creds as any,
                keys: keys,
            },
        });
    };

    return {
        state: {
            creds,
            keys: keyStore,
        },
        saveCreds,
    };
}
