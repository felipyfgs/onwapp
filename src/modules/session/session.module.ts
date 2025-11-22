import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { WhatsModule } from '../../whats/whats.module';

@Module({
  imports: [PrismaModule, WhatsModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
