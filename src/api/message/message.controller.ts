import { Controller, Post, Param, Body } from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { proto } from 'whaileys';
import { MessageService } from './message.service';
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
  ForwardMessageDto,
  DeleteMessageDto,
  DeleteMessageForMeDto,
  ReadMessagesDto,
  MessageResponseDto,
} from './dto';

@ApiTags('Messages')
@ApiSecurity('apikey')
@Controller('sessions/:name/send')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

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
    return this.messageService.sendText(name, dto);
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
    return this.messageService.sendImage(name, dto);
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
    return this.messageService.sendVideo(name, dto);
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
    return this.messageService.sendAudio(name, dto);
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
    return this.messageService.sendDocument(name, dto);
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
    return this.messageService.sendLocation(name, dto);
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
    return this.messageService.sendContact(name, dto);
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
    return this.messageService.sendSticker(name, dto);
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
    return this.messageService.sendReaction(name, dto);
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
    return this.messageService.sendButtons(name, dto);
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
    return this.messageService.sendList(name, dto);
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
    return this.messageService.sendTemplate(name, dto);
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
    return this.messageService.forwardMessage(name, dto);
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
    return this.messageService.deleteMessage(name, dto);
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
    await this.messageService.deleteMessageForMe(name, dto);
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
    await this.messageService.readMessages(name, dto);
    return { success: true };
  }
}
