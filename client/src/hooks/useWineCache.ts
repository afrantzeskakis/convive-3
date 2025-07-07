/**
 * Wine Data Caching Hook
 * 
 * Provides offline wine data caching with automatic synchronization
 * and safe data validation
 */

import { useState, useEffect, useCallback } from 'react';
import { WineData } from '../types/wine';

interface WineCacheData {
  wines: WineData[];
  lastUpdated: string;
  version: string;
}

const CACHE_KEY = 'wine_database_cache';
const CACHE_VERSION = '1.0';
const CACHE_EXPIRY_HOURS = 24;

export function useWineCache() {
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cacheSize, setCacheSize] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Validate cached data structure
  const validateCacheData = (data: any): data is WineCacheData => {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.wines) &&
      typeof data.lastUpdated === 'string' &&
      typeof data.version === 'string' &&
      data.version === CACHE_VERSION
    );
  };

  // Check if cache is expired
  const isCacheExpired = (lastUpdated: string): boolean => {
    const updateTime = new Date(lastUpdated);
    const now = new Date();
    const hoursDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
    return hoursDiff > CACHE_EXPIRY_HOURS;
  };

  // Get wines from cache
  const getCachedWines = useCallback((): WineData[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return [];

      const data = JSON.parse(cached);
      if (!validateCacheData(data)) {
        console.warn('Invalid cache data structure, clearing cache');
        localStorage.removeItem(CACHE_KEY);
        return [];
      }

      if (isCacheExpired(data.lastUpdated)) {
        console.warn('Cache expired, data may be stale');
      }

      return data.wines;
    } catch (error) {
      console.error('Error reading wine cache:', error);
      return [];
    }
  }, []);

  // Cache wines data safely
  const cacheWines = useCallback((wines: WineData[]): boolean => {
    try {
      const cacheData: WineCacheData = {
        wines,
        lastUpdated: new Date().toISOString(),
        version: CACHE_VERSION
      };

      const serialized = JSON.stringify(cacheData);
      
      // Check localStorage quota
      const sizeInMB = (new Blob([serialized]).size / 1024 / 1024);
      if (sizeInMB > 5) {
        console.warn('Wine cache size exceeds 5MB, data may not be stored');
        return false;
      }

      localStorage.setItem(CACHE_KEY, serialized);
      setCacheSize(wines.length);
      setLastSync(new Date());
      setCacheStatus('ready');
      
      return true;
    } catch (error) {
      console.error('Error caching wine data:', error);
      setCacheStatus('error');
      return false;
    }
  }, []);

  // Get specific wine from cache
  const getCachedWine = useCallback((wineId: number): WineData | null => {
    const wines = getCachedWines();
    return wines.find(wine => wine.id === wineId) || null;
  }, [getCachedWines]);

  // Search cached wines
  const searchCachedWines = useCallback((query: string): WineData[] => {
    const wines = getCachedWines();
    if (!query.trim()) return wines;

    const searchTerm = query.toLowerCase();
    return wines.filter(wine => 
      wine.wine_name.toLowerCase().includes(searchTerm) ||
      wine.producer.toLowerCase().includes(searchTerm) ||
      wine.region.toLowerCase().includes(searchTerm) ||
      wine.varietals.toLowerCase().includes(searchTerm)
    );
  }, [getCachedWines]);

  // Update single wine in cache
  const updateCachedWine = useCallback((updatedWine: WineData): boolean => {
    try {
      const wines = getCachedWines();
      const index = wines.findIndex(wine => wine.id === updatedWine.id);
      
      if (index === -1) {
        // Add new wine
        wines.push(updatedWine);
      } else {
        // Update existing wine
        wines[index] = updatedWine;
      }

      return cacheWines(wines);
    } catch (error) {
      console.error('Error updating cached wine:', error);
      return false;
    }
  }, [getCachedWines, cacheWines]);

  // Clear cache
  const clearCache = useCallback((): void => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCacheSize(0);
      setLastSync(null);
      setCacheStatus('ready');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const wines = getCachedWines();
    const verified = wines.filter(wine => wine.verified).length;
    const withRatings = wines.filter(wine => wine.vivino_rating).length;
    const withTastingNotes = wines.filter(wine => wine.tasting_notes).length;

    return {
      total: wines.length,
      verified,
      withRatings,
      withTastingNotes,
      lastSync,
      cacheStatus
    };
  }, [getCachedWines, lastSync, cacheStatus]);

  // Initialize cache status
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (validateCacheData(data)) {
          setCacheSize(data.wines.length);
          setLastSync(new Date(data.lastUpdated));
          setCacheStatus('ready');
        } else {
          setCacheStatus('error');
        }
      } else {
        setCacheStatus('ready');
      }
    } catch (error) {
      console.error('Error initializing wine cache:', error);
      setCacheStatus('error');
    }
  }, []);

  return {
    // Data access
    getCachedWines,
    getCachedWine,
    searchCachedWines,
    
    // Data management
    cacheWines,
    updateCachedWine,
    clearCache,
    
    // Status and stats
    cacheStatus,
    cacheSize,
    lastSync,
    getCacheStats
  };
}