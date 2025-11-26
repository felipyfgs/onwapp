import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiSecurity,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { ArchiveChatDto } from './dto/archive-chat.dto';
import { MuteChatDto } from './dto/mute-chat.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { ClearMessagesDto } from './dto/clear-messages.dto';
import { ReadMessagesDto } from './dto/read-messages.dto';
import { StarMessageDto } from './dto/star-message.dto';
import { FetchHistoryDto } from './dto/fetch-history.dto';
import { SendReceiptDto } from './dto/send-receipt.dto';
import { SendReceiptsDto } from './dto/send-receipts.dto';
import { RequestPlaceholderResendDto } from './dto/request-placeholder-resend.dto';

@ApiTags('Chats')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post(':jid/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Arquivar chat',
    description: 'Arquiva um chat específico',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiBody({ type: ArchiveChatDto })
  @ApiNoContentResponse({ description: 'Chat arquivado com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async archiveChat(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: ArchiveChatDto,
  ): Promise<void> {
    return this.chatsService.archiveChat(sessionId, jid, dto);
  }

  @Post(':jid/unarchive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desarquivar chat',
    description: 'Desarquiva um chat específico',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiBody({ type: ArchiveChatDto })
  @ApiNoContentResponse({ description: 'Chat desarquivado com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async unarchiveChat(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: ArchiveChatDto,
  ): Promise<void> {
    return this.chatsService.unarchiveChat(sessionId, jid, dto);
  }

  @Post(':jid/mute')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Silenciar chat',
    description: 'Silencia notificações de um chat por um período específico',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiBody({ type: MuteChatDto })
  @ApiNoContentResponse({ description: 'Chat silenciado com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async muteChat(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: MuteChatDto,
  ): Promise<void> {
    return this.chatsService.muteChat(sessionId, jid, dto);
  }

  @Post(':jid/unmute')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Dessilenciar chat',
    description: 'Remove o silenciamento de um chat',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiNoContentResponse({ description: 'Chat dessilenciado com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async unmuteChat(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ): Promise<void> {
    return this.chatsService.unmuteChat(sessionId, jid);
  }

  @Post(':jid/pin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Fixar chat',
    description: 'Fixa um chat no topo da lista',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiNoContentResponse({ description: 'Chat fixado com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async pinChat(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ): Promise<void> {
    return this.chatsService.pinChat(sessionId, jid);
  }

  @Post(':jid/unpin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desafixar chat',
    description: 'Remove a fixação de um chat',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiNoContentResponse({ description: 'Chat desafixado com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async unpinChat(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
  ): Promise<void> {
    return this.chatsService.unpinChat(sessionId, jid);
  }

  @Post(':jid/mark-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Marcar chat como lido',
    description: 'Marca todas as mensagens de um chat como lidas',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiBody({ type: MarkReadDto })
  @ApiNoContentResponse({ description: 'Chat marcado como lido' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async markChatRead(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: MarkReadDto,
  ): Promise<void> {
    return this.chatsService.markChatRead(sessionId, jid, dto);
  }

  @Post(':jid/mark-unread')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Marcar chat como não lido',
    description: 'Marca um chat como não lido',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiBody({ type: MarkReadDto })
  @ApiNoContentResponse({ description: 'Chat marcado como não lido' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async markChatUnread(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: MarkReadDto,
  ): Promise<void> {
    return this.chatsService.markChatUnread(sessionId, jid, dto);
  }

  @Delete(':jid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar chat',
    description: 'Deleta um chat completamente',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiBody({ type: ArchiveChatDto })
  @ApiNoContentResponse({ description: 'Chat deletado com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async deleteChat(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: ArchiveChatDto,
  ): Promise<void> {
    return this.chatsService.deleteChat(sessionId, jid, dto);
  }

  @Post(':jid/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Limpar mensagens do chat',
    description:
      'Limpa mensagens de um chat (delete for me). Se nenhuma mensagem específica for fornecida, limpa todas',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiBody({ type: ClearMessagesDto })
  @ApiNoContentResponse({ description: 'Mensagens limpas com sucesso' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async clearMessages(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: ClearMessagesDto,
  ): Promise<void> {
    return this.chatsService.clearMessages(sessionId, jid, dto);
  }

  @Post('read-messages')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Marcar mensagens como lidas',
    description: 'Marca múltiplas mensagens específicas como lidas',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: ReadMessagesDto })
  @ApiNoContentResponse({ description: 'Mensagens marcadas como lidas' })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async readMessages(
    @Param('sessionId') sessionId: string,
    @Body() dto: ReadMessagesDto,
  ): Promise<void> {
    return this.chatsService.readMessages(sessionId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os chats',
    description: 'Retorna a lista de todos os chats da sessão',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiOkResponse({
    description: 'Chats retornados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          unreadCount: { type: 'number' },
          conversationTimestamp: { type: 'number' },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Sessão desconectada' })
  async listChats(@Param('sessionId') sessionId: string): Promise<any[]> {
    return this.chatsService.listChats(sessionId);
  }

  @Post(':jid/star')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Favoritar/desfavoritar mensagem',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'jid', description: 'JID do chat' })
  @ApiBody({ type: StarMessageDto })
  @ApiNoContentResponse({
    description: 'Mensagem favoritada/desfavoritada com sucesso',
  })
  @ApiBadRequestResponse({
    description: 'Sessão desconectada ou método não disponível',
  })
  async starMessage(
    @Param('sessionId') sessionId: string,
    @Param('jid') jid: string,
    @Body() dto: StarMessageDto,
  ): Promise<void> {
    return this.chatsService.starMessage(
      sessionId,
      jid,
      dto.messageId,
      dto.star,
    );
  }

  @Post('history')
  @ApiOperation({
    summary: 'Buscar histórico de mensagens',
    description: 'Solicita mensagens antigas do WhatsApp (assíncrono)',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: FetchHistoryDto })
  @ApiOkResponse({ description: 'Solicitação de histórico enviada' })
  @ApiBadRequestResponse({ description: 'Erro ao buscar histórico' })
  async fetchMessageHistory(
    @Param('sessionId') sessionId: string,
    @Body() dto: FetchHistoryDto,
  ) {
    return this.chatsService.fetchMessageHistory(
      sessionId,
      dto.count,
      dto.oldestMsgId,
      dto.oldestMsgFromMe,
      dto.oldestMsgJid,
      dto.oldestMsgTimestamp,
    );
  }

  @Post('receipt')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Enviar recibo de leitura',
    description: 'Envia recibo de leitura/visualização para mensagens',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendReceiptDto })
  @ApiNoContentResponse({ description: 'Recibo enviado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao enviar recibo' })
  async sendReceipt(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendReceiptDto,
  ): Promise<void> {
    return this.chatsService.sendReceipt(
      sessionId,
      dto.jid,
      dto.participant,
      dto.messageIds,
      dto.type,
    );
  }

  @Post('receipts')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Enviar recibos em lote',
    description: 'Envia recibos de leitura para múltiplas mensagens',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendReceiptsDto })
  @ApiNoContentResponse({ description: 'Recibos enviados com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao enviar recibos' })
  async sendReceipts(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendReceiptsDto,
  ): Promise<void> {
    return this.chatsService.sendReceipts(sessionId, dto.keys, dto.type);
  }

  @Post('placeholder-resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reenviar mensagens placeholder',
    description: 'Solicita reenvio de mensagens que falharam na sincronização',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: RequestPlaceholderResendDto })
  @ApiNoContentResponse({ description: 'Solicitação enviada com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao solicitar reenvio' })
  async requestPlaceholderResend(
    @Param('sessionId') sessionId: string,
    @Body() dto: RequestPlaceholderResendDto,
  ): Promise<void> {
    return this.chatsService.requestPlaceholderResend(
      sessionId,
      dto.messageKeys,
    );
  }
}
