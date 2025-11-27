import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { WhaileysModule } from '../../core/whaileys/whaileys.module';

@Module({
  imports: [WhaileysModule],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}
