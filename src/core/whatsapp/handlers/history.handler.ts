import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { WASocket } from 'whaileys';
import { HistorySyncService } from '../../persistence/history-sync.service';
import { SettingsService } from '../../../api/settings/settings.service';
import { formatSessionId } from '../utils/helpers';

interface HistorySyncPayload {
  chats?: unknown[];
  contacts?: unknown[];
  messages?: unknown[];
  isLatest?: boolean;
  progress?: number;
}

@Injectable()
export class HistoryHandler {
  private readonly logger = new Logger(HistoryHandler.name);

  constructor(
    @Inject(forwardRef(() => HistorySyncService))
    private readonly historySyncService: HistorySyncService,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
  ) {}

  registerHistoryListeners(sessionId: string, socket: WASocket): void {
    const sid = formatSessionId(sessionId);

    socket.ev.on(
      'messaging-history.set' as never,
      (payload: HistorySyncPayload) => {
        void this.handleHistorySync(sessionId, payload, sid);
      },
    );
  }

  private async handleHistorySync(
    sessionId: string,
    payload: HistorySyncPayload,
    sid: string,
  ): Promise<void> {
    this.logger.log(`[${sid}] 📨 messaging-history.set`, {
      event: 'messaging-history.set',
      chatsCount: payload.chats?.length || 0,
      contactsCount: payload.contacts?.length || 0,
      messagesCount: payload.messages?.length || 0,
      isLatest: payload.isLatest,
      progress: payload.progress,
    });

    try {
      let settings: { syncFullHistory?: boolean } = {};
      try {
        settings = await this.settingsService.getSettings(sessionId);
      } catch {
        settings = {};
      }

      const shouldSync = settings?.syncFullHistory !== false;

      if (shouldSync) {
        await this.historySyncService.processHistorySync(sessionId, {
          chats: payload.chats || [],
          contacts: payload.contacts || [],
          messages: payload.messages || [],
          isLatest: payload.isLatest ?? false,
          progress: payload.progress,
        });
      } else {
        this.logger.debug(
          `[${sid}] Sincronização de histórico desabilitada (syncFullHistory: false)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[${sid}] Erro ao processar messaging-history.set: ${(error as Error).message}`,
      );
    }
  }
}
