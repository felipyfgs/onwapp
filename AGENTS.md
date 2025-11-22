# AGENTE

## Visão Geral do Projeto
- Aplicação backend NestJS v11 minimalista.
- Estrutura modular com `Logger`, `Session`, `Message` e `Whats`.
- Nenhuma lógica de negócio implementada atualmente; serviços são stubs.

## Dependências Principais
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` (NestJS).
- `rxjs` para reatividade.
- Ferramentas de desenvolvimento: `typescript`, `jest`, `eslint`, `prettier`.

## Estrutura de Módulos
| Módulo | Responsabilidade atual | Observações |
| --- | --- | --- |
| `LoggerModule` | Fornece `LoggerService` (vazio). | Utilizado em potencial logging. |
| `SessionModule` | Gerencia sessões via `SessionService`. | Exporta o serviço para uso externo. |
| `MessageModule` | Mensagens através de `MessageService`. | Exporta o serviço. |
| `WhatsModule` | Serviço `WhatsService` criado automaticamente. | Ainda não exporta nada nem é importado. |

## Execução
1. Instalar dependências: `npm install`.
2. Subir servidor: `npm run start` (ou `start:dev`, `start:prod`).
3. Testes: `npm run test` (unit), `npm run test:e2e`, `npm run test:cov`.

## Qualidade e Formatação
- `npm run lint` para ESLint com fix automático.
- `npm run format` para Prettier nos arquivos `.ts`.

## Observações para o Agente
- Atualizar o `WhatsModule` quando houver integrações com providers externos.
- Implementar recursos de logging, sessão e mensagens conforme os requisitos chegarem; hoje são stubs.
- Validar novas dependências no `package.json` e sincronizar com `package-lock.json`.
- Sempre garantir que o `AppModule` importe os módulos necessários e insira controllers/providers quando aplicável.

## Próximos Passos Sugeridos
1. Documentar contratos de cada serviço (métodos esperados).
2. Criar testes unitários básicos para cada serviço e módulo.
3. Incluir controllers para expor funcionalidades via HTTP.
4. Configurar variáveis de ambiente (ex.: porta, URLs externas).
