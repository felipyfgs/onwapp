import { Module } from '@nestjs/common';
import { WhaileysService } from './whaileys.service';

@Module({
  providers: [WhaileysService]
})
export class WhaileysModule {}
