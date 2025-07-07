/**
 * Cache Service for OpenAI API calls
 * 
 * This service provides caching functionality to reduce OpenAI API costs
 * during development and production use. It implements:
 * 
 * 1. In-memory LRU cache for fast retrieval
 * 2. Database persistence for long-term storage
 * 3. TTL (time-to-live) for cache entries
 * 4. Hash-based cache keys for consistent lookup
 */

import { db } from '../db';
import { createHash } from 'crypto';
import { sql } from 'drizzle-orm';

// Simple in-memory LRU cache implementation
type CacheEntry = {
  value: string;
  timestamp: number;
  ttl: number; // Time-to-live in milliseconds
};

class LRUCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  // Set a value in the cache with optional TTL
  set(key: string, value: string, ttl: number = 24 * 60 * 60 * 1000): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Remove the oldest entry if we're at capacity
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  // Get a value from the cache if it exists and isn't expired
  get(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if the entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Move the entry to the end of the map to mark it as recently used
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  // Delete a value from the cache
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear the entire cache
  clear(): void {
    this.cache.clear();
  }
}

// Initialize the in-memory cache
const memoryCache = new LRUCache(500); // Limit to 500 entries

// Helper function to create a consistent hash from input
function createCacheKey(prefix: string, input: string): string {
  return prefix + ':' + createHash('md5').update(input).digest('hex');
}

/**
 * Executes a function with caching
 * 
 * @param cachePrefix - Prefix for the cache key (e.g., 'recipe', 'wine')
 * @param input - The input string to the function (used to generate cache key)
 * @param executor - The async function to execute if cache miss
 * @param ttl - Time-to-live in milliseconds (default: 24 hours)
 * @returns The cached or newly computed result
 */
export async function withCache<T>(
  cachePrefix: string,
  input: string,
  executor: () => Promise<T>,
  ttl: number = 24 * 60 * 60 * 1000
): Promise<T> {
  const cacheKey = createCacheKey(cachePrefix, input);
  
  // Check memory cache first (fastest)
  const cachedResult = memoryCache.get(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit (memory): ${cachePrefix}`);
    return JSON.parse(cachedResult) as T;
  }
  
  try {
    // Check database cache next
    const dbResult = await db.execute(
      sql`SELECT value FROM ai_cache WHERE key = ${cacheKey} AND created_at > NOW() - INTERVAL '${ttl / 1000} seconds'`
    );
    
    if (dbResult.rows && dbResult.rows.length > 0) {
      const value = dbResult.rows[0].value;
      if (typeof value === 'string') {
        console.log(`Cache hit (db): ${cachePrefix}`);
        // Update memory cache with the db result
        memoryCache.set(cacheKey, value, ttl);
        return JSON.parse(value) as T;
      }
    }
  } catch (error) {
    // If database error, just log and continue to execute the function
    console.error(`Error checking cache in database: ${error}`);
  }
  
  // Cache miss, execute the function
  console.log(`Cache miss: ${cachePrefix}`);
  const result = await executor();
  const resultString = JSON.stringify(result);
  
  // Store in memory cache
  memoryCache.set(cacheKey, resultString, ttl);
  
  // Store in database cache
  try {
    await db.execute(
      sql`INSERT INTO ai_cache (key, value, created_at) 
          VALUES (${cacheKey}, ${resultString}, NOW())
          ON CONFLICT (key) 
          DO UPDATE SET value = ${resultString}, created_at = NOW()`
    );
  } catch (error) {
    console.error(`Error storing in database cache: ${error}`);
  }
  
  return result;
}

// Initialize the cache table if it doesn't exist
export async function initializeCache(): Promise<void> {
  try {
    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS ai_cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`
    );
    
    // Create index on created_at for efficient pruning
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS ai_cache_created_at_idx ON ai_cache (created_at)`
    );
    
    console.log('AI cache table initialized');
  } catch (error) {
    console.error('Error initializing cache table:', error);
  }
}

// Function to prune old cache entries
export async function pruneCache(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
  try {
    const result = await db.execute(
      sql`DELETE FROM ai_cache WHERE created_at < NOW() - INTERVAL '${maxAgeMs / 1000} seconds'`
    );
    const deletedCount = result.rowCount || 0;
    console.log(`Pruned ${deletedCount} old cache entries`);
    return deletedCount;
  } catch (error) {
    console.error('Error pruning cache:', error);
    return 0;
  }
}