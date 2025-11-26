import { Injectable, Logger } from '@nestjs/common';
import { formatSessionId } from '../utils/helpers';

@Injectable()
export class BlocklistHandler {
  private readonly logger = new Logger(BlocklistHandler.name);
  private blocklistCache: Map<string, Set<string>> = new Map();

  handleBlocklistSet(sessionId: string, blocklist: string[]): void {
    const sid = formatSessionId(sessionId);
    this.logger.log(`[${sid}] blocklist.set`, {
      event: 'blocklist.set',
      count: blocklist.length,
    });

    this.blocklistCache.set(sessionId, new Set(blocklist));
  }

  handleBlocklistUpdate(
    sessionId: string,
    payload: { blocklist: string[]; type: 'add' | 'remove' },
  ): void {
    const sid = formatSessionId(sessionId);
    this.logger.log(`[${sid}] blocklist.update`, {
      event: 'blocklist.update',
      type: payload.type,
      count: payload.blocklist.length,
    });

    const current = this.blocklistCache.get(sessionId) || new Set<string>();

    if (payload.type === 'add') {
      payload.blocklist.forEach((jid) => current.add(jid));
    } else {
      payload.blocklist.forEach((jid) => current.delete(jid));
    }

    this.blocklistCache.set(sessionId, current);
  }

  getBlocklist(sessionId: string): string[] {
    return Array.from(this.blocklistCache.get(sessionId) || []);
  }

  isBlocked(sessionId: string, jid: string): boolean {
    return this.blocklistCache.get(sessionId)?.has(jid) ?? false;
  }

  clearCache(sessionId: string): void {
    this.blocklistCache.delete(sessionId);
  }
}
