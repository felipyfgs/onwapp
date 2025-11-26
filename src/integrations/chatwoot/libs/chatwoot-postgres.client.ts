import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import pg, { Pool, PoolClient, QueryResult as PgQueryResult } from 'pg';

/**
 * Generic query result row type
 */
interface QueryResultRow {
  [key: string]: unknown;
}

/**
 * Query result wrapper with typed rows
 */
interface QueryResult<T = QueryResultRow> {
  rows: T[];
  rowCount: number | null;
}

/**
 * PostgreSQL client for direct Chatwoot database access
 *
 * Used for advanced features that require direct database access:
 * - Labels/Tags on contacts
 * - Import history (contacts and messages)
 * - Sync lost messages
 *
 * This client manages connection pools per connection string and handles
 * automatic cleanup on module destruction.
 */
@Injectable()
export class ChatwootPostgresClient implements OnModuleDestroy {
  private readonly logger = new Logger(ChatwootPostgresClient.name);

  /**
   * Map of connection strings to their respective connection pools
   */
  private readonly pools = new Map<string, Pool>();

  /**
   * Get or create a connection pool for a given connection string
   * @param connectionString - PostgreSQL connection URL
   * @returns Pool instance or null if connection string is empty
   */
  getConnection(connectionString: string): Pool | null {
    if (!connectionString) {
      return null;
    }

    const existingPool = this.pools.get(connectionString);
    if (existingPool) {
      return existingPool;
    }

    try {
      const pool = new pg.Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      pool.on('error', (err: Error) => {
        this.logger.error('Erro no pool PostgreSQL do Chatwoot', {
          event: 'chatwoot.postgres.pool.error',
          error: err.message,
        });
        this.pools.delete(connectionString);
      });

      this.pools.set(connectionString, pool);
      this.logger.log('Pool de conexão PostgreSQL do Chatwoot criado', {
        event: 'chatwoot.postgres.pool.created',
      });

      return pool;
    } catch (error) {
      this.logger.error('Falha ao criar pool PostgreSQL do Chatwoot', {
        event: 'chatwoot.postgres.pool.create.failure',
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Execute a query on the Chatwoot database
   * @param connectionString - PostgreSQL connection URL
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Query result with typed rows or null if no connection
   */
  async query<T = QueryResultRow>(
    connectionString: string,
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T> | null> {
    const pool = this.getConnection(connectionString);
    if (!pool) {
      return null;
    }

    try {
      const result: PgQueryResult<T> = await pool.query<T>(sql, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
      };
    } catch (error) {
      this.logger.error('Erro na query PostgreSQL do Chatwoot', {
        event: 'chatwoot.postgres.query.error',
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get a client for transaction support
   * @param connectionString - PostgreSQL connection URL
   * @returns PoolClient for transaction operations or null
   */
  async getClient(connectionString: string): Promise<PoolClient | null> {
    const pool = this.getConnection(connectionString);
    if (!pool) {
      return null;
    }

    try {
      return await pool.connect();
    } catch (error) {
      this.logger.error('Falha ao obter cliente PostgreSQL do Chatwoot', {
        event: 'chatwoot.postgres.client.failure',
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Test connection to the Chatwoot database
   * @param connectionString - PostgreSQL connection URL
   * @returns true if connection is successful
   */
  async testConnection(connectionString: string): Promise<boolean> {
    try {
      const result = await this.query<{ test: number }>(
        connectionString,
        'SELECT 1 as test',
      );
      return result?.rows?.[0]?.test === 1;
    } catch {
      return false;
    }
  }

  /**
   * Close a specific connection pool
   * @param connectionString - PostgreSQL connection URL
   */
  async closeConnection(connectionString: string): Promise<void> {
    const pool = this.pools.get(connectionString);
    if (pool) {
      await pool.end();
      this.pools.delete(connectionString);
      this.logger.log('Pool de conexão PostgreSQL do Chatwoot fechado', {
        event: 'chatwoot.postgres.pool.closed',
      });
    }
  }

  /**
   * Close all connection pools on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const [url, pool] of this.pools) {
      closePromises.push(
        pool.end().then(() => {
          this.logger.debug('Pool PostgreSQL do Chatwoot fechado', {
            event: 'chatwoot.postgres.pool.destroy',
            url: url.slice(0, 30) + '...',
          });
        }),
      );
    }

    await Promise.all(closePromises);
    this.pools.clear();
  }
}
