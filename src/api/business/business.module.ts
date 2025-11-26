import { Module, forwardRef } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { WhatsAppModule } from '../../core/whatsapp/whatsapp.module';

@Module({
  imports: [forwardRef(() => WhatsAppModule)],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
