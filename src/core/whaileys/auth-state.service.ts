import { PrismaService } from '../../database/prisma.service';
import {
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
} from 'whaileys';
import { Logger } from '@nestjs/common';

const logger = new Logger('AuthState');

function formatSessionId(sessionId: string): string {
  return sessionId.slice(0, 8);
}

function serializeToJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, BufferJSON.replacer)) as unknown;
}

function deserializeFromJson(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value), BufferJSON.reviver) as unknown;
  } catch {
    return value;
  }
}

export async function useDbAuthState(
  prisma: PrismaService,
  sessionId: string,
): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clearState: () => Promise<void>;
}> {
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
        return deserializeFromJson(credsRecord.keyData) as AuthenticationCreds;
      }
    } catch (error) {
      const sid = formatSessionId(sessionId);
      logger.error(
        `[${sid}] Failed to load credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return initAuthCreds();
  };

  const creds = await loadCreds();

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
        const data: Record<string, unknown> = {};

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
            `[${sid}] Failed to get keys (${type}): ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }

        return data;
      },
      set: async (data: Record<string, Record<string, unknown>>) => {
        try {
          const tasks: Promise<unknown>[] = [];

          for (const category in data) {
            const categoryData = data[category];
            for (const id in categoryData) {
              const value = categoryData[id];

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
                  keyData: serializeToJson(value) as object,
                },
                update: {
                  keyData: serializeToJson(value) as object,
                },
              });

              tasks.push(task);
            }
          }

          await Promise.all(tasks);
        } catch (error) {
          const sid = formatSessionId(sessionId);
          logger.error(
            `[${sid}] Failed to save keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      },
    },
  };

  const saveCreds = async (): Promise<void> => {
    try {
      const sid = formatSessionId(sessionId);
      logger.debug(`[${sid}] Saving credentials...`);

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
          keyData: serializeToJson(state.creds) as object,
        },
        update: {
          keyData: serializeToJson(state.creds) as object,
        },
      });

      logger.debug(`[${sid}] Credentials saved`);
    } catch (error) {
      const sid = formatSessionId(sessionId);
      logger.error(
        `[${sid}] Failed to save credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  const clearState = async (): Promise<void> => {
    try {
      await prisma.authState.deleteMany({
        where: { sessionId },
      });
      Object.assign(state.creds, initAuthCreds());
    } catch (error) {
      const sid = formatSessionId(sessionId);
      logger.error(
        `[${sid}] Failed to clear state: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  return {
    state,
    saveCreds,
    clearState,
  };
}
