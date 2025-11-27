import { Injectable, BadRequestException } from '@nestjs/common';
import { WhaileysService } from '../../core/whaileys/whaileys.service';
import { RejectCallDto } from './dto';

@Injectable()
export class CallsService {
  constructor(private readonly whaileysService: WhaileysService) {}

  async rejectCall(sessionName: string, dto: RejectCallDto): Promise<void> {
    try {
      await this.whaileysService.rejectCall(
        sessionName,
        dto.callId,
        dto.callFrom,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to reject call',
      );
    }
  }
}
