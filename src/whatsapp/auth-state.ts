import { DatabaseService } from '../database/database.service';
import {
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
} from 'whaileys';
import { createContextLogger } from '../logger/pino.logger';

const logger = createContextLogger('AuthState');

function formatSessionId(sessionId: string): string {
  return sessionId.slice(0, 8);
}

function serializeToJson(value: any): any {
  return JSON.parse(JSON.stringify(value, BufferJSON.replacer));
}

function deserializeFromJson(value: any): any {
  return JSON.parse(JSON.stringify(value), BufferJSON.reviver);
}

export async function useAuthState(
  sessionId: string,
  prisma: DatabaseService,
): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clearState: () => Promise<void>;
}> {
  let creds: AuthenticationCreds;

  const loadCreds = async (): Promise<AuthenticationCreds> => {
    try {
      const credsRecord = await prisma.authState.findUnique({
        where: {
          sessionId_keyType_keyId: {
            sessionId,
            keyType: 'creds',
            keyId: 'creds',
          },
        },
      });

      if (credsRecord && credsRecord.keyData) {
        return deserializeFromJson(credsRecord.keyData);
      }
    } catch (error) {
      const sid = formatSessionId(sessionId);
      logger.error(
        `[${sid}] Falha ao carregar credenciais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }

    return initAuthCreds();
  };

  const saveCreds = async (): Promise<void> => {
    try {
      await prisma.authState.upsert({
        where: {
          sessionId_keyType_keyId: {
            sessionId,
            keyType: 'creds',
            keyId: 'creds',
          },
        },
        create: {
          sessionId,
          keyType: 'creds',
          keyId: 'creds',
          keyData: serializeToJson(creds),
        },
        update: {
          keyData: serializeToJson(creds),
        },
      });
    } catch (error) {
      const sid = formatSessionId(sessionId);
      logger.error(
        `[${sid}] Falha ao salvar credenciais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  };

  const clearState = async (): Promise<void> => {
    try {
      await prisma.authState.deleteMany({
        where: { sessionId },
      });
      creds = initAuthCreds();
    } catch (error) {
      const sid = formatSessionId(sessionId);
      logger.error(
        `[${sid}] Falha ao limpar estado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  };

  creds = await loadCreds();

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
        const data: Record<string, any> = {};

        try {
          const records = await prisma.authState.findMany({
            where: {
              sessionId,
              keyType: type,
              keyId: { in: ids },
            },
          });

          for (const record of records) {
            const value = record.keyData;
            if (value) {
              data[record.keyId] = deserializeFromJson(value);
            }
          }
        } catch (error) {
          const sid = formatSessionId(sessionId);
          logger.error(
            `[${sid}] Falha ao buscar chaves (${type}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          );
        }

        return data;
      },
      set: async (data: any) => {
        try {
          const tasks: Promise<any>[] = [];

          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];

              const task = prisma.authState.upsert({
                where: {
                  sessionId_keyType_keyId: {
                    sessionId,
                    keyType: category,
                    keyId: id,
                  },
                },
                create: {
                  sessionId,
                  keyType: category,
                  keyId: id,
                  keyData: serializeToJson(value),
                },
                update: {
                  keyData: serializeToJson(value),
                },
              });

              tasks.push(task);
            }
          }

          await Promise.all(tasks);
        } catch (error) {
          const sid = formatSessionId(sessionId);
          logger.error(
            `[${sid}] Falha ao salvar chaves: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          );
        }
      },
    },
  };

  return {
    state,
    saveCreds,
    clearState,
  };
}
