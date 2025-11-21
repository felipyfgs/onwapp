import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface WebhookPayload {
    event: string;
    sessionId: string;
    sessionName: string;
    timestamp: Date;
    data: any;
}

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Dispara webhook para uma sessão específica
     */
    async triggerWebhook(
        sessionId: string,
        event: string,
        data: any
    ): Promise<void> {
        try {
            // Buscar configurações de webhook da sessão
            const session = await this.prisma.session.findUnique({
                where: { id: sessionId },
                select: {
                    name: true,
                    webhookUrl: true,
                    webhookEvents: true,
                    webhookConfigs: {
                        where: { enabled: true }
                    }
                }
            });

            if (!session) {
                this.logger.warn(`Session ${sessionId} not found for webhook trigger`);
                return;
            }

            // Verificar se o evento está na lista de eventos configurados
            const shouldTrigger = session.webhookEvents.includes(event);

            if (!shouldTrigger && session.webhookConfigs.length === 0) {
                this.logger.debug(`Event ${event} not configured for session ${sessionId}`);
                return;
            }

            // Preparar payload
            const payload: WebhookPayload = {
                event,
                sessionId,
                sessionName: session.name,
                timestamp: new Date(),
                data
            };

            // Disparar webhook principal (se configurado)
            if (session.webhookUrl && shouldTrigger) {
                await this.sendWebhook(session.webhookUrl, payload);
            }

            // Disparar webhooks adicionais
            for (const config of session.webhookConfigs) {
                if (config.events.includes(event)) {
                    await this.sendWebhook(config.url, payload);
                }
            }
        } catch (error) {
            this.logger.error(`Failed to trigger webhook for session ${sessionId}:`, error);
        }
    }

    /**
     * Envia requisição HTTP POST para URL do webhook
     */
    private async sendWebhook(url: string, payload: WebhookPayload): Promise<void> {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'zpwoot-webhook/1.0'
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(10000) // 10 segundos timeout
            });

            if (!response.ok) {
                this.logger.warn(
                    `Webhook request to ${url} failed with status ${response.status}`
                );
            } else {
                this.logger.debug(`Webhook sent successfully to ${url} for event ${payload.event}`);
            }
        } catch (error) {
            this.logger.error(`Failed to send webhook to ${url}:`, error.message);
        }
    }

    /**
     * Disparar webhook de atualização de conexão
     */
    async triggerConnectionUpdate(
        sessionId: string,
        status: string,
        qrCode?: string
    ): Promise<void> {
        await this.triggerWebhook(sessionId, 'connection.update', {
            status,
            qrCode
        });
    }

    /**
     * Disparar webhook de mensagem recebida
     */
    async triggerMessageUpsert(
        sessionId: string,
        messages: any[]
    ): Promise<void> {
        await this.triggerWebhook(sessionId, 'messages.upsert', {
            messages
        });
    }

    /**
     * Disparar webhook de atualização de mensagem
     */
    async triggerMessageUpdate(
        sessionId: string,
        messages: any[]
    ): Promise<void> {
        await this.triggerWebhook(sessionId, 'messages.update', {
            messages
        });
    }

    /**
     * Disparar webhook de confirmação de leitura
     */
    async triggerMessageReceipt(
        sessionId: string,
        receipts: any[]
    ): Promise<void> {
        await this.triggerWebhook(sessionId, 'message-receipt.update', {
            receipts
        });
    }

    /**
     * Disparar webhook de presença
     */
    async triggerPresenceUpdate(
        sessionId: string,
        presences: any[]
    ): Promise<void> {
        await this.triggerWebhook(sessionId, 'presence.update', {
            presences
        });
    }

    /**
     * Disparar webhook de grupo
     */
    async triggerGroupUpdate(
        sessionId: string,
        groups: any[]
    ): Promise<void> {
        await this.triggerWebhook(sessionId, 'groups.update', {
            groups
        });
    }

    /**
     * Disparar webhook de contato
     */
    async triggerContactUpdate(
        sessionId: string,
        contacts: any[]
    ): Promise<void> {
        await this.triggerWebhook(sessionId, 'contacts.update', {
            contacts
        });
    }

    /**
     * Disparar webhook de chat
     */
    async triggerChatUpdate(
        sessionId: string,
        chats: any[]
    ): Promise<void> {
        await this.triggerWebhook(sessionId, 'chats.update', {
            chats
        });
    }
}