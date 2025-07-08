import { db } from '../db';
import { restaurantWinesIsolated } from '../../shared/wine-schema';
import { eq, and, sql } from 'drizzle-orm';

export interface RestaurantWine {
  id: number;
  restaurantId: number;
  wine_name: string;
  producer: string | null;
  vintage: string | null;
  region: string | null;
  wine_type: string | null;
  enrichment_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  general_guest_experience?: string;
  what_makes_special?: string;
  food_pairing?: string;
  aroma_notes?: string;
  flavor_notes?: string;
  body_description?: string;
}

export interface WineStats {
  total: number;
  enriched: number;
  premium: number;
  completionPercentage: number;
}

export class RestaurantWineStorage {
  async getWineStats(): Promise<WineStats> {
    try {
      const totalResult = await db
        .select({ count: sql`count(*)` })
        .from(restaurantWinesIsolated);
      
      const enrichedResult = await db
        .select({ count: sql`count(*)` })
        .from(restaurantWinesIsolated)
        .where(eq(restaurantWinesIsolated.enrichment_status, 'completed'));
      
      const premiumResult = await db
        .select({ count: sql`count(*)` })
        .from(restaurantWinesIsolated)
        .where(and(
          eq(restaurantWinesIsolated.enrichment_status, 'completed'),
sql`${restaurantWinesIsolated.what_makes_special} IS NOT NULL`
        ));

      const total = Number(totalResult[0]?.count || 0);
      const enriched = Number(enrichedResult[0]?.count || 0);
      const premium = Number(premiumResult[0]?.count || 0);
      
      return {
        total,
        enriched,
        premium,
        completionPercentage: total > 0 ? Math.round((enriched / total) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting wine stats:', error);
      return { total: 0, enriched: 0, premium: 0, completionPercentage: 0 };
    }
  }

  async getWineStatsByRestaurant(restaurantId: number): Promise<WineStats> {
    try {
      const totalResult = await db
        .select({ count: sql`count(*)` })
        .from(restaurantWinesIsolated)
        .where(eq(restaurantWinesIsolated.restaurant_id, restaurantId));
      
      const enrichedResult = await db
        .select({ count: sql`count(*)` })
        .from(restaurantWinesIsolated)
        .where(and(
          eq(restaurantWinesIsolated.restaurant_id, restaurantId), 
          eq(restaurantWinesIsolated.enrichment_status, 'completed')
        ));
      
      const premiumResult = await db
        .select({ count: sql`count(*)` })
        .from(restaurantWinesIsolated)
        .where(and(
          eq(restaurantWinesIsolated.restaurant_id, restaurantId),
          eq(restaurantWinesIsolated.enrichment_status, 'completed'),
          sql`${restaurantWinesIsolated.what_makes_special} IS NOT NULL`
        ));

      const total = Number(totalResult[0]?.count || 0);
      const enriched = Number(enrichedResult[0]?.count || 0);
      const premium = Number(premiumResult[0]?.count || 0);
      
      return {
        total,
        enriched,
        premium,
        completionPercentage: total > 0 ? Math.round((enriched / total) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting wine stats by restaurant:', error);
      return { total: 0, enriched: 0, premium: 0, completionPercentage: 0 };
    }
  }

  async getAllWines(): Promise<RestaurantWine[]> {
    try {
      const wines = await db
        .select()
        .from(restaurantWinesIsolated)
        .orderBy(restaurantWinesIsolated.created_at);
      
      return wines.map(wine => ({
        ...wine,
        restaurantId: wine.restaurant_id,
        created_at: wine.created_at?.toISOString() || new Date().toISOString(),
        updated_at: wine.updated_at?.toISOString() || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error getting all wines:', error);
      return [];
    }
  }

  async getWinesByRestaurant(restaurantId: number): Promise<RestaurantWine[]> {
    try {
      const wines = await db
        .select()
        .from(restaurantWinesIsolated)
        .where(eq(restaurantWinesIsolated.restaurant_id, restaurantId))
        .orderBy(restaurantWinesIsolated.created_at);
      
      return wines.map(wine => ({
        ...wine,
        restaurantId: wine.restaurant_id,
        enrichment_status: (wine.enrichment_status || 'pending') as 'pending' | 'processing' | 'completed' | 'failed',
        created_at: wine.created_at?.toISOString() || new Date().toISOString(),
        updated_at: wine.updated_at?.toISOString() || new Date().toISOString(),
      })) as RestaurantWine[];
    } catch (error) {
      console.error('Error getting wines by restaurant:', error);
      return [];
    }
  }

  async resetStuckWines(restaurantId: number): Promise<void> {
    await db.execute(sql`
      UPDATE restaurant_wines_isolated 
      SET enrichment_status = 'pending', 
          enrichment_started_at = NULL
      WHERE restaurant_id = ${restaurantId}
      AND enrichment_status = 'processing'
      AND (enrichment_started_at IS NULL OR enrichment_started_at < NOW() - INTERVAL '10 minutes')
    `);
  }

  async getWinesByStatus(status: string): Promise<RestaurantWine[]> {
    try {
      const wines = await db
        .select()
        .from(restaurantWinesIsolated)
        .where(eq(restaurantWinesIsolated.enrichment_status, status))
        .orderBy(restaurantWinesIsolated.created_at);
      
      return wines.map(wine => ({
        ...wine,
        restaurantId: wine.restaurant_id,
        enrichment_status: (wine.enrichment_status || 'pending') as 'pending' | 'processing' | 'completed' | 'failed',
        created_at: wine.created_at?.toISOString() || new Date().toISOString(),
        updated_at: wine.updated_at?.toISOString() || new Date().toISOString(),
      })) as RestaurantWine[];
    } catch (error) {
      console.error('Error getting wines by status:', error);
      return [];
    }
  }

  async getWineById(id: number): Promise<RestaurantWine | null> {
    try {
      const wines = await db
        .select()
        .from(restaurantWinesIsolated)
        .where(eq(restaurantWinesIsolated.id, id))
        .limit(1);
      
      if (wines.length === 0) return null;
      
      const wine = wines[0];
      return {
        ...wine,
        restaurantId: wine.restaurant_id,
        enrichment_status: (wine.enrichment_status || 'pending') as 'pending' | 'processing' | 'completed' | 'failed',
        created_at: wine.created_at?.toISOString() || new Date().toISOString(),
        updated_at: wine.updated_at?.toISOString() || new Date().toISOString(),
      } as RestaurantWine;
    } catch (error) {
      console.error('Error getting wine by ID:', error);
      return null;
    }
  }

  async createWine(wineData: Partial<RestaurantWine>): Promise<RestaurantWine> {
    try {
      const [wine] = await db
        .insert(restaurantWinesIsolated)
        .values({
          restaurant_id: wineData.restaurantId!,
          wine_name: wineData.wine_name!,
          producer: wineData.producer!,
          vintage: wineData.vintage || '',
          region: wineData.region || '',
          wine_type: wineData.wine_type || '',
          enrichment_status: wineData.enrichment_status || 'pending',
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();
      
      return {
        ...wine,
        restaurantId: wine.restaurant_id,
        enrichment_status: (wine.enrichment_status || 'pending') as 'pending' | 'processing' | 'completed' | 'failed',
        created_at: wine.created_at?.toISOString() || new Date().toISOString(),
        updated_at: wine.updated_at?.toISOString() || new Date().toISOString(),
      } as RestaurantWine;
    } catch (error) {
      console.error('Error creating wine:', error);
      throw error;
    }
  }

  async updateWineStatus(id: number, status: string): Promise<void> {
    try {
      await db
        .update(restaurantWinesIsolated)
        .set({
          enrichment_status: status,
          updated_at: new Date(),
        })
        .where(eq(restaurantWinesIsolated.id, id));
    } catch (error) {
      console.error('Error updating wine status:', error);
      throw error;
    }
  }

  async getPendingWines(limit: number = 10): Promise<RestaurantWine[]> {
    try {
      const wines = await db
        .select()
        .from(restaurantWinesIsolated)
        .where(eq(restaurantWinesIsolated.enrichment_status, 'pending'))
        .orderBy(restaurantWinesIsolated.created_at)
        .limit(limit);
      
      return wines.map(wine => ({
        ...wine,
        restaurantId: wine.restaurant_id,
        enrichment_status: (wine.enrichment_status || 'pending') as 'pending' | 'processing' | 'completed' | 'failed',
        created_at: wine.created_at?.toISOString() || new Date().toISOString(),
        updated_at: wine.updated_at?.toISOString() || new Date().toISOString(),
      })) as RestaurantWine[];
    } catch (error) {
      console.error('Error getting pending wines:', error);
      return [];
    }
  }

  async saveEnrichedWine(id: number, enrichmentData: any): Promise<void> {
    try {
      await db
        .update(restaurantWinesIsolated)
        .set({
          general_guest_experience: enrichmentData.general_guest_experience,
          what_makes_special: enrichmentData.what_makes_special,
          food_pairing: enrichmentData.food_pairing,
          aroma_notes: enrichmentData.aroma_notes,
          flavor_notes: enrichmentData.flavor_notes,
          body_description: enrichmentData.body_description,
          serving_temp: enrichmentData.serving_temp,
          aging_potential: enrichmentData.aging_potential,
          wine_rating: enrichmentData.wine_rating?.toString(),
          enrichment_status: 'completed',
          updated_at: new Date(),
        })
        .where(eq(restaurantWinesIsolated.id, id));
    } catch (error) {
      console.error('Error saving enriched wine:', error);
      throw error;
    }
  }

  async updateWineEnrichment(id: number, enrichmentData: {
    wine_rating?: string;
    general_guest_experience?: string;
    flavor_notes?: string;
    aroma_notes?: string;
    what_makes_special?: string;
    body_description?: string;
    food_pairing?: string;
    serving_temp?: string;
    aging_potential?: string;
    varietals?: string;
    country?: string;
    verified?: boolean;
    verified_source?: string;
  }): Promise<void> {
    try {
      await db
        .update(restaurantWinesIsolated)
        .set({
          ...enrichmentData,
          enrichment_status: 'completed',
          updated_at: new Date(),
        })
        .where(eq(restaurantWinesIsolated.id, id));
    } catch (error) {
      console.error('Error updating wine enrichment:', error);
      throw error;
    }
  }

  async getWinesPendingEnrichment(restaurantId: number, limit = 20): Promise<any[]> {
    try {
      const wines = await db
        .select()
        .from(restaurantWinesIsolated)
        .where(
          and(
            eq(restaurantWinesIsolated.restaurant_id, restaurantId),
            eq(restaurantWinesIsolated.enrichment_status, 'pending')
          )
        )
        .limit(limit);
      return wines;
    } catch (error) {
      console.error('Error fetching pending wines:', error);
      throw error;
    }
  }
}

export const restaurantWineStorage = new RestaurantWineStorage();