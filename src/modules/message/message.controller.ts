import { Controller } from '@nestjs/common';
import { MessageService } from './message.service.js';

@Controller('message')
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    // Add your routes here
}
