import { SessionStatus } from '@prisma/client';

export class SessionResponseDto {
  id: string;
  name: string;
  phone?: string | null;
  status: SessionStatus;
  qrCode?: string | null;
  webhookUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastConnected?: Date | null;
}

export class SessionStatusResponseDto {
  id: string;
  status: SessionStatus;
  isConnected: boolean;
}

export class QRCodeResponseDto {
  qrCode: string | null;
}

export class WebhookEventsResponseDto {
  events: string[];
}
