import { Global, Module } from '@nestjs/common';
import { WhaileysService } from './whaileys.service';

@Global()
@Module({
  providers: [WhaileysService],
  exports: [WhaileysService],
})
export class WhaileysModule {}

// Re-export types for external usage
export * from './types';
export { WhaileysService } from './whaileys.service';
