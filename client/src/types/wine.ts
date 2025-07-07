/**
 * Shared Wine Type Definitions
 */

export interface WineData {
  id: number;
  wine_name: string;
  producer: string;
  vintage: string;
  region: string;
  country: string;
  wine_type: string;
  varietals: string;
  verified: boolean;
  verified_source: string | null;
  vivino_rating: string | null;
  vivino_id: string | null;
  vivino_url: string | null;
  wine_rating: string | null;
  tasting_notes: string | null;
  flavor_notes: string | null;
  aroma_notes: string | null;
  what_makes_special: string | null;
  body_description: string | null;
  texture: string | null;
  balance: string | null;
  tannin_level: string | null;
  acidity: string | null;
  finish_length: string | null;
  food_pairing: string | null;
  serving_temp: string | null;
  oak_influence: string | null;
  aging_potential: string | null;
  blend_description: string | null;
  description_enhanced: string | null;
  created_at: string;
}

export interface WineSearchResponse {
  wines: WineData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WineStats {
  totalWines: number;
  verifiedWines: number;
  totalRestaurantWines: number;
  recentUploads: any[];
}