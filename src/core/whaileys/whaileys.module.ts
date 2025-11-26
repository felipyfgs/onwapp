import { Global, Module } from '@nestjs/common';
import { WhaileysService } from './whaileys.service';

@Global()
@Module({
  providers: [WhaileysService],
  exports: [WhaileysService],
})
export class WhaileysModule {}
