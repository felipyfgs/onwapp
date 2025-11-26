import { Module, forwardRef } from '@nestjs/common';
import { NewslettersController } from './newsletters.controller';
import { NewslettersService } from './newsletters.service';
import { WhatsAppModule } from '../../core/whatsapp/whatsapp.module';

@Module({
  imports: [forwardRef(() => WhatsAppModule)],
  controllers: [NewslettersController],
  providers: [NewslettersService],
  exports: [NewslettersService],
})
export class NewslettersModule {}
