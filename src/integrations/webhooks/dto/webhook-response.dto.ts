export class WebhookResponseDto {
  id: string;
  sessionId: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
