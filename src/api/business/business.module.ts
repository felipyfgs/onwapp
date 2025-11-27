import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { WhaileysModule } from '../../core/whaileys/whaileys.module';

@Module({
  imports: [WhaileysModule],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
