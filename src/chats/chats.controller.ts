import {
  Controller,
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
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ArchiveChatDto } from './dto/archive-chat.dto';
import { MuteChatDto } from './dto/mute-chat.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { ClearMessagesDto } from './dto/clear-messages.dto';
import { ReadMessagesDto } from './dto/read-messages.dto';

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
}
