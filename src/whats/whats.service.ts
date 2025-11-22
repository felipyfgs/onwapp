import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import makeWASocket from 'whaileys/lib/Socket';
import {
  AnyMessageContent,
  ConnectionState,
  DisconnectReason,
  MessageUpsertType,
  WAMessage,
} from 'whaileys/lib/Types';
import { useMultiFileAuthState } from 'whaileys/lib/Utils/use-multi-file-auth-state';
import qrcode from 'qrcode-terminal';
import { LoggerService } from '../logger/logger.service';
import { MessageService } from '../modules/message/message.service';

const SESSION_DIR = process.env.WHATS_SESSION_DIR || './whats-session';

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
      logger: this.logger.getLogger(),
    });

    this.socket.ev.on('connection.update', (update: Partial<ConnectionState>) =>
      this.handleConnectionUpdate(update),
    );
    this.socket.ev.on('messages.upsert', (payload) =>
      this.handleMessage(payload),
    );
      this.socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
        void this.handleConnectionUpdate(update);
      });
      this.socket.ev.on('messages.upsert', (payload) => {
        void this.handleMessage(payload);
      });
    this.socket.ev.on('creds.update', saveCreds);
  }

  private async shutdown() {
    await this.socket?.ws.close();
    this.socket = null;
  }

  private async handleConnectionUpdate(update: Partial<ConnectionState>) {
    this.logger.info('WhatsApp connection status update', update);
    if (update.qr) {
      qrcode.generate(update.qr, { small: true });
    }

    if (update.connection === 'close') {
      const error = update.lastDisconnect?.error as BaileysError;
      const statusCode = error?.output?.statusCode;
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
    type,
  }: {
    messages: WAMessage[];
    type: MessageUpsertType;
  }) {
    const incoming = messages.find((msg) => msg?.message);
    if (!incoming) return;

    await this.messageService.handleMessage(incoming);
  }

  async sendMessage(jid: string, content: AnyMessageContent) {
    return this.socket?.sendMessage(jid, content);
  }
}
