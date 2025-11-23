import { Module } from '@nestjs/common';
import { PersistenceService } from './persistence.service';
import { PersistenceController } from './persistence.controller';
import { HistorySyncService } from './history-sync.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PersistenceController],
  providers: [PersistenceService, HistorySyncService],
  exports: [PersistenceService, HistorySyncService],
})
export class PersistenceModule {}
