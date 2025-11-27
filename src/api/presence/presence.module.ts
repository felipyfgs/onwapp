import { Module } from '@nestjs/common';
import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';
import { WhaileysModule } from '../../core/whaileys/whaileys.module';

@Module({
  imports: [WhaileysModule],
  controllers: [PresenceController],
  providers: [PresenceService],
})
export class PresenceModule {}
