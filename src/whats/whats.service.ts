import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, {
	DisconnectReason,
	AnyMessageContent,
	proto,
	useSingleFileAuthState,
} from 'whaileys';
import qrcode from 'qrcode-terminal';
import { LoggerService } from '../logger/logger.service';
import { MessageService } from '../modules/message/message.service';
import { SessionService } from '../modules/session/session.service';
import { promises as fs } from 'fs';

const SESSION_FILE = process.env.WHATS_SESSION_FILE || './whats-session.json';

@Injectable()
export class WhatsService implements OnModuleInit, OnModuleDestroy {
	private socket = null as ReturnType<typeof makeWASocket> | null;
	private authState: ReturnType<typeof useSingleFileAuthState>['state'] | null = null;

	constructor(
		private readonly logger: LoggerService,
		private readonly messageService: MessageService,
		private readonly sessionService: SessionService,
	) {}

	async onModuleInit() {
		await this.initSocket();
	}

	async onModuleDestroy() {
		await this.shutdownSocket();
	}

	private async initSocket() {
		const { state, saveCreds } = await useSingleFileAuthState(SESSION_FILE);
		this.authState = state;

		this.socket = makeWASocket({
			printQRInTerminal: false,
			auth: state,
			logger: this.logger as any,
		});

		this.socket.ev.on('connection.update', (update) => this.handleConnectionUpdate(update));
		this.socket.ev.on('messages.upsert', (message) => this.handleMessage(message));
		this.socket.ev.on('creds.update', saveCreds);
	}

	private async shutdownSocket() {
		await this.socket?.ws.close();
		this.socket = null;
	}

	private handleConnectionUpdate(update: proto.IConnectionState) {
		this.logger.log('WhatsApp connection update', update);
		const { connection, lastDisconnect } = update;
		if (connection === 'close') {
			const shouldReconnect =
				(lastDisconnect?.error as DisconnectReason)?.output?.statusCode !== DisconnectReason.loggedOut;
			if (shouldReconnect) {
				this.initSocket();
			}
		}
		if (update.qr) {
			qrcode.generate(update.qr, { small: true });
		}
	}

	private async handleMessage(message: { messages: proto.IWebMessageInfo[]; type: string }) {
		const incoming = message.messages[0];
		if (!incoming?.message) return;

		// Exemplo: novo registro na base via MessageService
		await this.messageService.handleMessage(incoming);
	}

	async sendMessage(jid: string, content: AnyMessageContent) {
		return this.socket?.sendMessage(jid, content);
	}
}
