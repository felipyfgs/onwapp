import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { WhatsAppModule } from '../../core/whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
