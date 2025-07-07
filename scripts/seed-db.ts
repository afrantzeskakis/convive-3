import { db } from "../server/db";
import { restaurants, type InsertRestaurant } from "../shared/schema";

async function seedRestaurants() {
  const restaurantsData: InsertRestaurant[] = [
    {
      name: "Bella Italia Restaurant",
      description: "Authentic Italian cuisine in a cozy atmosphere.",
      cuisineType: "Italian, Pasta, Pizza",
      address: "123 Main St, New York, NY",
      distance: "1.5 mi",
      imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17",
      rating: "4.6",
      ambiance: "Elegant",
      noiseLevel: "Moderate",
      priceRange: "$$$",
      features: ["Outdoor Seating", "Wine List", "Vegetarian Options"],
      menuUrl: "/menu/bella-italia",
      isFeatured: true
    },
    {
      name: "Sakura Japanese Bistro",
      description: "Modern Japanese cuisine with a focus on fresh ingredients.",
      cuisineType: "Japanese, Sushi, Asian Fusion",
      address: "789 East St, Manhattan, NY",
      distance: "0.8 mi",
      imageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9",
      rating: "4.5",
      ambiance: "Modern",
      noiseLevel: "Lively",
      priceRange: "$$",
      features: ["Sushi Bar", "Sake Selection", "Private Dining"],
      menuUrl: "/menu/sakura-bistro",
      isFeatured: true
    },
    {
      name: "Page Turner Café",
      description: "Cozy café with great brunch options and book-themed ambiance.",
      cuisineType: "Café, Brunch, Vegetarian",
      address: "456 Park Ave, Brooklyn, NY",
      distance: "0.5 mi",
      imageUrl: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2",
      rating: "4.7",
      ambiance: "Casual",
      noiseLevel: "Quiet",
      priceRange: "$$",
      features: ["Book Exchange", "Organic Coffee", "Vegan Options"],
      menuUrl: "/menu/page-turner",
      isFeatured: false
    },
    {
      name: "Olivia's Mediterranean",
      description: "Fresh Mediterranean cuisine with vegetarian-friendly options.",
      cuisineType: "Mediterranean, Vegetarian-Friendly",
      address: "555 Ocean Dr, New York, NY",
      distance: "1.2 mi",
      imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b",
      rating: "4.8",
      ambiance: "Cozy",
      noiseLevel: "Quiet",
      priceRange: "$$",
      features: ["Outdoor Seating", "Mezze Platters", "Gluten-Free Options"],
      menuUrl: "/menu/olivias",
      isFeatured: false
    }
  ];

  try {
    // Delete existing restaurants (this is for testing purposes)
    await db.delete(restaurants);
    
    console.log("Inserting restaurants...");
    const insertedRestaurants = await db.insert(restaurants).values(restaurantsData).returning();
    console.log(`Successfully inserted ${insertedRestaurants.length} restaurants.`);
    
    for (const restaurant of insertedRestaurants) {
      console.log(`- ${restaurant.name} (ID: ${restaurant.id}), Featured: ${restaurant.isFeatured}`);
    }
  } catch (error) {
    console.error("Error seeding restaurants:", error);
  } finally {
    process.exit(0);
  }
}

seedRestaurants();