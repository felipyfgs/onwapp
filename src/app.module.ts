import { Module } from '@nestjs/common';
import { SessionsModule } from './sessions/sessions.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [SessionsModule, PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
