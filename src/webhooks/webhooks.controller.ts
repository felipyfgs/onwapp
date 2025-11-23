import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('webhooks')
@UseGuards(ApiKeyGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  create(@Body() createWebhookDto: CreateWebhookDto) {
    return this.webhooksService.create(createWebhookDto);
  }

  @Get('session/:sessionId')
  findBySession(@Param('sessionId') sessionId: string) {
    return this.webhooksService.findBySessionId(sessionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webhooksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebhookDto: UpdateWebhookDto) {
    return this.webhooksService.update(id, updateWebhookDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.webhooksService.delete(id);
  }
}
