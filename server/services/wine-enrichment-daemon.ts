/**
 * Wine Enrichment Background Daemon
 * Persistent background service for continuous wine enrichment processing
 */

import { enrichRestaurantWine } from './restaurant-wine-enrichment.js';
import { restaurantWineStorage } from '../storage/restaurant-wine-storage.js';

class WineEnrichmentDaemon {
  private isRunning = false;
  private processingCount = 0;
  private maxConcurrent = 2;
  private intervalMs = 5000; // Check every 5 seconds
  private intervalId: NodeJS.Timeout | null = null;

  async start() {
    if (this.isRunning) {
      console.log('Wine enrichment daemon already running');
      return;
    }

    this.isRunning = true;
    console.log('🍷 Starting wine enrichment daemon...');
    
    // Start the processing loop
    this.intervalId = setInterval(() => {
      this.processNextBatch().catch(error => {
        console.error('Error in daemon processing:', error);
      });
    }, this.intervalMs);

    // Process immediately on start
    setTimeout(() => {
      this.processNextBatch().catch(error => {
        console.error('Error in initial daemon processing:', error);
      });
    }, 1000);
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('🛑 Wine enrichment daemon stopped');
  }

  private async processNextBatch() {
    if (!this.isRunning || this.processingCount >= this.maxConcurrent) {
      return;
    }

    try {
      // Get pending wines
      const pendingWines = await restaurantWineStorage.getPendingWines(this.maxConcurrent - this.processingCount);
      
      if (pendingWines.length === 0) {
        return;
      }

      console.log(`🔄 Processing ${pendingWines.length} wines (${this.processingCount} already processing)`);

      // Process wines concurrently
      const promises = pendingWines.map(wine => this.processWine(wine));
      await Promise.allSettled(promises);

    } catch (error) {
      console.error('Error getting pending wines:', error);
    }
  }

  private async processWine(wine: any) {
    this.processingCount++;
    
    try {
      // Mark as processing
      await restaurantWineStorage.updateWineStatus(wine.id, 'processing');
      
      console.log(`🍇 Starting enrichment: ${wine.wine_name} (${wine.vintage})`);
      
      // Enrich the wine
      const enrichmentData = await enrichRestaurantWine(wine);
      
      await restaurantWineStorage.updateWineEnrichment(wine.id, {
        wine_rating: enrichmentData.wine_rating?.toString(),
        general_guest_experience: enrichmentData.general_guest_experience,
        flavor_notes: enrichmentData.flavor_notes,
        aroma_notes: enrichmentData.aroma_notes,
        what_makes_special: enrichmentData.what_makes_special,
        body_description: enrichmentData.body_description,
        food_pairing: enrichmentData.food_pairing,
        serving_temp: enrichmentData.serving_temp,
        aging_potential: enrichmentData.aging_potential,
        enrichment_status: 'completed'
      });
      
      console.log(`✅ Completed enrichment: ${wine.wine_name} (${wine.vintage})`);
      
    } catch (error) {
      console.error(`❌ Failed enrichment: ${wine.wine_name} (${wine.vintage}):`, error);
      
      // Reset to pending on error
      try {
        await restaurantWineStorage.updateWineStatus(wine.id, 'pending');
      } catch (resetError) {
        console.error('Failed to reset wine status:', resetError);
      }
    } finally {
      this.processingCount--;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      processingCount: this.processingCount,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Global daemon instance
const wineEnrichmentDaemon = new WineEnrichmentDaemon();

export { wineEnrichmentDaemon };