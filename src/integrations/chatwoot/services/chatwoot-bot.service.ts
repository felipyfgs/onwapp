import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import axios from 'axios';
import { ChatwootConfigService } from './chatwoot-config.service';
import { ChatwootContactService } from './chatwoot-contact.service';
import { ChatwootConversationService } from './chatwoot-conversation.service';
import { WhatsAppService } from '../../../core/whatsapp/whatsapp.service';
import { CHATWOOT_BOT } from '../constants';

/**
 * Service for managing Chatwoot bot contact
 *
 * Handles bot messages, QR code sending, and connection status notifications.
 */
@Injectable()
export class ChatwootBotService {
  private readonly logger = new Logger(ChatwootBotService.name);

  constructor(
    private readonly configService: ChatwootConfigService,
    private readonly contactService: ChatwootContactService,
    private readonly conversationService: ChatwootConversationService,
    @Inject(forwardRef(() => WhatsAppService))
    private readonly whatsappService: WhatsAppService,
  ) {}

  /**
   * Get or create bot contact for a session
   */
  async getOrCreateBotContact(
    sessionId: string,
  ): Promise<{ contactId: number; conversationId: number } | null> {
    const config = await this.configService.getConfig(sessionId);
    if (!config) return null;

    const inbox = await this.configService.getInbox(sessionId);
    if (!inbox) return null;

    // Get organization and logo from config
    const organization = config.organization || CHATWOOT_BOT.DEFAULT_NAME;
    const logo = config.logo || CHATWOOT_BOT.DEFAULT_LOGO;

    // Find or create bot contact
    let contact = await this.contactService.findContact(
      sessionId,
      CHATWOOT_BOT.PHONE_NUMBER,
    );

    if (!contact) {
      // Create contact first (without avatar due to Chatwoot API bug with avatar_url)
      contact = await this.contactService.createContact(sessionId, {
        phoneNumber: CHATWOOT_BOT.PHONE_NUMBER,
        inboxId: inbox.id,
        isGroup: false,
        name: organization,
        identifier: CHATWOOT_BOT.PHONE_NUMBER,
      });
      this.logger.log(`Bot contact created with name: ${organization}`, {
        event: 'chatwoot.bot.contact.created',
        sessionId,
      });

      // Upload avatar as file (workaround for avatar_url bug)
      if (logo && contact) {
        try {
          const client = await this.configService.getClient(sessionId);
          if (client) {
            const response = await axios.get(logo, {
              responseType: 'arraybuffer',
              timeout: 10000,
            });
            const avatarBuffer = Buffer.from(response.data);
            await client.updateContactWithAvatar(contact.id, {
              avatarBuffer,
              avatarFilename: 'avatar.png',
            });
            this.logger.log(`Bot contact avatar uploaded successfully`, {
              event: 'chatwoot.bot.avatar.uploaded',
              sessionId,
            });
          }
        } catch (error) {
          this.logger.warn(
            `Failed to upload bot avatar: ${(error as Error).message}`,
          );
        }
      }
    } else {
      // Update existing contact with current config (name and avatar)
      const needsUpdate = contact.name !== organization || !contact.thumbnail;
      if (needsUpdate) {
        try {
          // Download logo and upload as file (workaround for avatar_url bug)
          const client = await this.configService.getClient(sessionId);
          if (client && logo) {
            const response = await axios.get(logo, {
              responseType: 'arraybuffer',
              timeout: 10000,
            });
            const avatarBuffer = Buffer.from(response.data);
            await client.updateContactWithAvatar(contact.id, {
              name: organization,
              avatarBuffer,
              avatarFilename: 'avatar.png',
            });
            this.logger.log(
              `Bot contact updated with avatar: ${organization}`,
              {
                event: 'chatwoot.bot.contact.updated',
                sessionId,
              },
            );
          } else {
            // Fallback to regular update without avatar
            await this.contactService.updateContact(sessionId, contact.id, {
              name: organization,
            });
          }
        } catch (error) {
          this.logger.warn(
            `Failed to update bot avatar: ${(error as Error).message}`,
          );
          // Try updating just the name
          await this.contactService.updateContact(sessionId, contact.id, {
            name: organization,
          });
        }
      }
    }

    if (!contact) return null;

    // Get or create conversation with bot
    const conversationId =
      await this.conversationService.getOrCreateConversation(sessionId, {
        contactId: contact.id,
        inboxId: inbox.id,
      });

    if (!conversationId) return null;

    return { contactId: contact.id, conversationId };
  }

  /**
   * Send a bot message to Chatwoot
   */
  async sendBotMessage(
    sessionId: string,
    content: string,
    messageType: 'incoming' | 'outgoing' = 'incoming',
  ): Promise<boolean> {
    try {
      const botData = await this.getOrCreateBotContact(sessionId);
      if (!botData) return false;

      const client = await this.configService.getClient(sessionId);
      if (!client) return false;

      await client.createMessage(botData.conversationId, {
        content,
        message_type: messageType,
      });

      this.logger.debug('Bot message sent', {
        event: 'chatwoot.bot.message.sent',
        sessionId,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send bot message', {
        event: 'chatwoot.bot.message.failure',
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Send QR code image to Chatwoot bot conversation
   */
  async sendQRCode(
    sessionId: string,
    qrCodeBase64: string,
    pairingCode?: string,
  ): Promise<boolean> {
    try {
      const botData = await this.getOrCreateBotContact(sessionId);
      if (!botData) return false;

      const client = await this.configService.getClient(sessionId);
      if (!client) return false;

      // Convert base64 to buffer
      const base64Data = qrCodeBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Create readable stream
      const stream = new Readable();
      stream._read = () => {};
      stream.push(buffer);
      stream.push(null);

      // Send QR code image
      await client.createMessageWithAttachments(botData.conversationId, {
        content: '📱 Escaneie o QR Code para conectar',
        message_type: 'incoming',
        attachments: [
          {
            content: buffer,
            filename: `qrcode_${sessionId}.png`,
          },
        ],
      });

      // Send pairing code message if available
      let message =
        '⚡ *QR Code gerado com sucesso!*\n\nEscaneie o código acima para conectar o WhatsApp.';

      if (pairingCode) {
        const formattedCode = `${pairingCode.substring(0, 4)}-${pairingCode.substring(4, 8)}`;
        message += `\n\n*Código de Pareamento:* ${formattedCode}`;
      }

      await client.createMessage(botData.conversationId, {
        content: message,
        message_type: 'incoming',
      });

      this.logger.log('QR Code sent to Chatwoot', {
        event: 'chatwoot.bot.qrcode.sent',
        sessionId,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send QR code', {
        event: 'chatwoot.bot.qrcode.failure',
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Send connection status notification
   */
  async sendConnectionStatus(
    sessionId: string,
    status: 'connected' | 'disconnected' | 'connecting' | 'qr_timeout',
  ): Promise<boolean> {
    const messages: Record<string, string> = {
      connected:
        '✅ *WhatsApp conectado com sucesso!*\n\nA sessão está pronta para enviar e receber mensagens.',
      disconnected:
        '❌ *WhatsApp desconectado*\n\nA sessão foi desconectada. Envie `/init` para reconectar.',
      connecting:
        '🔄 *Conectando ao WhatsApp...*\n\nAguarde enquanto estabelecemos a conexão.',
      qr_timeout:
        '⚠️ *QR Code expirado*\n\nO tempo para escanear o QR Code esgotou. Envie `/init` para gerar um novo.',
    };

    return this.sendBotMessage(
      sessionId,
      messages[status] || `Status: ${status}`,
    );
  }

  /**
   * Handle bot commands from Chatwoot
   */
  async handleBotCommand(
    sessionId: string,
    command: string,
    _phoneNumber?: string,
  ): Promise<{ handled: boolean; message?: string }> {
    const cmd = command.toLowerCase().replace('/', '').trim();

    switch (cmd) {
      case 'init':
      case 'iniciar':
      case 'connect':
      case 'conectar': {
        const socket = this.whatsappService.getSocket(sessionId);
        if (socket) {
          return {
            handled: true,
            message: '✅ *Sessão já está conectada!*',
          };
        }

        // Trigger reconnection
        await this.sendBotMessage(
          sessionId,
          '🔄 *Iniciando conexão...*\n\nAguarde o QR Code.',
        );

        try {
          await this.whatsappService.createSocket(sessionId);
          return { handled: true };
        } catch (error) {
          return {
            handled: true,
            message: `❌ *Erro ao conectar:* ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          };
        }
      }

      case 'status': {
        const socket = this.whatsappService.getSocket(sessionId);
        const status = socket ? 'conectado' : 'desconectado';
        return {
          handled: true,
          message: `📊 *Status da Sessão*\n\n🔌 Estado: *${status}*`,
        };
      }

      case 'disconnect':
      case 'desconectar':
      case 'logout': {
        try {
          await this.whatsappService.disconnectSocket(sessionId);
          return {
            handled: true,
            message:
              '🔌 *Sessão desconectada com sucesso!*\n\nEnvie `/init` para reconectar.',
          };
        } catch (error) {
          return {
            handled: true,
            message: `❌ *Erro ao desconectar:* ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          };
        }
      }

      case 'help':
      case 'ajuda': {
        return {
          handled: true,
          message: `📖 *Comandos Disponíveis*

/init - Iniciar conexão WhatsApp
/status - Verificar status da conexão
/disconnect - Desconectar sessão
/help - Mostrar esta ajuda`,
        };
      }

      default:
        return { handled: false };
    }
  }
}
