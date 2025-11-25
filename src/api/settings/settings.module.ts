import { Module, forwardRef } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { WhatsAppModule } from '../../core/whatsapp/whatsapp.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [forwardRef(() => WhatsAppModule), DatabaseModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
