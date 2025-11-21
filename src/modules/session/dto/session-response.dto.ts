export class SessionResponseDto {
    id: string;
    name: string;
    status: string;
    qrCode?: string;
    phoneNumber?: string;
    webhookUrl?: string;
    webhookEvents: string[];
    createdAt: Date;
    updatedAt: Date;
}

export class SessionStatusDto {
    id: string;
    name: string;
    status: string;
    phoneNumber?: string;
}

export class QRCodeResponseDto {
    id: string;
    qrCode?: string;
    status: string;
    message?: string;
}

export class WebhookEventsDto {
    events: string[];
}

export class MessageResponseDto {
    message: string;
}
