import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { PersistenceService } from './persistence.service';
import { GetChatsDto } from './dto/get-chats.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { GetContactsDto } from './dto/get-contacts.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('sessions/:sessionId')
@UseGuards(ApiKeyGuard)
export class PersistenceController {
  constructor(private readonly persistenceService: PersistenceService) {}

  @Get('chats')
  async getChats(
    @Param('sessionId') sessionId: string,
    @Query() filters: GetChatsDto,
  ) {
    return this.persistenceService.getChats(sessionId, filters);
  }

  @Get('chats/:chatId')
  async getChat(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
  ) {
    return this.persistenceService.getChat(sessionId, chatId);
  }

  @Get('chats/:chatId/messages')
  async getMessages(
    @Param('sessionId') sessionId: string,
    @Param('chatId') chatId: string,
    @Query() filters: GetMessagesDto,
  ) {
    const chat = await this.persistenceService.getChat(sessionId, chatId);
    if (!chat) {
      throw new NotFoundException('Chat não encontrado');
    }

    return this.persistenceService.getMessages(chatId, filters);
  }

  @Get('contacts')
  async getContacts(
    @Param('sessionId') sessionId: string,
    @Query() filters: GetContactsDto,
  ) {
    return this.persistenceService.getContacts(sessionId, filters);
  }
}
