const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} = require('whaileys');
const pino = require('pino');

const logger = pino({ level: 'silent' });

async function connectToWhatsApp() {
  // Usar auth state em arquivo (como exemplo básico do Baileys)
  const { state, saveCreds } = await useMultiFileAuthState('./auth_test');

  // Buscar versão mais recente
  const { version } = await fetchLatestBaileysVersion();
  console.log('WhatsApp Web version:', version.join('.'));

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    version,
    browser: Browsers.ubuntu('Chrome'),
    printQRInTerminal: true,
    logger,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    emitOwnEvents: false,
    fireInitQueries: true,
    connectTimeoutMs: 30000,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 350,
  });

  // Processar eventos
  sock.ev.process(async (events) => {
    if (events['connection.update']) {
      const { connection, lastDisconnect, qr } = events['connection.update'];

      if (qr) {
        console.log('\n[QR] Escaneie o QR code acima\n');
      }

      if (connection === 'connecting') {
        console.log('[STATUS] Conectando...');
      }

      if (connection === 'open') {
        console.log('[STATUS] ✓ Conectado!');
        console.log('[INFO] Telefone:', sock.user?.id);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log('[STATUS] ✗ Desconectado');
        console.log('[INFO] Código:', statusCode);
        console.log('[INFO] Reconectar:', shouldReconnect ? 'Sim' : 'Não');
        console.log('[INFO] Erro:', lastDisconnect?.error?.message || 'N/A');

        if (shouldReconnect) {
          console.log('[INFO] Reconectando em 5 segundos...');
          setTimeout(() => connectToWhatsApp(), 5000);
        } else {
          console.log('[INFO] Sessão encerrada. Execute novamente para novo QR.');
        }
      }
    }

    if (events['creds.update']) {
      console.log('[AUTH] Salvando credenciais...');
      await saveCreds();
      console.log('[AUTH] Credenciais salvas');
    }

    if (events['messages.upsert']) {
      const { messages } = events['messages.upsert'];
      console.log('[MSG] Recebida:', messages.length, 'mensagem(ns)');
    }
  });

  return sock;
}

console.log('='.repeat(50));
console.log('TESTE WHAILEYS - Conexão Simples');
console.log('='.repeat(50));
console.log('');

connectToWhatsApp().catch((err) => {
  console.error('[ERRO]', err.message);
});
