import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

const { Pool } = pg;

interface QueryResultRow {
  [key: string]: unknown;
}

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
 */
@Injectable()
export class ChatwootPostgresClient implements OnModuleDestroy {
  private readonly logger = new Logger(ChatwootPostgresClient.name);

  private pools = new Map<string, any>();

  /**
   * Get or create a connection pool for a given connection string
   * @returns Pool instance or null if connection string is empty
   */

  getConnection(connectionString: string): any {
    if (!connectionString) {
      return null;
    }

    if (this.pools.has(connectionString)) {
      return this.pools.get(connectionString)!;
    }

    try {
      const pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      pool.on('error', (err) => {
        this.logger.error(`Chatwoot PostgreSQL pool error: ${err.message}`);
        this.pools.delete(connectionString);
      });

      this.pools.set(connectionString, pool);
      this.logger.log('Chatwoot PostgreSQL connection pool created');

      return pool;
    } catch (error) {
      this.logger.error(
        `Failed to create Chatwoot PostgreSQL pool: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Execute a query on the Chatwoot database
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
      const result = await pool.query(sql, params);
      return result as QueryResult<T>;
    } catch (error) {
      this.logger.error(
        `Chatwoot PostgreSQL query error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Get a client for transaction support
   */

  async getClient(connectionString: string): Promise<any> {
    const pool = this.getConnection(connectionString);
    if (!pool) {
      return null;
    }

    try {
      return await pool.connect();
    } catch (error) {
      this.logger.error(
        `Failed to get Chatwoot PostgreSQL client: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Test connection to the Chatwoot database
   */
  async testConnection(connectionString: string): Promise<boolean> {
    try {
      const result = await this.query(connectionString, 'SELECT 1 as test');
      return result?.rows?.[0]?.test === 1;
    } catch {
      return false;
    }
  }

  /**
   * Close a specific connection pool
   */
  async closeConnection(connectionString: string): Promise<void> {
    const pool = this.pools.get(connectionString);
    if (pool) {
      await pool.end();
      this.pools.delete(connectionString);
      this.logger.log('Chatwoot PostgreSQL connection pool closed');
    }
  }

  /**
   * Close all connection pools on module destroy
   */
  async onModuleDestroy() {
    for (const [url, pool] of this.pools) {
      await pool.end();
      this.logger.debug(
        `Closed Chatwoot PostgreSQL pool: ${url.slice(0, 30)}...`,
      );
    }
    this.pools.clear();
  }
}
