import { Injectable, Logger } from '@nestjs/common';
import { WebhooksService } from '../../../integrations/webhooks/webhooks.service';
import { formatSessionId } from '../utils/helpers';

interface GroupJoinRequestPayload {
  id: string;
  author: string;
  authorPn?: string;
  participant: string;
  participantPn?: string;
  action: 'created' | 'revoked' | 'rejected';
  method: 'invite' | 'non_admin_add';
}

@Injectable()
export class GroupsExtendedHandler {
  private readonly logger = new Logger(GroupsExtendedHandler.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  async handleGroupJoinRequest(
    sessionId: string,
    payload: GroupJoinRequestPayload,
  ): Promise<void> {
    const sid = formatSessionId(sessionId);

    this.logger.log(`[${sid}] Solicitação de entrada em grupo`, {
      groupId: payload.id,
      participant: payload.participant,
      action: payload.action,
      method: payload.method,
      author: payload.author,
    });

    await this.webhooksService.trigger(
      sessionId,
      'group.join-request',
      payload,
    );
  }
}
