import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionsController } from './sessions.controller';
import { AuthGuard } from './auth.guard';

@Module({
  providers: [SessionService, AuthGuard],
  controllers: [SessionsController],
  exports: [SessionService],
})
export class SessionModule {}
