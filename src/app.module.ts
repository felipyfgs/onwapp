import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PinoLoggerService } from './logger/logger.service';
import { PrismaModule } from './prisma/prisma.module';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    SessionsModule,
  ],
  providers: [PinoLoggerService],
  exports: [PinoLoggerService],
})
export class AppModule {}
