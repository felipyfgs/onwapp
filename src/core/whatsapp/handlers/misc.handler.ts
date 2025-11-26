import { Injectable, Logger } from '@nestjs/common';
import { WebhooksService } from '../../../integrations/webhooks/webhooks.service';
import { formatSessionId } from '../utils/helpers';

interface LidMappingUpdatePayload {
  lid: string;
  pn: string;
}

@Injectable()
export class MiscHandler {
  private readonly logger = new Logger(MiscHandler.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  async handleLidMappingUpdate(
    sessionId: string,
    payload: LidMappingUpdatePayload,
  ): Promise<void> {
    const sid = formatSessionId(sessionId);

    this.logger.debug(`[${sid}] LID mapping atualizado`, {
      lid: payload.lid,
      phoneNumber: payload.pn,
    });

    await this.webhooksService.trigger(
      sessionId,
      'lid-mapping.update',
      payload,
    );
  }
}
