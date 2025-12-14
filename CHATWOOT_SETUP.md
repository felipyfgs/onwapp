# Configuração da Integração Chatwoot no ONWAPP

Este guia explica como configurar a integração entre o ONWAPP e o Chatwoot para sincronizar conversas do WhatsApp.

## 📋 Pré-requisitos

1. **Instância do Chatwoot** rodando (cloud ou self-hosted)
2. **Conta de administrador** no Chatwoot
3. **Sessão do WhatsApp** configurada no ONWAPP
4. **Token de API** do Chatwoot

## 🔧 Passo a Passo da Configuração

### 1. Obter Credenciais do Chatwoot

#### A. URL do Chatwoot
- **Cloud**: `https://app.chatwoot.com`
- **Self-hosted**: Sua URL personalizada (ex: `https://chatwoot.seudominio.com`)

#### B. Gerar Token de API
1. Acesse sua instância do Chatwoot
2. Vá em **Settings** → **API Tokens** (ou **Configurações** → **Tokens de API**)
3. Clique em **Add Token** (ou **Adicionar Token**)
4. Dê um nome descritivo (ex: "ONWAPP Integration")
5. Copie o token gerado (você não poderá vê-lo novamente)

#### C. Obter Account ID e Inbox ID
1. No Chatwoot, vá para **Settings** → **Accounts** (ou **Configurações** → **Contas**)
2. Anote o **Account ID** da conta que deseja usar
3. Vá para **Inboxes** (ou **Caixas de Entrada**)
4. Selecione a inbox que deseja usar e anote o **Inbox ID**

### 2. Configurar no ONWAPP

#### A. Acessar a Configuração
1. No painel do ONWAPP, selecione a sessão do WhatsApp desejada
2. Navegue até a seção **Chatwoot Integration**
3. Clique em **Configure** (ou **Configurar**)

#### B. Preencher os Campos

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Chatwoot URL** | URL completa da sua instância | `https://app.chatwoot.com` |
| **API Access Token** | Token gerado no passo 1.B | `xxxxxxxxxxxxxxxxxxxx` |
| **Account ID** | ID da conta obtido no passo 1.C | `1` |
| **Inbox ID** | ID da inbox obtido no passo 1.C | `1` |

#### C. Validar Credenciais
1. Clique em **Validate Credentials** (ou **Validar Credenciais**)
2. Aguarde a validação
3. Se bem-sucedido, os campos **Account ID** e **Inbox ID** serão preenchidos automaticamente

#### D. Salvar Configuração
1. Clique em **Save Configuration** (ou **Salvar Configuração**)
2. Aguarde a confirmação

### 3. Sincronizar Dados

#### A. Sincronia Inicial
1. Após salvar a configuração, clique em **Sync Now** (ou **Sincronizar Agora**)
2. Aguarde o processo de sincronia:
   - **Contatos**: Todos os contatos do WhatsApp serão importados para o Chatwoot
   - **Mensagens**: Mensagens recentes serão sincronizadas
3. Monitore o progresso na seção **Sync Status**

#### B. Opções de Sincronia
- **Sync Contacts**: Sincroniza apenas contatos
- **Sync Messages**: Sincroniza apenas mensagens
- **Full Sync**: Sincroniza tudo

### 4. Configurações Avançadas

#### A. Opções Disponíveis
- **Auto Reopen**: Reabre automaticamente conversas resolvidas quando recebe nova mensagem
- **Start Pending**: Inicia novas conversas como "pendentes"
- **Merge BR Phones**: Formata números de telefone brasileiros corretamente
- **Sync Contacts**: Habilita sincronia automática de contatos
- **Sync Messages**: Habilita sincronia automática de mensagens
- **Sync Days**: Número de dias de mensagens para sincronizar (opcional)
- **Import as Resolved**: Importa conversas antigas como resolvidas
- **Auto Create**: Cria automaticamente contatos no Chatwoot

#### B. Ignore Chats
Lista de chats (JIDs) para ignorar na sincronização. Útil para:
- Grupos específicos
- Contatos de broadcast
- Newsletters

## 🔍 Verificação e Teste

### 1. Verificar Status
- Acesse **Chatwoot Overview** no ONWAPP
- Confira:
  - Número de contatos sincronizados
  - Número de conversas criadas
  - Data da última sincronia

### 2. Testar Funcionalidades
1. Envie uma mensagem do WhatsApp para um contato sincronizado
2. Verifique se a mensagem aparece no Chatwoot
3. Responda pelo Chatwoot
4. Verifique se a resposta chega no WhatsApp

### 3. Estatísticas
Acesse **Chatwoot Stats** para ver:
- Conversas abertas
- Conversas resolvidas
- Conversas pendentes
- Conversas adiadas

## 🚨 Solução de Problemas

### Problema: "Invalid credentials"
**Solução:**
- Verifique se o URL está correto
- Confirme se o token de API é válido
- Verifique se o token tem permissões suficientes

### Problema: "Sync failed"
**Solução:**
- Verifique a conexão com a internet
- Confirme se o Chatwoot está acessível
- Verifique os logs do ONWAPP para mais detalhes

### Problema: Mensagens não sincronizando
**Solução:**
- Verifique se a inbox está configurada corretamente
- Confirme se o webhook do Chatwoot está funcionando
- Execute uma sincronia manual

### Problema: Contatos duplicados
**Solução:**
- Use a opção **Merge BR Phones** para formatar números corretamente
- Execute **Reset Integration** e sincronize novamente

## 🔄 Gerenciamento Avançado

### Resetar Integração
1. Vá para **Chatwoot Integration**
2. Clique em **Reset Integration**
3. Confirme a ação
4. Isso removerá todos os dados sincronizados
5. Configure novamente e sincronize

### Resolver Todas as Conversas
1. Clique em **Resolve All Conversations**
2. Todas as conversas abertas serão marcadas como resolvidas
3. Útil para limpar o painel após uma sincronia de teste

### Deletar Configuração
1. Clique em **Delete Configuration**
2. Remove completamente a integração
3. Requer configuração novamente para usar

## 📊 Monitoramento

### Status da Sincronia
- **Running**: Sincronia em andamento
- **Completed**: Sincronia concluída com sucesso
- **Failed**: Sincronia falhou (verifique os logs)

### Métricas
- Contatos sincronizados
- Mensagens sincronizadas
- Conversas criadas
- Erros encontrados

## 🔐 Segurança

### Tokens de API
- Mantenha os tokens em segredo
- Gere novos tokens periodicamente
- Revogue tokens não utilizados

### Permissões
- O token precisa de permissão para:
  - Ler contatos
  - Criar e gerenciar conversas
  - Enviar mensagens
  - Acessar webhooks

## 📝 Notas Importantes

1. **Performance**: Sincronias grandes podem levar vários minutos
2. **Limites**: Respeite os limites de API do Chatwoot
3. **Backup**: Sempre faça backup antes de resetar a integração
4. **Logs**: Consulte os logs para diagnóstico de problemas

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do ONWAPP
2. Consulte a documentação do Chatwoot
3. Entre em contato com o suporte

## 📚 Recursos Adicionais

- [Documentação do Chatwoot](https://www.chatwoot.com/docs)
- [API do Chatwoot](https://www.chatwoot.com/developers/api)
- [Documentação do ONWAPP](https://github.com/felipyfgs/onwapp)

---

**Última atualização**: Dezembro 2024
