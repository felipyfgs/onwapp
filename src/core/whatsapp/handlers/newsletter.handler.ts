import { Injectable, Logger } from '@nestjs/common';
import { WebhooksService } from '../../../integrations/webhooks/webhooks.service';
import { formatSessionId } from '../utils/helpers';

interface NewsletterReactionPayload {
  id: string;
  server_id: string;
  reaction: {
    code?: string;
    count?: number;
    removed?: boolean;
  };
}

interface NewsletterViewPayload {
  id: string;
  server_id: string;
  count: number;
}

interface NewsletterParticipantsUpdatePayload {
  id: string;
  author: string;
  user: string;
  new_role: string;
  action: string;
}

interface NewsletterSettingsUpdatePayload {
  id: string;
  update: unknown;
}

@Injectable()
export class NewsletterHandler {
  private readonly logger = new Logger(NewsletterHandler.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  async handleNewsletterReaction(
    sessionId: string,
    payload: NewsletterReactionPayload,
  ): Promise<void> {
    const sid = formatSessionId(sessionId);

    this.logger.log(`[${sid}] Reação em newsletter`, {
      newsletterId: payload.id,
      serverId: payload.server_id,
      reaction: payload.reaction,
    });

    await this.webhooksService.trigger(
      sessionId,
      'newsletter.reaction',
      payload,
    );
  }

  async handleNewsletterView(
    sessionId: string,
    payload: NewsletterViewPayload,
  ): Promise<void> {
    const sid = formatSessionId(sessionId);

    this.logger.debug(`[${sid}] Visualização de newsletter`, {
      newsletterId: payload.id,
      serverId: payload.server_id,
      viewCount: payload.count,
    });

    await this.webhooksService.trigger(sessionId, 'newsletter.view', payload);
  }

  async handleNewsletterParticipantsUpdate(
    sessionId: string,
    payload: NewsletterParticipantsUpdatePayload,
  ): Promise<void> {
    const sid = formatSessionId(sessionId);

    this.logger.log(`[${sid}] Atualização de participante de newsletter`, {
      newsletterId: payload.id,
      user: payload.user,
      newRole: payload.new_role,
      action: payload.action,
    });

    await this.webhooksService.trigger(
      sessionId,
      'newsletter-participants.update',
      payload,
    );
  }

  async handleNewsletterSettingsUpdate(
    sessionId: string,
    payload: NewsletterSettingsUpdatePayload,
  ): Promise<void> {
    const sid = formatSessionId(sessionId);

    this.logger.log(`[${sid}] Atualização de configurações de newsletter`, {
      newsletterId: payload.id,
      update: payload.update,
    });

    await this.webhooksService.trigger(
      sessionId,
      'newsletter-settings.update',
      payload,
    );
  }
}
