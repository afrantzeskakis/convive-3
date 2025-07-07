import { db, pool } from '../db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Interface for AI cache entries
 */
interface AICacheEntry {
  id: number;
  requestHash: string;
  requestData: any;
  responseData: any;
  model: string;
  createdAt: Date;
  expiresAt?: Date | null;
}

/**
 * AI Cache Service for caching OpenAI API responses
 */
export class AICacheService {
  private tableName: string;

  constructor(tableName: string = 'ai_cache') {
    this.tableName = tableName;
  }

  /**
   * Initialize the cache table if it doesn't exist
   */
  async initializeCache(): Promise<void> {
    try {
      // Use a shorter timeout for initialization
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cache initialization timeout')), 3000);
      });

      const initPromise = this.createCacheTable();
      
      await Promise.race([initPromise, timeoutPromise]);
      console.log('AI cache table initialized');
    } catch (error) {
      console.error('Error initializing AI cache table:', error);
      // Don't throw - allow server to start without cache
    }
  }

  private async createCacheTable(): Promise<void> {
    try {
      // Check if the table exists
      const tableExists = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );`,
        [this.tableName]
      );
      
      if (!tableExists.rows[0].exists) {
        // Create the table if it doesn't exist
        await pool.query(`
          CREATE TABLE ${this.tableName} (
            id SERIAL PRIMARY KEY,
            request_hash TEXT NOT NULL UNIQUE,
            request_data JSONB NOT NULL,
            response_data JSONB NOT NULL,
            model TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP WITH TIME ZONE
          );
        `);
        
        // Create index for faster lookups
        await pool.query(`
          CREATE INDEX ${this.tableName}_request_hash_idx 
          ON ${this.tableName} (request_hash);
        `);
      }
    } catch (error) {
      console.error('Failed to create cache table:', error);
      throw error;
    }
  }

  /**
   * Generate a hash for the request
   */
  private generateRequestHash(requestData: any, model: string): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify({ requestData, model }))
      .digest('hex');
  }

  /**
   * Cache a response
   */
  async cacheResponse(
    requestData: any,
    responseData: any,
    model: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      const requestHash = this.generateRequestHash(requestData, model);
      
      await pool.query(
        `INSERT INTO ${this.tableName} 
        (request_hash, request_data, response_data, model, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (request_hash) 
        DO UPDATE SET 
          response_data = EXCLUDED.response_data,
          expires_at = EXCLUDED.expires_at`,
        [requestHash, JSON.stringify(requestData), JSON.stringify(responseData), model, expiresAt || null]
      );
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Get cached response
   */
  async getCachedResponse(requestData: any, model: string): Promise<any | null> {
    try {
      const requestHash = this.generateRequestHash(requestData, model);
      
      const result = await pool.query(
        `SELECT response_data, expires_at 
        FROM ${this.tableName} 
        WHERE request_hash = $1
        AND (expires_at IS NULL OR expires_at > NOW())`,
        [requestHash]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0].response_data;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Clear a specific cached response
   */
  async clearCachedResponse(requestHash: string): Promise<void> {
    try {
      await db.execute(sql`
        DELETE FROM ${sql.identifier(this.tableName)} 
        WHERE request_hash = ${requestHash};
      `);
      console.log(`Cleared cached response: ${requestHash}`);
    } catch (error) {
      console.error('Error clearing cached response:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    try {
      await db.execute(sql`
        DELETE FROM ${sql.identifier(this.tableName)} 
        WHERE expires_at IS NOT NULL AND expires_at <= NOW();
      `);
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }
}

// Create and export a singleton instance
export const aiCacheService = new AICacheService();