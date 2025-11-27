import { Injectable } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';

@Injectable()
export class SessionService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async create(name: string) {
    return this.whaileysService.createSession(name);
  }

  async findAll() {
    return this.whaileysService.getAllSessions();
  }

  async connect(name: string) {
    return this.whaileysService.connectSession(name);
  }

  async getQr(name: string) {
    return this.whaileysService.getQr(name);
  }

  async getStatus(name: string) {
    return this.whaileysService.getStatus(name);
  }

  async logout(name: string) {
    return this.whaileysService.logoutSession(name);
  }

  async restart(name: string) {
    return this.whaileysService.restartSession(name);
  }

  async remove(name: string) {
    return this.whaileysService.deleteSession(name);
  }

  async getInfo(name: string) {
    return this.whaileysService.getSessionInfo(name);
  }

  sendMessage(sessionName: string, to: string, message: string) {
    return this.whaileysService.sendMessage(sessionName, to, message);
  }
}
