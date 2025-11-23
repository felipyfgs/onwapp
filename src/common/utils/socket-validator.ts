import { BadRequestException } from '@nestjs/common';
import { WASocket } from 'whaileys';

export function validateSocket(socket: WASocket | null | undefined): asserts socket is WASocket {
  if (!socket) {
    throw new BadRequestException('Sessão desconectada');
  }
}
