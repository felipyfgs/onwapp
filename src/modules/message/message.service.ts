import { Injectable } from '@nestjs/common';
import type { WAMessage } from 'whaileys/lib/Types';

@Injectable()
export class MessageService {
  handleMessage(message: WAMessage) {
    void message;
    // TODO: implementar lógica de negócio para processar mensagens recebidas.
    return Promise.resolve();
  }
}
