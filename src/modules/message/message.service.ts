import { Injectable } from '@nestjs/common';
import type { WAMessage } from 'whaileys/lib/Types';

@Injectable()
export class MessageService {
  async handleMessage(_message: WAMessage) {
    // TODO: implementar lógica de negócio para processar mensagens recebidas.
  }
}
