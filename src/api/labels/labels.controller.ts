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
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LabelsService } from './labels.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CreateLabelDto } from './dto/create-label.dto';
import { ChatLabelDto } from './dto/chat-label.dto';
import { MessageLabelDto } from './dto/message-label.dto';

@ApiTags('Labels')
@ApiSecurity('apikey')
@ApiUnauthorizedResponse({ description: 'API Key inválida ou ausente' })
@UseGuards(ApiKeyGuard)
@Controller('sessions/:sessionId/labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo label' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: CreateLabelDto })
  @ApiOkResponse({ description: 'Label criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao criar label' })
  async addLabel(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateLabelDto,
  ) {
    return this.labelsService.addLabel(sessionId, dto.name, dto.color);
  }

  @Post(':labelId/chats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adicionar label a um chat' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'labelId', description: 'ID do label' })
  @ApiBody({ type: ChatLabelDto })
  @ApiOkResponse({ description: 'Label adicionado ao chat' })
  @ApiBadRequestResponse({ description: 'Erro ao adicionar label' })
  async addChatLabel(
    @Param('sessionId') sessionId: string,
    @Param('labelId') labelId: string,
    @Body() dto: ChatLabelDto,
  ) {
    return this.labelsService.addChatLabel(sessionId, labelId, dto.chatId);
  }

  @Delete(':labelId/chats/:chatId')
  @ApiOperation({ summary: 'Remover label de um chat' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'labelId', description: 'ID do label' })
  @ApiParam({ name: 'chatId', description: 'JID do chat' })
  @ApiOkResponse({ description: 'Label removido do chat' })
  @ApiBadRequestResponse({ description: 'Erro ao remover label' })
  async removeChatLabel(
    @Param('sessionId') sessionId: string,
    @Param('labelId') labelId: string,
    @Param('chatId') chatId: string,
  ) {
    return this.labelsService.removeChatLabel(sessionId, labelId, chatId);
  }

  @Post(':labelId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adicionar label a uma mensagem' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'labelId', description: 'ID do label' })
  @ApiBody({ type: MessageLabelDto })
  @ApiOkResponse({ description: 'Label adicionado à mensagem' })
  @ApiBadRequestResponse({ description: 'Erro ao adicionar label' })
  async addMessageLabel(
    @Param('sessionId') sessionId: string,
    @Param('labelId') labelId: string,
    @Body() dto: MessageLabelDto,
  ) {
    return this.labelsService.addMessageLabel(sessionId, labelId, dto.chatId, dto.messageId);
  }

  @Delete(':labelId/messages/:chatId/:messageId')
  @ApiOperation({ summary: 'Remover label de uma mensagem' })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiParam({ name: 'labelId', description: 'ID do label' })
  @ApiParam({ name: 'chatId', description: 'JID do chat' })
  @ApiParam({ name: 'messageId', description: 'ID da mensagem' })
  @ApiOkResponse({ description: 'Label removido da mensagem' })
  @ApiBadRequestResponse({ description: 'Erro ao remover label' })
  async removeMessageLabel(
    @Param('sessionId') sessionId: string,
    @Param('labelId') labelId: string,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.labelsService.removeMessageLabel(sessionId, labelId, chatId, messageId);
  }
}
