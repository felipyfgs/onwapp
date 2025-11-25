# Guia de Implementação JID/LID - Zpwoot WhatsApp API

## 🔍 Análise Completa

### 1. Situação Atual

#### Biblioteca Whaileys 6.4.2
- **Tratamento nativo de JID/LID**: Implementa todas as funções necessárias para manipulação de identificadores WhatsApp
- **Funções principais disponíveis**:
  - `jidNormalizedUser()`: Normaliza JIDs para formato padrão
  - `jidDecode()`: Decodifica JID em componentes (user, server, device)
  - `isLidUser()`: Verifica se é um número oculto (LID)
  - `areJidsSameUser()`: Compara se dois JIDs representam o mesmo usuário
- **Formatos suportados**:
  - `@s.whatsapp.net` - Usuários padrão
  - `@g.us` - Grupos
  - `@lid` - Números ocultos (Local IDs)
  - `@broadcast` - Listas de broadcast
  - `@newsletter` - Newsletters

#### Projeto Zpwoot
- **Pontos fortes**:
  - Estrutura de DTOs bem definida
  - Integração com Prisma para persistência
  - Uso da versão estável do Whaileys
- **Gaps identificados**:
  - Validação insuficiente nos DTOs
  - Falta de normalização consistente de JIDs
  - Ausência de tratamento específico para LID
  - Persistência inconsistente no banco de dados
  - Webhooks sem formatação padronizada

---

### 2. Gaps Identificados e Soluções

| Componente | Problema Identificado | Solução Proposta | Prioridade |
|------------|-----------------------|------------------|------------|
| **DTOs** | Validação básica apenas para array de strings | Adicionar `@Transform()` e validação customizada com mensagens claras | Alta |
| **Services** | Falta de normalização consistente | Implementar `JidUtils.normalize()` em todos os métodos | Alta |
| **Persistência** | Schema inconsistente para JIDs | Adicionar campos `jid`, `lid`, `phone` no Prisma com índices apropriados | Média |
| **Webhooks** | Formato não padronizado | Implementar normalização no payload antes do envio | Média |
| **Logging** | Falta de contexto JID | Adicionar metadados de JID nos logs estruturados | Baixa |

---

### 3. Implementação Recomendada

#### 3.1 Core JID Handler (`src/common/utils/jid-utils.ts`)

```typescript
import { jidNormalizedUser, jidDecode, isLidUser } from 'whaileys/lib/WABinary';

/**
 * Utilitário para manipulação consistente de JIDs
 * Garante compatibilidade com todos os formatos WhatsApp
 */
export class JidUtils {
  /**
   * Normaliza qualquer JID para formato padrão
   * @param jid JID ou número de telefone
   * @returns JID normalizado (ex: 5511999999999@s.whatsapp.net)
   */
  static normalize(jid: string): string {
    // Remove caracteres não permitidos
    const cleanJid = jid.replace(/[^0-9@\.\-_]/g, '');

    // Normaliza usando função nativa do Whaileys
    return jidNormalizedUser(cleanJid);
  }

  /**
   * Valida se um JID está em formato correto
   * @param jid JID a ser validado
   * @returns true se válido, false caso contrário
   */
  static validate(jid: string): boolean {
    try {
      const normalized = this.normalize(jid);
      return !!normalized && (
        normalized.includes('@s.whatsapp.net') ||
        normalized.includes('@g.us') ||
        normalized.includes('@lid') ||
        normalized.includes('@broadcast')
      );
    } catch {
      return false;
    }
  }

  /**
   * Verifica se um JID é um número oculto (LID)
   * @param jid JID a ser verificado
   * @returns true se for LID, false caso contrário
   */
  static isLid(jid: string): boolean {
    return isLidUser(jid);
  }

  /**
   * Extrai o número de telefone de um JID
   * @param jid JID de entrada
   * @returns Número de telefone (ex: 5511999999999)
   */
  static getPhoneNumber(jid: string): string {
    const decoded = jidDecode(jid);
    return decoded?.user || jid.split('@')[0];
  }

  /**
   * Formata JID para logging estruturado
   * @param jid JID a ser formatado
   * @returns Objeto com componentes do JID para logging
   */
  static forLogging(jid: string): Record<string, string> {
    const normalized = this.normalize(jid);
    const decoded = jidDecode(normalized);

    return {
      jid: normalized,
      user: decoded?.user || '',
      server: decoded?.server || '',
      isLid: this.isLid(normalized).toString(),
      phoneNumber: this.getPhoneNumber(normalized)
    };
  }
}
```

#### 3.2 DTOs Atualizados

**Exemplo: `src/contacts/dto/validate-number.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, ArrayMinSize, Validate } from 'class-validator';
import { JidUtils } from '../../common/utils/jid-utils';

export class ValidateNumberDto {
  @ApiProperty({
    description: 'Lista de números de telefone ou JIDs para validar. ' +
                 'Formatos aceitos: 5511999999999, 5511999999999@s.whatsapp.net, 5511999999999@lid',
    example: ['5511999999999', '5521888888888@s.whatsapp.net'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) => value.map(JidUtils.normalize))
  @Validate((jid: string) => JidUtils.validate(jid), {
    each: true,
    message: 'JID inválido. Formatos aceitos: ' +
             '5511999999999, 5511999999999@s.whatsapp.net ou 5511999999999@lid'
  })
  numbers: string[];
}
```

**Exemplo: `src/messages/dto/send-text-message.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { SendMessageBaseDto } from './send-message-base.dto';
import { JidUtils } from '../../common/utils/jid-utils';

export class SendTextMessageDto extends SendMessageBaseDto {
  @ApiProperty({
    description: 'Texto da mensagem',
    example: 'Olá! Como vai?',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'JIDs mencionados na mensagem (devem ser JIDs normalizados)',
    required: false,
    type: [String],
    example: ['5511999999999@s.whatsapp.net'],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.map(JidUtils.normalize))
  @Validate((jid: string) => JidUtils.validate(jid), {
    each: true,
    message: 'Mention JID inválido. Use formato: 5511999999999@s.whatsapp.net'
  })
  mentions?: string[];
}
```

#### 3.3 Schema Prisma Atualizado

```prisma
model Contact {
  id          String   @id @default(uuid())
  sessionId   String
  jid         String   @unique
  lid         String?
  phone       String
  name        String?
  isBusiness  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Índices para performance
  @@index([sessionId])
  @@index([jid])
  @@index([phone])
}

model Message {
  id            String   @id @default(uuid())
  sessionId     String
  jid           String   // JID normalizado do destinatário
  remoteJid     String   // JID original recebido
  messageId     String   @unique
  messageType   String
  content       Json
  status        MessageStatus @default(pending)
  isFromMe      Boolean
  isLid         Boolean  @default(false)
  phoneNumber   String?  // Número extraído do JID
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([sessionId])
  @@index([jid])
  @@index([remoteJid])
  @@index([status])
}
```

#### 3.4 Service Layer Atualizado

**Exemplo: `src/contacts/contacts.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ValidateNumberDto } from './dto/validate-number.dto';
import { ValidateNumberResponseDto } from './dto/validate-number-response.dto';
import { JidUtils } from '../common/utils/jid-utils';
import { validateSocket } from '../common/utils/socket-validator';

@Injectable()
export class ContactsService {
  constructor(private readonly whatsappService: WhatsAppService) {}

  async validateNumbers(
    sessionId: string,
    dto: ValidateNumberDto,
  ): Promise<ValidateNumberResponseDto> {
    const socket = this.whatsappService.getSocket(sessionId);
    validateSocket(socket);

    // Normalização já feita pelo DTO, mas garantindo consistência
    const normalizedNumbers = dto.numbers.map(JidUtils.normalize);

    const results = await socket.onWhatsApp(...normalizedNumbers);

    return {
      results: results.map((result) => ({
        jid: JidUtils.normalize(result.jid),
        exists: result.exists,
        lid: result.lid || (JidUtils.isLid(result.jid) ? result.jid : undefined),
        phoneNumber: JidUtils.getPhoneNumber(result.jid),
        isBusiness: result.isBusiness || false
      })),
    };
  }

  // ... outros métodos
}
```

#### 3.5 Webhooks Padronizados

**Exemplo: `src/webhooks/webhooks.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { JidUtils } from '../common/utils/jid-utils';

@Injectable()
export class WebhooksService {
  private formatWebhookPayload(event: string, data: any) {
    const formatted = { ...data, event };

    // Normaliza todos os JIDs no payload
    const normalizeJids = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (key.endsWith('Jid') || key.endsWith('jid') || key === 'from' || key === 'to') {
            obj[key] = JidUtils.normalize(obj[key]);
            // Adiciona metadados para debugging
            obj[`${key}Metadata`] = JidUtils.forLogging(obj[key]);
          } else if (typeof obj[key] === 'object') {
            normalizeJids(obj[key]);
          }
        }
      }
    };

    normalizeJids(formatted);
    return formatted;
  }

  // ... outros métodos
}
```

---

### 4. Community Patterns e Melhores Práticas

#### 4.1 Padrões Adotados pela Comunidade

| Biblioteca | Abordagem | Destaques |
|------------|-----------|-----------|
| **Baileys/WhiskeySockets** | `jidNormalizedUser()` como padrão | Funções nativas para todos os formatos |
| **Venom Bot** | Validação com regex + normalização | Tratamento agressivo de caracteres inválidos |
| **WA-JS** | LID como first-class citizen | Suporte completo para números ocultos |
| **WA-Automate** | Cache de conversões | Otimização de performance |

#### 4.2 Soluções para Problemas Comuns

**Problema: LID não resolvido**
```typescript
// Solução: Usar função específica do Whaileys
const lidJid = await socket.getLidFromJid(jid);
if (lidJid) {
  // Tratar como LID
}
```

**Problema: JID inválido recebido**
```typescript
// Solução: Implementar retry com normalização
try {
  const normalized = JidUtils.normalize(jid);
  await socket.sendMessage(normalized, message);
} catch (error) {
  if (error.message.includes('invalid jid')) {
    const phoneOnly = jid.replace(/\D/g, '');
    const fallbackJid = `${phoneOnly}@s.whatsapp.net`;
    await socket.sendMessage(fallbackJid, message);
  }
}
```

**Problema: Performance em bulk operations**
```typescript
// Solução: Cache de conversões
const jidCache = new Map<string, string>();

function getNormalizedJid(jid: string): string {
  if (!jidCache.has(jid)) {
    jidCache.set(jid, JidUtils.normalize(jid));
  }
  return jidCache.get(jid)!;
}
```

#### 4.3 Formatos de JID Suportados

| Formato | Exemplo | Descrição |
|---------|---------|-----------|
| **Padrão** | `5511999999999@s.whatsapp.net` | Formato tradicional |
| **Grupo** | `123456789-123456@g.us` | Grupos WhatsApp |
| **LID** | `5511999999999@lid` | Números ocultos |
| **Broadcast** | `1234567890@broadcast` | Listas de broadcast |
| **Newsletter** | `1234567890@newsletter` | Newsletters |
| **Multi-device** | `5511999999999:1234@s.whatsapp.net` | Com device ID |
| **Agente** | `5511999999999_123@s.whatsapp.net` | Com agent ID |

---

### 5. Testes Recomendados

#### 5.1 Testes Unitários para JidUtils

```typescript
import { JidUtils } from '../src/common/utils/jid-utils';

describe('JidUtils', () => {
  describe('normalize', () => {
    it('deve normalizar JIDs padrão', () => {
      expect(JidUtils.normalize('5511999999999@c.us'))
        .toBe('5511999999999@s.whatsapp.net');
      expect(JidUtils.normalize('5511999999999'))
        .toBe('5511999999999@s.whatsapp.net');
    });

    it('deve lidar com LIDs', () => {
      expect(JidUtils.normalize('5511999999999@lid'))
        .toBe('5511999999999@lid');
    });

    it('deve manter grupos intactos', () => {
      expect(JidUtils.normalize('123456789-123456@g.us'))
        .toBe('123456789-123456@g.us');
    });
  });

  describe('validate', () => {
    it('deve validar JIDs corretos', () => {
      expect(JidUtils.validate('5511999999999@s.whatsapp.net')).toBe(true);
      expect(JidUtils.validate('5511999999999@lid')).toBe(true);
      expect(JidUtils.validate('123456789-123456@g.us')).toBe(true);
    });

    it('deve rejeitar JIDs inválidos', () => {
      expect(JidUtils.validate('invalid@jid')).toBe(false);
      expect(JidUtils.validate('5511999999999@invalid.net')).toBe(false);
    });
  });

  describe('isLid', () => {
    it('deve identificar LIDs corretamente', () => {
      expect(JidUtils.isLid('5511999999999@lid')).toBe(true);
      expect(JidUtils.isLid('5511999999999@s.whatsapp.net')).toBe(false);
    });
  });

  describe('getPhoneNumber', () => {
    it('deve extrair número de telefone', () => {
      expect(JidUtils.getPhoneNumber('5511999999999@s.whatsapp.net'))
        .toBe('5511999999999');
      expect(JidUtils.getPhoneNumber('5511999999999@lid'))
        .toBe('5511999999999');
    });
  });
});
```

#### 5.2 Testes de Integração

```typescript
describe('ContactsService', () => {
  let service: ContactsService;
  let whatsappService: WhatsAppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: WhatsAppService,
          useValue: {
            getSocket: jest.fn().mockReturnValue({
              onWhatsApp: jest.fn().mockResolvedValue([
                { jid: '5511999999999@s.whatsapp.net', exists: true },
                { jid: '5511888888888@lid', exists: true, lid: '5511888888888@lid' }
              ])
            })
          }
        }
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    whatsappService = module.get<WhatsAppService>(WhatsAppService);
  });

  it('deve normalizar JIDs na validação de números', async () => {
    const result = await service.validateNumbers('session1', {
      numbers: ['5511999999999', '5511888888888@lid']
    });

    expect(result.results[0].jid).toBe('5511999999999@s.whatsapp.net');
    expect(result.results[1].lid).toBe('5511888888888@lid');
  });
});
```

---

### 6. Cronograma de Implementação

| Fase | Atividade | Duração | Responsável | Status |
|------|-----------|---------|-------------|--------|
| 1 | Implementar JidUtils | 1 dia | Desenvolvedor Backend | ✅ Pronto |
| 2 | Atualizar DTOs com validação | 1 dia | Desenvolvedor Backend | 📝 Em andamento |
| 3 | Modificar Services para usar normalização | 1 dia | Desenvolvedor Backend | ⏳ Pendente |
| 4 | Atualizar Schema Prisma | 0.5 dia | DBA/Desenvolvedor | ⏳ Pendente |
| 5 | Implementar normalização em Webhooks | 0.5 dia | Desenvolvedor Backend | ⏳ Pendente |
| 6 | Criar testes unitários | 1 dia | QA/Desenvolvedor | ⏳ Pendente |
| 7 | Testes de integração | 1 dia | QA | ⏳ Pendente |
| 8 | Documentação e revisão | 0.5 dia | Tech Writer | ⏳ Pendente |

---

### 7. Checklist de Implementação

#### 7.1 Backend
- [ ] Implementar `JidUtils` em `src/common/utils/`
- [ ] Atualizar todos os DTOs com validação e transformação
- [ ] Modificar services para usar normalização consistente
- [ ] Atualizar schema do Prisma com campos apropriados
- [ ] Implementar normalização em webhooks
- [ ] Adicionar logging estruturado para JIDs

#### 7.2 Frontend (se aplicável)
- [ ] Atualizar documentação da API com exemplos de JID
- [ ] Adicionar validação de entrada para formatos JID
- [ ] Exibir metadados de JID em interfaces de debugging

#### 7.3 Testes
- [ ] Criar testes unitários para `JidUtils`
- [ ] Criar testes de integração para services
- [ ] Testar cenários de LID e números ocultos
- [ ] Testar performance em bulk operations

#### 7.4 Documentação
- [ ] Atualizar documentação técnica com novos formatos
- [ ] Documentar migração para novos campos no Prisma
- [ ] Criar exemplos de uso para diferentes formatos JID
- [ ] Documentar troubleshooting para problemas comuns

---

### 8. Troubleshooting

#### 8.1 Problemas Comuns e Soluções

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| **JID inválido** | Formato incorreto ou caracteres inválidos | Usar `JidUtils.normalize()` e validar entrada |
| **LID não reconhecido** | Número oculto não tratado | Verificar `isLidUser()` e usar `getLidFromJid()` |
| **Mensagem não entregue** | JID mal formatado | Implementar fallback para número de telefone |
| **Performance lenta** | Normalização repetida | Implementar cache de conversões |
| **Erro de persistência** | Schema desatualizado | Atualizar schema do Prisma com novos campos |

#### 8.2 Logs para Debugging

**Exemplo de log estruturado:**
```json
{
  "level": "info",
  "time": "2025-11-25T13:24:24.000Z",
  "context": "MessagesService",
  "msg": "Mensagem enviada com sucesso",
  "jidMetadata": {
    "jid": "5511999999999@s.whatsapp.net",
    "user": "5511999999999",
    "server": "s.whatsapp.net",
    "isLid": "false",
    "phoneNumber": "5511999999999"
  },
  "messageId": "ABC123",
  "sessionId": "session1"
}
```

---

### 9. Referências

1. [Documentação Oficial Whaileys](https://github.com/canove/whaileys)
2. [Baileys - WhatsApp Web API](https://github.com/WhiskeySockets/Baileys)
3. [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
4. [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/schema-reference)
5. [NestJS Validation Documentation](https://docs.nestjs.com/techniques/validation)

---

### 10. Histórico de Versões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 25/11/2025 | Cline AI | Versão inicial com análise completa |
| 1.1 | - | - | - |

---

**Próximos Passos:**
1. Implementar `JidUtils` como utilitário central
2. Atualizar DTOs com validação robusta
3. Modificar services para usar normalização consistente
4. Ajustar schema do Prisma
