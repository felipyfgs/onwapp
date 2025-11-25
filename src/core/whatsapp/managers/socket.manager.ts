import { Injectable, Logger } from '@nestjs/common';
import { WASocket } from 'whaileys';

@Injectable()
export class SocketManager {
  private readonly logger = new Logger(SocketManager.name);
  private sockets: Map<string, WASocket> = new Map();

  createSocket(sessionId: string, socket: WASocket): void {
    this.sockets.set(sessionId, socket);
    this.logger.debug(`Socket criado para sessão ${sessionId}`);
  }

  getSocket(sessionId: string): WASocket | undefined {
    return this.sockets.get(sessionId);
  }

  hasSocket(sessionId: string): boolean {
    return this.sockets.has(sessionId);
  }

  deleteSocket(sessionId: string): void {
    const deleted = this.sockets.delete(sessionId);
    if (deleted) {
      this.logger.debug(`Socket removido para sessão ${sessionId}`);
    }
  }

  getAllSockets(): Map<string, WASocket> {
    return this.sockets;
  }

  getActiveSessions(): string[] {
    return Array.from(this.sockets.keys());
  }

  getSocketCount(): number {
    return this.sockets.size;
  }
}
