import { Controller, Post, Param, Body } from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { WAProto as proto } from '@fadzzzslebew/baileys';
import { MessagesService } from './messages.service';
import {
  SendTextDto,
  SendImageDto,
  SendVideoDto,
  SendAudioDto,
  SendDocumentDto,
  SendLocationDto,
  SendContactDto,
  SendStickerDto,
  SendReactionDto,
  SendButtonsDto,
  SendListDto,
  SendTemplateDto,
  SendPollDto,
  EditMessageDto,
  ForwardMessageDto,
  DeleteMessageDto,
  DeleteMessageForMeDto,
  ReadMessagesDto,
  MessageResponseDto,
  UpdateMediaMessageDto,
  FetchMessageHistoryDto,
  SendReceiptDto,
  SendReceiptsDto,
  RequestPlaceholderResendDto,
  SendCarouselDto,
} from './dto';

@ApiTags('Messages')
@ApiSecurity('apikey')
@Controller('sessions/:name/send')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('text')
  @ApiOperation({ summary: 'Send a text message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Message sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendText(
    @Param('name') name: string,
    @Body() dto: SendTextDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendText(name, dto);
  }

  @Post('image')
  @ApiOperation({ summary: 'Send an image message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Image sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendImage(
    @Param('name') name: string,
    @Body() dto: SendImageDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendImage(name, dto);
  }

  @Post('video')
  @ApiOperation({ summary: 'Send a video message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Video sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendVideo(
    @Param('name') name: string,
    @Body() dto: SendVideoDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendVideo(name, dto);
  }

  @Post('audio')
  @ApiOperation({ summary: 'Send an audio message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Audio sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendAudio(
    @Param('name') name: string,
    @Body() dto: SendAudioDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendAudio(name, dto);
  }

  @Post('document')
  @ApiOperation({ summary: 'Send a document message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Document sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendDocument(
    @Param('name') name: string,
    @Body() dto: SendDocumentDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendDocument(name, dto);
  }

  @Post('location')
  @ApiOperation({ summary: 'Send a location message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Location sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendLocation(
    @Param('name') name: string,
    @Body() dto: SendLocationDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendLocation(name, dto);
  }

  @Post('contact')
  @ApiOperation({ summary: 'Send a contact card (vCard)' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Contact sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendContact(
    @Param('name') name: string,
    @Body() dto: SendContactDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendContact(name, dto);
  }

  @Post('sticker')
  @ApiOperation({ summary: 'Send a sticker message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Sticker sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendSticker(
    @Param('name') name: string,
    @Body() dto: SendStickerDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendSticker(name, dto);
  }

  @Post('reaction')
  @ApiOperation({ summary: 'Send a reaction to a message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Reaction sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendReaction(
    @Param('name') name: string,
    @Body() dto: SendReactionDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendReaction(name, dto);
  }

  @Post('buttons')
  @ApiOperation({ summary: 'Send a message with buttons' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Buttons message sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendButtons(
    @Param('name') name: string,
    @Body() dto: SendButtonsDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendButtons(name, dto);
  }

  @Post('list')
  @ApiOperation({ summary: 'Send a list message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'List message sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendList(
    @Param('name') name: string,
    @Body() dto: SendListDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendList(name, dto);
  }

  @Post('template')
  @ApiOperation({ summary: 'Send a template message with buttons' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Template message sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendTemplate(
    @Param('name') name: string,
    @Body() dto: SendTemplateDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendTemplate(name, dto);
  }

  @Post('carousel')
  @ApiOperation({ summary: 'Send a carousel message with interactive cards' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Carousel message sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendCarousel(
    @Param('name') name: string,
    @Body() dto: SendCarouselDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendCarousel(name, dto);
  }

  @Post('forward')
  @ApiOperation({ summary: 'Forward a message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Message forwarded',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async forwardMessage(
    @Param('name') name: string,
    @Body() dto: ForwardMessageDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.forwardMessage(name, dto);
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete a message for everyone' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async deleteMessage(
    @Param('name') name: string,
    @Body() dto: DeleteMessageDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.deleteMessage(name, dto);
  }

  @Post('delete-for-me')
  @ApiOperation({ summary: 'Delete a message only for yourself' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({ status: 200, description: 'Message deleted for you' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async deleteMessageForMe(
    @Param('name') name: string,
    @Body() dto: DeleteMessageForMeDto,
  ): Promise<{ success: boolean }> {
    await this.messagesService.deleteMessageForMe(name, dto);
    return { success: true };
  }

  @Post('read')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async readMessages(
    @Param('name') name: string,
    @Body() dto: ReadMessagesDto,
  ): Promise<{ success: boolean }> {
    await this.messagesService.readMessages(name, dto);
    return { success: true };
  }

  @Post('poll')
  @ApiOperation({ summary: 'Send a poll message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Poll sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendPoll(
    @Param('name') name: string,
    @Body() dto: SendPollDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.sendPoll(name, dto);
  }

  @Post('edit')
  @ApiOperation({ summary: 'Edit a previously sent message' })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Message edited',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async editMessage(
    @Param('name') name: string,
    @Body() dto: EditMessageDto,
  ): Promise<proto.WebMessageInfo | undefined> {
    return this.messagesService.editMessage(name, dto);
  }

  @Post('update-media')
  @ApiOperation({
    summary: 'Re-upload expired media',
    description:
      'Re-upload media that has expired. Returns a new message with fresh media URL.',
  })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Media updated',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async updateMediaMessage(
    @Param('name') name: string,
    @Body() dto: UpdateMediaMessageDto,
  ) {
    return this.messagesService.updateMediaMessage(name, dto);
  }

  @Post('fetch-history')
  @ApiOperation({
    summary: 'Fetch message history',
    description:
      'Retrieve message history from a chat. Can be paginated using oldestMsgKey.',
  })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({ status: 200, description: 'Message history retrieved' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async fetchMessageHistory(
    @Param('name') name: string,
    @Body() dto: FetchMessageHistoryDto,
  ) {
    return this.messagesService.fetchMessageHistory(name, dto);
  }

  @Post('receipt')
  @ApiOperation({
    summary: 'Send a custom receipt',
    description: 'Send read/played receipts for specific messages',
  })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({ status: 200, description: 'Receipt sent' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendReceipt(
    @Param('name') name: string,
    @Body() dto: SendReceiptDto,
  ): Promise<{ success: boolean }> {
    await this.messagesService.sendReceipt(name, dto);
    return { success: true };
  }

  @Post('receipts')
  @ApiOperation({
    summary: 'Send receipts in batch',
    description:
      'Send receipts for multiple messages at once using message keys',
  })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({ status: 200, description: 'Receipts sent' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async sendReceipts(
    @Param('name') name: string,
    @Body() dto: SendReceiptsDto,
  ): Promise<{ success: boolean }> {
    await this.messagesService.sendReceipts(name, dto);
    return { success: true };
  }

  @Post('request-placeholder-resend')
  @ApiOperation({
    summary: 'Request resend of placeholder messages',
    description:
      'Request WhatsApp to resend messages that failed to decrypt or were received as placeholders',
  })
  @ApiParam({ name: 'name', description: 'Session name' })
  @ApiResponse({ status: 200, description: 'Resend requested' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Session not connected' })
  async requestPlaceholderResend(
    @Param('name') name: string,
    @Body() dto: RequestPlaceholderResendDto,
  ): Promise<void> {
    await this.messagesService.requestPlaceholderResend(name, dto);
  }
}
