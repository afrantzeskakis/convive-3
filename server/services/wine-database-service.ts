import { db } from '../db';
import { sql } from 'drizzle-orm';
import { EnrichedWine, BasicWineInfo } from './sommelier-service';

/**
 * Service for storing and retrieving wines using PostgreSQL
 */
export class WineDatabaseService {
  
  /**
   * Save a wine to the database
   */
  async saveWine(cacheKey: string, wine: EnrichedWine | BasicWineInfo): Promise<void> {
    try {
      // Extract primary fields for efficient querying
      const wineName = typeof wine.name === 'object' ? wine.name.value : wine.name;
      const vintage = typeof wine.vintage === 'object' ? wine.vintage.value : wine.vintage;
      const vintageStr = vintage ? vintage.toString() : null;
      const producer = typeof wine.producer === 'object' ? wine.producer.value : wine.producer || null;
      const region = typeof wine.region === 'object' && wine.region !== null && 'value' in wine.region ? wine.region.value : wine.region || null;
      const country = typeof wine.country === 'object' && wine.country !== null && 'value' in wine.country ? wine.country.value : wine.country || null;
      
      let varietals = null;
      if (wine.varietals) {
        if (typeof wine.varietals === 'object' && wine.varietals !== null) {
          if (Array.isArray(wine.varietals)) {
            varietals = wine.varietals.join(', ');
          } else if ('value' in wine.varietals) {
            if (Array.isArray(wine.varietals.value)) {
              varietals = wine.varietals.value.join(', ');
            } else {
              varietals = String(wine.varietals.value);
            }
          } else {
            varietals = String(wine.varietals);
          }
        } else {
          varietals = String(wine.varietals);
        }
      }
      
      // Insert or update wine in the database - use raw SQL for direct database access
      // This bypasses any ORM abstraction that might be causing issues
      const query = `
        INSERT INTO wines 
          (cache_key, wine_name, vintage, producer, region, country, varietals, wine_data)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (cache_key) 
        DO UPDATE SET
          wine_name = EXCLUDED.wine_name,
          vintage = EXCLUDED.vintage,
          producer = EXCLUDED.producer,
          region = EXCLUDED.region,
          country = EXCLUDED.country,
          varietals = EXCLUDED.varietals,
          wine_data = EXCLUDED.wine_data
      `;
      
      const wineDataJson = JSON.stringify(wine);
      
      // Get direct access to the pg pool and execute the query
      const pool = require('../db').pool;
      await pool.query(query, [
        cacheKey, 
        wineName, 
        vintageStr, 
        producer, 
        region, 
        country, 
        varietals, 
        wineDataJson
      ]);
      
      console.log(`Wine successfully stored in PostgreSQL database: ${cacheKey}`);
    } catch (error) {
      console.error(`Error saving wine to database:`, error);
      throw error;
    }
  }
  
  /**
   * Get all wines with pagination and search support
   */
  async getAllWines(page: number = 1, pageSize: number = 20, search: string = ''): Promise<{
    wines: EnrichedWine[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      // Get direct access to the pg pool
      const { pool } = require('../db');
      
      // Build the query parameters
      const params = [];
      let whereClause = '';
      
      // Add search condition if provided
      if (search && search.trim()) {
        whereClause = `
          WHERE 
            wine_name ILIKE $1 OR 
            COALESCE(vintage, '') ILIKE $1 OR 
            COALESCE(producer, '') ILIKE $1 OR 
            COALESCE(region, '') ILIKE $1 OR 
            COALESCE(country, '') ILIKE $1 OR
            COALESCE(varietals, '') ILIKE $1
        `;
        params.push(`%${search}%`);
      }
      
      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) FROM wines ${whereClause}`;
      
      const countResult = await pool.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);
      
      // Calculate pagination
      const offset = (page - 1) * pageSize;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      
      // Validate page number
      const validPage = Math.max(1, Math.min(page, totalPages));
      const validOffset = (validPage - 1) * pageSize;
      
      // Get paginated wines with all columns
      let queryParams: any[] = [...params];
      if (params.length > 0) {
        queryParams.push(pageSize.toString(), validOffset.toString());
        var dataQuery = `
          SELECT 
            id,
            wine_name,
            producer,
            vintage,
            region,
            country,
            wine_type,
            varietals,
            verified,
            verified_source,
            COALESCE(wine_rating::text, '') as vivino_rating,
            '' as vivino_id,
            '' as vivino_url,
            COALESCE(wine_rating::text, '') as wine_rating,
            tasting_notes,
            flavor_notes,
            aroma_notes,
            what_makes_special,
            body_description,
            texture,
            balance,
            tannin_level,
            acidity,
            finish_length,
            food_pairing,
            serving_temp,
            oak_influence,
            aging_potential,
            blend_description,
            description_enhanced,
            created_at
          FROM wines 
          ${whereClause}
          ORDER BY wine_name, vintage
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
      } else {
        queryParams.push(pageSize.toString(), validOffset.toString());
        var dataQuery = `
          SELECT 
            id,
            wine_name,
            producer,
            vintage,
            region,
            country,
            wine_type,
            varietals,
            verified,
            verified_source,
            COALESCE(wine_rating::text, '') as vivino_rating,
            '' as vivino_id,
            '' as vivino_url,
            COALESCE(wine_rating::text, '') as wine_rating,
            tasting_notes,
            flavor_notes,
            aroma_notes,
            what_makes_special,
            body_description,
            texture,
            balance,
            tannin_level,
            acidity,
            finish_length,
            food_pairing,
            serving_temp,
            oak_influence,
            aging_potential,
            blend_description,
            description_enhanced,
            created_at
          FROM wines
          ORDER BY wine_name, vintage
          LIMIT $1 OFFSET $2
        `;
      }
      
      // Execute query and map results
      const result = await pool.query(dataQuery, queryParams);
      const wines = result.rows;
      
      console.log(`Retrieved ${wines.length} wines from database (page ${validPage}/${totalPages}, total: ${totalCount})`);
      
      return {
        wines,
        totalCount,
        totalPages
      };
    } catch (error) {
      console.error('Error retrieving wines from database:', error);
      return {
        wines: [],
        totalCount: 0,
        totalPages: 0
      };
    }
  }
  
  /**
   * Get a specific wine by its cache key
   */
  async getWine(cacheKey: string): Promise<EnrichedWine | null> {
    try {
      // Get direct access to the pg pool
      const { pool } = require('../db');
      
      const query = `
        SELECT 
          id,
          wine_name,
          producer,
          vintage,
          region,
          country,
          wine_type,
          varietals,
          verified,
          verified_source,
          COALESCE(wine_rating::text, '') as vivino_rating,
          '' as vivino_id,
          '' as vivino_url,
          COALESCE(wine_rating::text, '') as wine_rating,
          tasting_notes,
          flavor_notes,
          aroma_notes,
          what_makes_special,
          body_description,
          texture,
          balance,
          tannin_level,
          acidity,
          finish_length,
          food_pairing,
          serving_temp,
          oak_influence,
          aging_potential,
          blend_description,
          description_enhanced,
          created_at
        FROM wines 
        WHERE cache_key = $1
      `;
      const result = await pool.query(query, [cacheKey]);
      
      if (result.rows.length > 0) {
        console.log(`Retrieved wine from database: ${cacheKey}`);
        return result.rows[0];
      }
      
      console.log(`Wine not found in database: ${cacheKey}`);
      return null;
    } catch (error) {
      console.error(`Error retrieving wine from database:`, error);
      return null;
    }
  }
  
  /**
   * Find duplicate wines based on name and vintage
   */
  async findDuplicates(): Promise<EnrichedWine[][]> {
    try {
      // Get direct access to the pg pool
      const { pool } = require('../db');
      
      const query = `
        SELECT 
          json_agg(wine_data) as duplicate_group
        FROM wines
        GROUP BY LOWER(wine_name), vintage
        HAVING COUNT(*) > 1
      `;
      
      const result = await pool.query(query);
      const duplicateGroups = result.rows.map((row: any) => row.duplicate_group);
      
      console.log(`Found ${duplicateGroups.length} groups of duplicate wines`);
      return duplicateGroups || [];
    } catch (error) {
      console.error('Error finding duplicate wines:', error);
      return [];
    }
  }
  
  /**
   * Get the count of wines in the database
   */
  async getWineCount(): Promise<number> {
    try {
      // Get direct access to the pg pool
      const { pool } = require('../db');
      
      const result = await pool.query('SELECT COUNT(*) FROM wines');
      const count = parseInt(result.rows[0].count);
      console.log(`Total wines in database: ${count}`);
      return count;
    } catch (error) {
      console.error('Error getting wine count:', error);
      return 0;
    }
  }
}

// Create a singleton instance
export const wineDatabaseService = new WineDatabaseService();