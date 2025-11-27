import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import {
  ArchiveChatDto,
  MuteChatDto,
  PinChatDto,
  MarkReadDto,
  ChatJidDto,
  SuccessResponseDto,
  DisappearingMessagesDto,
  StarMessageDto,
} from './dto';

@ApiTags('Chats')
@ApiSecurity('apikey')
@Controller('sessions/:session/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('archive')
  @ApiOperation({ summary: 'Archive or unarchive a chat' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Chat archived/unarchived',
    type: SuccessResponseDto,
  })
  async archive(
    @Param('session') session: string,
    @Body() dto: ArchiveChatDto,
  ): Promise<SuccessResponseDto> {
    await this.chatsService.archive(session, dto.jid, dto.archive);
    return { success: true };
  }

  @Post('mute')
  @ApiOperation({ summary: 'Mute or unmute a chat' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Chat muted/unmuted',
    type: SuccessResponseDto,
  })
  async mute(
    @Param('session') session: string,
    @Body() dto: MuteChatDto,
  ): Promise<SuccessResponseDto> {
    await this.chatsService.mute(session, dto.jid, dto.mute ?? null);
    return { success: true };
  }

  @Post('pin')
  @ApiOperation({ summary: 'Pin or unpin a chat' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Chat pinned/unpinned',
    type: SuccessResponseDto,
  })
  async pin(
    @Param('session') session: string,
    @Body() dto: PinChatDto,
  ): Promise<SuccessResponseDto> {
    await this.chatsService.pin(session, dto.jid, dto.pin);
    return { success: true };
  }

  @Post('read')
  @ApiOperation({ summary: 'Mark chat as read or unread' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Chat marked read/unread',
    type: SuccessResponseDto,
  })
  async markRead(
    @Param('session') session: string,
    @Body() dto: MarkReadDto,
  ): Promise<SuccessResponseDto> {
    await this.chatsService.markRead(session, dto.jid, dto.read);
    return { success: true };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a chat' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted',
    type: SuccessResponseDto,
  })
  async delete(
    @Param('session') session: string,
    @Body() dto: ChatJidDto,
  ): Promise<SuccessResponseDto> {
    await this.chatsService.delete(session, dto.jid);
    return { success: true };
  }

  @Post('disappearing')
  @ApiOperation({ summary: 'Set disappearing messages for a chat' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Disappearing messages configured',
    type: SuccessResponseDto,
  })
  async setDisappearingMessages(
    @Param('session') session: string,
    @Body() dto: DisappearingMessagesDto,
  ): Promise<SuccessResponseDto> {
    await this.chatsService.setDisappearingMessages(
      session,
      dto.jid,
      dto.expiration,
    );
    return { success: true };
  }

  @Post('star')
  @ApiOperation({ summary: 'Star or unstar a message' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Message starred/unstarred',
    type: SuccessResponseDto,
  })
  async starMessage(
    @Param('session') session: string,
    @Body() dto: StarMessageDto,
  ): Promise<SuccessResponseDto> {
    await this.chatsService.starMessage(
      session,
      dto.jid,
      dto.messageId,
      dto.star,
    );
    return { success: true };
  }

  @Post('clear')
  @ApiOperation({ summary: 'Clear all messages in a chat' })
  @ApiParam({ name: 'session', description: 'Session name' })
  @ApiResponse({
    status: 200,
    description: 'Messages cleared',
    type: SuccessResponseDto,
  })
  async clearMessages(
    @Param('session') session: string,
    @Body() dto: ChatJidDto,
  ): Promise<SuccessResponseDto> {
    await this.chatsService.clearMessages(session, dto.jid);
    return { success: true };
  }
}
