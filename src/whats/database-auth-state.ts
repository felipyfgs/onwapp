import { PrismaService } from '@/prisma/prisma.service';

/**
 * Database-backed authentication state for WhatsApp sessions
 * Replaces file-based storage with Prisma database storage
 */
export class DatabaseAuthState {
    constructor(
        private prisma: PrismaService,
        private sessionId: string
    ) { }

    /**
     * Get authentication state from database
     */
    async getState(): Promise<any> {
        const session = await this.prisma.session.findUnique({
            where: { id: this.sessionId },
            select: { creds: true }
        });

        return session?.creds || {
            creds: {},
            keys: {}
        };
    }

    /**
     * Save credentials to database
     */
    async saveCreds(creds: any): Promise<void> {
        const currentState = await this.getState();

        await this.prisma.session.update({
            where: { id: this.sessionId },
            data: {
                creds: {
                    ...currentState,
                    creds: {
                        ...currentState.creds,
                        ...creds
                    }
                }
            }
        });
    }

    /**
     * Save keys to database
     */
    async saveKeys(keys: any): Promise<void> {
        const currentState = await this.getState();

        await this.prisma.session.update({
            where: { id: this.sessionId },
            data: {
                creds: {
                    ...currentState,
                    keys: {
                        ...currentState.keys,
                        ...keys
                    }
                }
            }
        });
    }
}

/**
 * Create database-backed auth state compatible with whaileys
 */
export async function useDatabaseAuthState(
    prisma: PrismaService,
    sessionId: string
) {
    const authState = new DatabaseAuthState(prisma, sessionId);
    const state = await authState.getState();

    return {
        state: {
            creds: state.creds || {},
            keys: state.keys || {}
        },
        saveCreds: async () => {
            // Credentials are saved through events in WhatsService
        }
    };
}
