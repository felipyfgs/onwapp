export class SessionResponseDto {
    id: string;
    name: string;
    status: string;
    qrCode?: string | null;
    phoneNumber?: string | null;
    webhookUrl?: string | null;
    webhookEvents: string[];
    createdAt: Date;
    updatedAt: Date;
}

export class SessionStatusDto {
    id: string;
    name: string;
    status: string;
    phoneNumber?: string | null;
}

export class QRCodeResponseDto {
    id: string;
    qrCode?: string | null;
    status: string;
    message?: string;
}

export class WebhookEventsDto {
    events: string[];
}

export class MessageResponseDto {
    message: string;
}
