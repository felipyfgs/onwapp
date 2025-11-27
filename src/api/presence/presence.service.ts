import { Injectable } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';
import { SetPresenceDto } from './dto';

@Injectable()
export class PresenceService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async setPresence(sessionName: string, dto: SetPresenceDto): Promise<void> {
    const { presence, chatId } = dto;

    if (presence === 'online' || presence === 'offline') {
      await this.whaileysService.sendPresenceUpdate(
        sessionName,
        presence === 'online' ? 'available' : 'unavailable',
      );
    } else if (chatId) {
      const presenceMap: Record<string, 'composing' | 'recording' | 'paused'> =
        {
          typing: 'composing',
          recording: 'recording',
          paused: 'paused',
        };
      await this.whaileysService.sendPresenceUpdate(
        sessionName,
        presenceMap[presence],
        chatId,
      );
    } else {
      throw new Error(
        'chatId is required for typing/recording/paused presence',
      );
    }
  }

  async subscribeToPresence(
    sessionName: string,
    chatId: string,
  ): Promise<void> {
    await this.whaileysService.presenceSubscribe(sessionName, chatId);
  }
}
