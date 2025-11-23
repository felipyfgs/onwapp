import { DatabaseService } from '../../database/database.service';

export abstract class BaseRepository<T> {
  constructor(protected readonly prisma: DatabaseService) {}
}
