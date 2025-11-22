import { Injectable } from '@nestjs/common';
import { WAMessage } from 'whaileys/lib/Types';

@Injectable()
export class MessageService {
  async handleMessage(message: WAMessage) {
    await Promise.resolve();
    console.log('Mensagem recebida', message.key?.id);
  }
}
