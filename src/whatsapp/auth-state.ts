import { PrismaService } from '../prisma/prisma.service';
import {
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
} from 'whaileys';
import { Logger } from '@nestjs/common';

const logger = new Logger('AuthState');

function serializeToJson(value: any): any {
  return JSON.parse(JSON.stringify(value, BufferJSON.replacer));
}

function deserializeFromJson(value: any): any {
  return JSON.parse(JSON.stringify(value), BufferJSON.reviver);
}

export async function useAuthState(
  sessionId: string,
  prisma: PrismaService,
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
        logger.debug(`[${sessionId}] Loaded existing credentials from database`);
        return deserializeFromJson(credsRecord.keyData);
      }
    } catch (error) {
      logger.error('Error loading creds from database', error);
    }

    logger.debug(`[${sessionId}] No existing credentials found, initializing new`);
    return initAuthCreds();
  };

  const saveCreds = async (): Promise<void> => {
    try {
      logger.debug(`[${sessionId}] Saving credentials to database`);
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
          keyData: serializeToJson(creds) as any,
        },
        update: {
          keyData: serializeToJson(creds) as any,
        },
      });
      logger.debug(`[${sessionId}] Credentials saved successfully`);
    } catch (error) {
      logger.error('Error saving creds to database', error);
    }
  };

  const clearState = async (): Promise<void> => {
    try {
      await prisma.authState.deleteMany({
        where: { sessionId },
      });
      creds = initAuthCreds();
    } catch (error) {
      logger.error('Error clearing auth state from database', error);
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
          logger.error(`Error getting keys of type ${type}`, error);
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
                  keyData: serializeToJson(value) as any,
                },
                update: {
                  keyData: serializeToJson(value) as any,
                },
              });

              tasks.push(task);
            }
          }

          logger.debug(
            `[${sessionId}] Setting keys: ${Object.keys(data).join(', ')} (${tasks.length} operations)`,
          );
          await Promise.all(tasks);
          logger.debug(`[${sessionId}] Keys saved successfully`);
        } catch (error) {
          logger.error('Error setting keys', error);
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
