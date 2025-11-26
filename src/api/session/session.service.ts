import { Injectable } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';

@Injectable()
export class SessionService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async create(name: string): Promise<{ qrcode?: string; status: string }> {
    return this.whaileysService.createSession(name);
  }

  async findAll(): Promise<{ name: string; status: string; phone?: string }[]> {
    return this.whaileysService.getAllSessions();
  }

  async connect(name: string): Promise<{ qrcode?: string; status: string }> {
    return this.whaileysService.connectSession(name);
  }

  async getQr(name: string): Promise<string | null> {
    return this.whaileysService.getQr(name);
  }

  async getStatus(name: string): Promise<{ status: string; phone?: string }> {
    return this.whaileysService.getStatus(name);
  }

  async logout(name: string): Promise<void> {
    return this.whaileysService.logoutSession(name);
  }

  async restart(name: string): Promise<{ qrcode?: string; status: string }> {
    return this.whaileysService.restartSession(name);
  }

  async remove(name: string): Promise<void> {
    return this.whaileysService.deleteSession(name);
  }

  async getInfo(name: string): Promise<{
    name: string;
    status: string;
    phone?: string;
    user?: any;
  }> {
    return this.whaileysService.getSessionInfo(name);
  }

  async sendMessage(
    sessionName: string,
    to: string,
    message: string,
  ): Promise<any> {
    return this.whaileysService.sendMessage(sessionName, to, message);
  }
}
