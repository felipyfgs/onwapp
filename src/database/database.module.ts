import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [DatabaseService, PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
