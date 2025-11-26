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
  @ApiOperation({
    summary: 'Criar label',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: CreateLabelDto })
  @ApiOkResponse({ description: 'Label criada com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao criar label' })
  async createLabel(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateLabelDto,
  ) {
    return this.labelsService.createLabel(sessionId, dto.name, dto.color);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adicionar label a um chat',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: ChatLabelDto })
  @ApiOkResponse({ description: 'Label adicionada ao chat' })
  @ApiBadRequestResponse({ description: 'Erro ao adicionar label' })
  async addChatLabel(
    @Param('sessionId') sessionId: string,
    @Body() dto: ChatLabelDto,
  ) {
    return this.labelsService.addChatLabel(sessionId, dto.chatId, dto.labelId);
  }

  @Delete('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover label de um chat',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: ChatLabelDto })
  @ApiOkResponse({ description: 'Label removida do chat' })
  @ApiBadRequestResponse({ description: 'Erro ao remover label' })
  async removeChatLabel(
    @Param('sessionId') sessionId: string,
    @Body() dto: ChatLabelDto,
  ) {
    return this.labelsService.removeChatLabel(
      sessionId,
      dto.chatId,
      dto.labelId,
    );
  }

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adicionar label a uma mensagem',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: MessageLabelDto })
  @ApiOkResponse({ description: 'Label adicionada à mensagem' })
  @ApiBadRequestResponse({ description: 'Erro ao adicionar label' })
  async addMessageLabel(
    @Param('sessionId') sessionId: string,
    @Body() dto: MessageLabelDto,
  ) {
    return this.labelsService.addMessageLabel(
      sessionId,
      dto.chatId,
      dto.messageId,
      dto.labelId,
    );
  }

  @Delete('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover label de uma mensagem',
    description:
      'Nota: Este método pode não estar disponível na versão atual do whaileys',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiBody({ type: MessageLabelDto })
  @ApiOkResponse({ description: 'Label removida da mensagem' })
  @ApiBadRequestResponse({ description: 'Erro ao remover label' })
  async removeMessageLabel(
    @Param('sessionId') sessionId: string,
    @Body() dto: MessageLabelDto,
  ) {
    return this.labelsService.removeMessageLabel(
      sessionId,
      dto.chatId,
      dto.messageId,
      dto.labelId,
    );
  }
}
