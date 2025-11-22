import { PrismaService } from '../prisma/prisma.service';
import {
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
} from 'whaileys';
import { Logger } from '@nestjs/common';

const logger = new Logger('PostgresAuthState');

export async function usePostgresAuthState(
  sessionId: string,
  prisma: PrismaService,
): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clearState: () => Promise<void>;
}> {
  let creds: AuthenticationCreds;
  let keys: any = {};

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
        return JSON.parse(
          JSON.stringify(credsRecord.keyData),
          BufferJSON.reviver,
        );
      }
    } catch (error) {
      logger.error('Error loading creds from database', error);
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
          keyData: JSON.parse(
            JSON.stringify(creds, BufferJSON.replacer),
          ) as any,
        },
        update: {
          keyData: JSON.parse(
            JSON.stringify(creds, BufferJSON.replacer),
          ) as any,
        },
      });
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
      keys = {};
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
            let value = record.keyData;

            if (value) {
              if (type === 'app-state-sync-key') {
                value = JSON.parse(JSON.stringify(value), BufferJSON.reviver);
              }
              data[record.keyId] = value;
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
                  keyData: JSON.parse(
                    JSON.stringify(value, BufferJSON.replacer),
                  ) as any,
                },
                update: {
                  keyData: JSON.parse(
                    JSON.stringify(value, BufferJSON.replacer),
                  ) as any,
                },
              });

              tasks.push(task);
            }
          }

          await Promise.all(tasks);
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
