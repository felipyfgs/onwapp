import { Injectable, Logger } from '@nestjs/common';
import { WebhooksService } from '../../../integrations/webhooks/webhooks.service';
import { formatSessionId } from '../utils/helpers';

// Label type definition (for future whaileys versions that support labels)
interface Label {
  id: string;
  name: string;
  color: number;
  predefinedId?: string;
}

interface LabelAssociation {
  labelId: string;
  chatId: string;
  type: 'chat' | 'message';
  messageId?: string;
}

interface LabelsAssociationPayload {
  association: LabelAssociation;
  type: 'add' | 'remove';
}

@Injectable()
export class LabelsHandler {
  private readonly logger = new Logger(LabelsHandler.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  async handleLabelsEdit(sessionId: string, label: Label): Promise<void> {
    const sid = formatSessionId(sessionId);

    this.logger.log(`[${sid}] Label editado`, {
      labelId: label.id,
      labelName: label.name,
      color: label.color,
    });

    await this.webhooksService.trigger(sessionId, 'labels.edit', label);
  }

  async handleLabelsAssociation(
    sessionId: string,
    payload: LabelsAssociationPayload,
  ): Promise<void> {
    const sid = formatSessionId(sessionId);

    this.logger.log(`[${sid}] Label association ${payload.type}`, {
      labelId: payload.association.labelId,
      chatId: payload.association.chatId,
      type: payload.association.type,
      action: payload.type,
    });

    await this.webhooksService.trigger(
      sessionId,
      'labels.association',
      payload,
    );
  }
}
