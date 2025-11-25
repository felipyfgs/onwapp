import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { WhatsAppService } from '../../core/whatsapp/whatsapp.service';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { SubscribePresenceDto } from './dto/subscribe-presence.dto';
import {
  PresenceCacheResponseDto,
  PresenceDataDto,
} from './dto/presence-cache-response.dto';

interface PresenceData {
  presence: string;
  lastUpdate: Date;
  lastSeen?: number;
}

@Injectable()
export class PresenceService implements OnModuleInit {
  private presenceCache: Map<string, Map<string, PresenceData>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(private readonly whatsappService: WhatsAppService) {}

  onModuleInit() {
    this.startCacheCleanup();
  }

  private startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, sessionCache] of this.presenceCache.entries()) {
        for (const [jid, data] of sessionCache.entries()) {
          if (now - data.lastUpdate.getTime() > this.CACHE_TTL) {
            sessionCache.delete(jid);
          }
        }
        if (sessionCache.size === 0) {
          this.presenceCache.delete(sessionId);
        }
      }
    }, 60000);
  }

  registerPresenceListener(sessionId: string) {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      return;
    }

    socket.ev.on('presence.update', (update: any) => {
      if (!this.presenceCache.has(sessionId)) {
        this.presenceCache.set(sessionId, new Map());
      }

      const sessionCache = this.presenceCache.get(sessionId)!;

      const presences = update.presences || {};

      for (const [jid, presenceInfo] of Object.entries(presences) as any) {
        sessionCache.set(jid, {
          presence: presenceInfo.lastKnownPresence || 'unavailable',
          lastUpdate: new Date(),
          lastSeen: presenceInfo.lastSeen,
        });
      }
    });
  }

  async updatePresence(
    sessionId: string,
    dto: UpdatePresenceDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    await socket.sendPresenceUpdate(dto.presence, dto.jid);
  }

  async subscribePresence(
    sessionId: string,
    dto: SubscribePresenceDto,
  ): Promise<void> {
    const socket = this.whatsappService.getSocket(sessionId);
    if (!socket) {
      throw new BadRequestException('Sessão desconectada');
    }

    this.registerPresenceListener(sessionId);

    await socket.presenceSubscribe(dto.jid);
  }

  getPresenceCache(sessionId: string, jid?: string): PresenceCacheResponseDto {
    const sessionCache = this.presenceCache.get(sessionId);

    if (!sessionCache) {
      return { presences: [] };
    }

    if (jid) {
      const data = sessionCache.get(jid);
      if (!data) {
        return { presences: [] };
      }

      return {
        presences: [
          {
            jid,
            presence: data.presence,
            lastUpdate: data.lastUpdate,
            lastSeen: data.lastSeen,
          },
        ],
      };
    }

    const presences: PresenceDataDto[] = [];
    for (const [jid, data] of sessionCache.entries()) {
      presences.push({
        jid,
        presence: data.presence,
        lastUpdate: data.lastUpdate,
        lastSeen: data.lastSeen,
      });
    }

    return { presences };
  }
}
