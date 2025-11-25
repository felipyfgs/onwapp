import { Module, Global } from '@nestjs/common';
import { AudioService } from './audio.service';

@Global()
@Module({
  providers: [AudioService],
  exports: [AudioService],
})
export class AudioModule {}
