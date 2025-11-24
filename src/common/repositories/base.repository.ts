import { DatabaseService } from '../../database/database.service';

export abstract class BaseRepository {
  constructor(protected readonly prisma: DatabaseService) {}
}
