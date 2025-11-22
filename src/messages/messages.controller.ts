import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
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
import { MessagesService } from './messages.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { MessageResponseDto } from './dto/message-response.dto';
import { SendTextMessageDto } from './dto/send-text-message.dto';
import { SendImageMessageDto } from './dto/send-image-message.dto';
import { SendVideoMessageDto } from './dto/send-video-message.dto';
import { SendAudioMessageDto } from './dto/send-audio-message.dto';
import { SendDocumentMessageDto } from './dto/send-document-message.dto';
import { SendStickerMessageDto } from './dto/send-sticker-message.dto';
import { SendContactMessageDto } from './dto/send-contact-message.dto';
import { SendLocationMessageDto } from './dto/send-location-message.dto';
import { SendReactionMessageDto } from './dto/send-reaction-message.dto';
import { SendForwardMessageDto } from './dto/send-forward-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { SetDisappearingMessagesDto } from './dto/set-disappearing-messages.dto';
import { SendButtonsMessageDto } from './dto/send-buttons-message.dto';
import { SendTemplateMessageDto } from './dto/send-template-message.dto';
import { SendListMessageDto } from './dto/send-list-message.dto';
import { SendPollMessageDto } from './dto/send-poll-message.dto';
import { SendInteractiveMessageDto } from './dto/send-interactive-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { SendLiveLocationMessageDto } from './dto/send-live-location-message.dto';

@ApiTags('Messages')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post(':sessionId/text')
  @ApiOperation({ summary: 'Enviar mensagem de texto' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendTextMessageDto })
  @ApiOkResponse({
    description: 'Mensagem enviada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendTextMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendTextMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendTextMessage(sessionId, dto);
  }

  @Post(':sessionId/image')
  @ApiOperation({ summary: 'Enviar mensagem com imagem' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendImageMessageDto })
  @ApiOkResponse({
    description: 'Imagem enviada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendImageMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendImageMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendImageMessage(sessionId, dto);
  }

  @Post(':sessionId/video')
  @ApiOperation({ summary: 'Enviar mensagem com vídeo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendVideoMessageDto })
  @ApiOkResponse({
    description: 'Vídeo enviado com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendVideoMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendVideoMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendVideoMessage(sessionId, dto);
  }

  @Post(':sessionId/audio')
  @ApiOperation({ summary: 'Enviar mensagem de áudio ou nota de voz' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendAudioMessageDto })
  @ApiOkResponse({
    description: 'Áudio enviado com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendAudioMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendAudioMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendAudioMessage(sessionId, dto);
  }

  @Post(':sessionId/document')
  @ApiOperation({ summary: 'Enviar documento' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendDocumentMessageDto })
  @ApiOkResponse({
    description: 'Documento enviado com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendDocumentMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendDocumentMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendDocumentMessage(sessionId, dto);
  }

  @Post(':sessionId/sticker')
  @ApiOperation({ summary: 'Enviar sticker' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendStickerMessageDto })
  @ApiOkResponse({
    description: 'Sticker enviado com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendStickerMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendStickerMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendStickerMessage(sessionId, dto);
  }

  @Post(':sessionId/contact')
  @ApiOperation({ summary: 'Enviar contato(s)' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendContactMessageDto })
  @ApiOkResponse({
    description: 'Contato enviado com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendContactMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendContactMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendContactMessage(sessionId, dto);
  }

  @Post(':sessionId/location')
  @ApiOperation({ summary: 'Enviar localização' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendLocationMessageDto })
  @ApiOkResponse({
    description: 'Localização enviada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendLocationMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendLocationMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendLocationMessage(sessionId, dto);
  }

  @Post(':sessionId/react')
  @ApiOperation({ summary: 'Reagir a uma mensagem' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendReactionMessageDto })
  @ApiOkResponse({
    description: 'Reação enviada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendReaction(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendReactionMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendReaction(sessionId, dto);
  }

  @Post(':sessionId/forward')
  @ApiOperation({ summary: 'Encaminhar mensagem' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendForwardMessageDto })
  @ApiOkResponse({
    description: 'Mensagem encaminhada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Funcionalidade não implementada ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async forwardMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendForwardMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.forwardMessage(sessionId, dto);
  }

  @Delete(':sessionId/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar mensagem para todos' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: DeleteMessageDto })
  @ApiNoContentResponse({ description: 'Mensagem deletada com sucesso' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async deleteMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: DeleteMessageDto,
  ): Promise<void> {
    return this.messagesService.deleteMessage(sessionId, dto);
  }

  @Post(':sessionId/disappearing')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Configurar mensagens efêmeras em um chat' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SetDisappearingMessagesDto })
  @ApiNoContentResponse({ description: 'Configuração aplicada com sucesso' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async setDisappearingMessages(
    @Param('sessionId') sessionId: string,
    @Body() dto: SetDisappearingMessagesDto,
  ): Promise<void> {
    return this.messagesService.setDisappearingMessages(sessionId, dto);
  }

  @Post(':sessionId/buttons')
  @ApiOperation({ summary: 'Enviar mensagem com botões interativos' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendButtonsMessageDto })
  @ApiOkResponse({
    description: 'Mensagem com botões enviada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendButtonsMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendButtonsMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendButtonsMessage(sessionId, dto);
  }

  @Post(':sessionId/template')
  @ApiOperation({ summary: 'Enviar mensagem com template buttons' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendTemplateMessageDto })
  @ApiOkResponse({
    description: 'Template enviado com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendTemplateMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendTemplateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendTemplateMessage(sessionId, dto);
  }

  @Post(':sessionId/list')
  @ApiOperation({ summary: 'Enviar mensagem com lista de opções' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendListMessageDto })
  @ApiOkResponse({
    description: 'Lista enviada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendListMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendListMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendListMessage(sessionId, dto);
  }

  @Post(':sessionId/poll')
  @ApiOperation({ summary: 'Enviar enquete' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendPollMessageDto })
  @ApiOkResponse({
    description: 'Enquete enviada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendPollMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendPollMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendPollMessage(sessionId, dto);
  }

  @Post(':sessionId/interactive')
  @ApiOperation({ summary: 'Enviar mensagem interativa avançada' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendInteractiveMessageDto })
  @ApiOkResponse({
    description: 'Mensagem interativa enviada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendInteractiveMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendInteractiveMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendInteractiveMessage(sessionId, dto);
  }

  @Post(':sessionId/edit')
  @ApiOperation({ summary: 'Editar mensagem enviada' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: EditMessageDto })
  @ApiOkResponse({
    description: 'Mensagem editada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async editMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: EditMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.editMessage(sessionId, dto);
  }

  @Post(':sessionId/live-location')
  @ApiOperation({ summary: 'Enviar localização ao vivo' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: SendLiveLocationMessageDto })
  @ApiOkResponse({
    description: 'Localização ao vivo enviada com sucesso',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou sessão desconectada',
  })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  async sendLiveLocationMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendLiveLocationMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.sendLiveLocationMessage(sessionId, dto);
  }
}
