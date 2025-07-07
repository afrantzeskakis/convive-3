import { db } from '../db';
import { sql } from 'drizzle-orm';
import { BasicWineInfo, EnrichedWine } from './sommelier-service';

/**
 * Service for storing and retrieving wine data in the database
 */
export class WineDatabaseService {
  private tableName = 'wines';
  private initialized = false;

  constructor() {
    this.initialize().catch(err => {
      console.error('Failed to initialize wine database:', err);
    });
  }

  /**
   * Initialize the wines table if it doesn't exist
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check if the table exists
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${this.tableName}
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        // Create the table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE ${sql.identifier(this.tableName)} (
            id SERIAL PRIMARY KEY,
            cache_key TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            vintage TEXT,
            producer TEXT,
            region TEXT,
            country TEXT,
            varietals TEXT,
            data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Create indices for faster lookups
        await db.execute(sql`
          CREATE INDEX ${sql.identifier(`${this.tableName}_cache_key_idx`)} 
          ON ${sql.identifier(this.tableName)} (cache_key);
        `);
        
        await db.execute(sql`
          CREATE INDEX ${sql.identifier(`${this.tableName}_name_idx`)} 
          ON ${sql.identifier(this.tableName)} (name);
        `);
        
        await db.execute(sql`
          CREATE INDEX ${sql.identifier(`${this.tableName}_producer_idx`)} 
          ON ${sql.identifier(this.tableName)} (producer);
        `);
        
        await db.execute(sql`
          CREATE INDEX ${sql.identifier(`${this.tableName}_region_idx`)} 
          ON ${sql.identifier(this.tableName)} (region);
        `);
        
        console.log('Wine database table created successfully');
      }
      
      this.initialized = true;
      console.log('Wine database initialized');
    } catch (error) {
      console.error('Error initializing wine database table:', error);
    }
  }

  /**
   * Save a wine to the database
   */
  async saveWine(cacheKey: string, wine: EnrichedWine | BasicWineInfo): Promise<void> {
    await this.initialize();
    
    try {
      // Extract key fields
      const name = typeof wine.name === 'object' ? wine.name.value : wine.name;
      const vintage = typeof wine.vintage === 'object' ? wine.vintage.value : wine.vintage;
      const producer = typeof wine.producer === 'object' ? wine.producer.value : wine.producer || null;
      const region = typeof wine.region === 'object' ? wine.region.value : wine.region || null;
      const country = typeof wine.country === 'object' ? wine.country.value : wine.country || null;
      const varietals = typeof wine.varietals === 'object' ? 
        (Array.isArray(wine.varietals.value) ? wine.varietals.value.join(', ') : wine.varietals.value) : 
        (wine.varietals || null);
      
      // Insert or update the wine
      await db.execute(sql`
        INSERT INTO ${sql.identifier(this.tableName)} 
        (cache_key, name, vintage, producer, region, country, varietals, data)
        VALUES (
          ${cacheKey},
          ${name},
          ${vintage ? vintage.toString() : null},
          ${producer},
          ${region},
          ${country},
          ${varietals},
          ${JSON.stringify(wine)}
        )
        ON CONFLICT (cache_key) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          vintage = EXCLUDED.vintage,
          producer = EXCLUDED.producer,
          region = EXCLUDED.region,
          country = EXCLUDED.country,
          varietals = EXCLUDED.varietals,
          data = EXCLUDED.data,
          created_at = CURRENT_TIMESTAMP;
      `);
    } catch (error) {
      console.error(`Error saving wine ${cacheKey} to database:`, error);
      throw error;
    }
  }

  /**
   * Get a wine from the database by its cache key
   */
  async getWine(cacheKey: string): Promise<EnrichedWine | null> {
    await this.initialize();
    
    try {
      const result = await db.execute(sql`
        SELECT data FROM ${sql.identifier(this.tableName)}
        WHERE cache_key = ${cacheKey};
      `);
      
      if (result.rows.length > 0) {
        return result.rows[0].data as EnrichedWine;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting wine ${cacheKey} from database:`, error);
      return null;
    }
  }

  /**
   * Get all wines from the database with pagination
   */
  async getAllWines(page: number = 1, pageSize: number = 20, search: string = ''): Promise<{
    wines: EnrichedWine[];
    totalCount: number;
    pageCount: number;
  }> {
    await this.initialize();
    
    try {
      let whereClause = '';
      const params: any[] = [];
      
      if (search) {
        whereClause = 'WHERE name ILIKE $1 OR producer ILIKE $1 OR region ILIKE $1 OR country ILIKE $1 OR varietals ILIKE $1';
        params.push(`%${search}%`);
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
      const countResult = await db.execute(sql.raw(countQuery, ...params));
      const totalCount = parseInt(countResult.rows[0].count);
      
      // Calculate pagination
      const offset = (page - 1) * pageSize;
      const pageCount = Math.ceil(totalCount / pageSize);
      
      // Get paginated wines
      const query = `
        SELECT data 
        FROM ${this.tableName} 
        ${whereClause}
        ORDER BY name, vintage 
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      
      const result = await db.execute(sql.raw(query, ...params));
      const wines = result.rows.map(row => row.data as EnrichedWine);
      
      return {
        wines,
        totalCount,
        pageCount
      };
    } catch (error) {
      console.error('Error getting all wines from database:', error);
      return {
        wines: [],
        totalCount: 0,
        pageCount: 0
      };
    }
  }

  /**
   * Find potential duplicate wines in the database
   */
  async findDuplicates(): Promise<EnrichedWine[][]> {
    await this.initialize();
    
    try {
      // Find wines with similar names (case insensitive)
      const query = `
        SELECT array_agg(data) as duplicate_group
        FROM ${this.tableName}
        GROUP BY LOWER(name), vintage
        HAVING COUNT(*) > 1
      `;
      
      const result = await db.execute(sql.raw(query));
      const duplicateGroups = result.rows.map(row => row.duplicate_group as EnrichedWine[]);
      
      return duplicateGroups;
    } catch (error) {
      console.error('Error finding duplicate wines:', error);
      return [];
    }
  }

  /**
   * Search for wines by name, producer, region, country, or varietals
   */
  async searchWines(searchTerm: string): Promise<EnrichedWine[]> {
    await this.initialize();
    
    try {
      const query = `
        SELECT data
        FROM ${this.tableName}
        WHERE 
          name ILIKE $1 OR
          producer ILIKE $1 OR
          region ILIKE $1 OR
          country ILIKE $1 OR
          varietals ILIKE $1
        ORDER BY name, vintage
        LIMIT 100
      `;
      
      const result = await db.execute(sql.raw(query, `%${searchTerm}%`));
      return result.rows.map(row => row.data as EnrichedWine);
    } catch (error) {
      console.error(`Error searching wines with term "${searchTerm}":`, error);
      return [];
    }
  }
}

// Create a singleton instance
export const wineDatabaseService = new WineDatabaseService();