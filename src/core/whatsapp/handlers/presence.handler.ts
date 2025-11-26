import { Injectable, Logger } from '@nestjs/common';

interface PresenceData {
  [jid: string]: {
    lastKnownPresence?:
      | 'available'
      | 'unavailable'
      | 'composing'
      | 'recording'
      | 'paused';
    lastSeen?: number;
  };
}

@Injectable()
export class PresenceHandler {
  private readonly logger = new Logger(PresenceHandler.name);
  private presenceCache: Map<string, Map<string, PresenceData>> = new Map();

  handlePresenceUpdate(sessionId: string, presences: PresenceData): void {
    this.logger.debug(`[${sessionId}] Processando presence.update`, {
      event: 'whatsapp.presence.update',
      jids: Object.keys(presences),
    });

    try {
      if (!this.presenceCache.has(sessionId)) {
        this.presenceCache.set(sessionId, new Map());
      }

      const sessionCache = this.presenceCache.get(sessionId)!;

      for (const [jid, presence] of Object.entries(presences)) {
        sessionCache.set(jid, { [jid]: presence });
      }
    } catch (error) {
      this.logger.error(
        `[${sessionId}] Erro ao processar presence.update: ${error instanceof Error ? error.message : 'Erro'}`,
      );
    }
  }

  getPresence(sessionId: string, jid: string): PresenceData | undefined {
    const sessionCache = this.presenceCache.get(sessionId);
    if (!sessionCache) return undefined;
    return sessionCache.get(jid);
  }

  getAllPresences(sessionId: string): Map<string, PresenceData> | undefined {
    return this.presenceCache.get(sessionId);
  }

  clearSessionCache(sessionId: string): void {
    this.presenceCache.delete(sessionId);
  }
}
