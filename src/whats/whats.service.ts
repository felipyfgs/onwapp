import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import makeWASocket, {
  AnyMessageContent,
  ConnectionState,
  DisconnectReason,
  MessageUpsertType,
  WAMessage,
  useMultiFileAuthState,
} from 'whaileys';
import qrcodeTerminal from 'qrcode-terminal';
import { LoggerService } from '../logger/logger.service';
import { MessageService } from '../modules/message/message.service';
import type { Logger } from 'pino';

const SESSION_DIR = process.env.WHATS_SESSION_DIR || './whats-session';

type QRCodeTerminal = {
  generate(value: string, options?: { small?: boolean }): void;
};
const qrcode = qrcodeTerminal as QRCodeTerminal;

type BaileysDisconnectError = {
  output?: {
    statusCode?: number;
  };
};

@Injectable()
export class WhatsService implements OnModuleInit, OnModuleDestroy {
  private socket: ReturnType<typeof makeWASocket> | null = null;

  constructor(
    private readonly logger: LoggerService,
    private readonly messageService: MessageService,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.shutdown();
  }

  private async connect() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    this.socket = makeWASocket({
      printQRInTerminal: false,
      auth: state,
      logger: this.logger.getLogger() as unknown as Logger,
    });

    this.socket.ev.on(
      'connection.update',
      (update: Partial<ConnectionState>) => {
        void this.handleConnectionUpdate(update);
      },
    );
    this.socket.ev.on('messages.upsert', (payload) => {
      void this.handleMessage(payload);
    });
    this.socket.ev.on('creds.update', () => {
      void saveCreds();
    });
  }

  private async shutdown() {
    if (this.socket) {
      const ws = this.socket.ws as { close: () => Promise<void> };
      await ws.close();
      this.socket = null;
    }
  }

  private async handleConnectionUpdate(update: Partial<ConnectionState>) {
    this.logger.info('WhatsApp connection status update', update);

    if (update.qr) {
      qrcode.generate(update.qr, { small: true });
    }

    if (update.connection === 'close') {
      const statusCode = (
        update.lastDisconnect?.error as BaileysDisconnectError
      )?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        this.logger.info('Reconectando WhatsApp...');
        await this.reconnect();
      } else {
        this.logger.warn('WhatsApp encerrado: login deslogado.');
      }
    }
  }

  private async reconnect() {
    await this.shutdown();
    await this.connect();
  }

  private async handleMessage({
    messages,
  }: {
    messages: WAMessage[];
    type: MessageUpsertType;
  }) {
    const incoming = messages.find((msg) => msg?.message);
    if (!incoming) {
      return;
    }

    await this.messageService.handleMessage(incoming);
  }

  async sendMessage(jid: string, content: AnyMessageContent) {
    return this.socket?.sendMessage(jid, content);
  }
}
