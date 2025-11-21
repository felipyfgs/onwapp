# Webhook Receiver - zpwoot

Exemplo de servidor para receber webhooks do zpwoot em tempo real.

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
cd examples
npm install
```

### 2. Iniciar Servidor

```bash
npm start
```

O servidor iniciará em `http://localhost:3001`

## 📡 Endpoints

### POST /webhook
Recebe todos os eventos do zpwoot.

**Payload:**
```json
{
  "event": "messages.upsert",
  "sessionId": "uuid-da-sessao",
  "sessionName": "nome-da-sessao",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    // Dados específicos do evento
  }
}
```

### GET /health
Health check do servidor.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456
}
```

## 🔗 Como Conectar com zpwoot

### 1. Configurar Sessão com Webhook

```bash
curl -X POST http://localhost:3000/sessions/create \
  -H "apikey: sua-chave-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "minha-sessao",
    "webhookUrl": "http://localhost:3001/webhook",
    "webhookEvents": ["messages.upsert", "connection.update"]
  }'
```

### 2. Conectar Sessão

```bash
curl -X POST http://localhost:3000/sessions/{id}/connect \
  -H "apikey: sua-chave-aqui"
```

### 3. Observar Logs

Inicie este servidor e observe os logs no console. Você verá eventos em tempo real!

## 📋 Eventos Suportados

| Evento | Descrição | Exemplo de Dados |
|--------|-----------|-----------------|
| `connection.update` | Mudanças de status | `{ status: "connected", qrCode: null }` |
| `messages.upsert` | Novas mensagens | `{ messages: [{ key: {...}, message: {...} }] }` |
| `presence.update` | Status online/offline | `{ presences: [{ id: "...", presences: "available" }] }` |
| `groups.update` | Atualizações de grupos | `{ groups: [{ id: "...", subject: "Grupo Nome" }] }` |
| `contacts.update` | Atualizações de contatos | `{ contacts: [{ id: "...", name: "Contato Nome" }] }` |

## 🛠️ Desenvolvimento

### Modo Desenvolvimento

```bash
npm run dev
```

Usa `nodemon` para recarregar automaticamente quando há mudanças.

### Estrutura do Projeto

```
examples/
├── webhook-receiver.js    # Servidor Express
├── package.json          # Dependências e scripts
└── README.md            # Esta documentação
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
PORT=3001  # Porta do servidor (padrão: 3001)
```

### Personalização

Você pode modificar o arquivo `webhook-receiver.js` para:

- Adicionar lógica de negócio específica
- Salvar eventos em banco de dados
- Integrar com outros sistemas
- Adicionar autenticação própria

## 📝 Exemplo de Uso Avançado

```javascript
// Adicionar processamento específico para mensagens
function handleMessagesUpsert(data) {
    data.messages.forEach(msg => {
        if (msg.message?.conversation) {
            // Mensagem de texto
            console.log(`📝 Texto: ${msg.message.conversation}`);
            
            // Salvar no banco
            saveMessage(msg);
        }
        
        if (msg.message?.imageMessage) {
            // Mensagem de imagem
            console.log(`🖼️ Imagem: ${msg.message.imageMessage.url}`);
            
            // Download imagem
            downloadImage(msg.message.imageMessage);
        }
    });
}

// Adicionar autenticação
app.post('/webhook', (req, res) => {
    const webhookSecret = req.headers['x-webhook-secret'];
    
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Processar webhook...
});
```

## 🚨 Segurança

Para produção:

1. **Adicione autenticação** no endpoint de webhook
2. **Valide o payload** recebido
3. **Use HTTPS** em produção
4. **Limite rate** de requisições
5. **Log de auditoria** para debug

## 🤝 Contribuição

1. Fork este repositório
2. Crie uma branch com sua melhoria
3. Abra um Pull Request

## 📞 Suporte

Para dúvidas sobre webhooks do zpwoot:
- 📖 [Documentação completa](../plans/session-routes-documentation.md)
- 🌐 [Swagger UI](http://localhost:3000/api)
- 🐛 [Issues do GitHub](https://github.com/seu-repo/zpwoot/issues)

---

**Desenvolvido com ❤️ para demonstrar webhooks do zpwoot**