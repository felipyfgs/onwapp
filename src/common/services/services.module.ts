import { Module, Global, forwardRef } from '@nestjs/common';
import { SessionValidationService } from './session-validation.service';
import { DatabaseModule } from '../../database/database.module';
import { WhatsAppModule } from '../../core/whatsapp/whatsapp.module';

/**
 * Global module providing shared services across the application.
 * Services in this module are available everywhere without importing.
 */
@Global()
@Module({
  imports: [DatabaseModule, forwardRef(() => WhatsAppModule)],
  providers: [SessionValidationService],
  exports: [SessionValidationService],
})
export class SharedServicesModule {}
