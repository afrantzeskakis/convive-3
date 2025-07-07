export interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisineType: string;
  address: string;
  distance?: string;
  imageUrl?: string;
  rating?: string;
  ambiance?: string;
  noiseLevel?: string;
  priceRange?: string;
  features?: Record<string, any>;
  awards?: Award[] | null;
  menuUrl?: string;
  isFeatured: boolean;
  managerId?: number;
}

export interface Award {
  name: string;          // Award name
  organization: string;  // Awarding organization
  year: string;          // Year awarded
  category?: string;     // Optional award category
  description?: string;  // Optional description of the award
}

export interface RestaurantWithAwards extends Restaurant {
  awards: Award[] | null;
}