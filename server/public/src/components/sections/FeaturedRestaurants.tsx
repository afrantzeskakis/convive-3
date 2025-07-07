import { useQuery } from "@tanstack/react-query";
import RestaurantCard from "../cards/RestaurantCard";
import { Button } from "../ui/button";
import { Link } from "wouter";
import { Skeleton } from "../ui/skeleton";
import { Star, Award, Shield } from "lucide-react";

export default function FeaturedRestaurants() {
  // Using the same endpoint but with a changed semantic meaning on the backend
  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ['/api/restaurants/featured'],
  });

  return (
    <div className="bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-bold font-serif text-slate-800 sm:text-4xl">Exclusive Partner Venues</h2>
          <div className="h-0.5 w-20 bg-slate-300 mx-auto mt-4"></div>
          <p className="mt-6 text-lg text-slate-500">
            We partner with only the finest establishments, each offering exceptional cuisine and an unparalleled dining atmosphere.
          </p>
        </div>

        <div className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                <Star className="h-8 w-8 text-slate-500" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-slate-800">Exceptional Cuisine</h3>
            <p className="mt-2 text-slate-500">Carefully selected for their outstanding menu offerings and culinary expertise.</p>
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                <Award className="h-8 w-8 text-slate-500" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-slate-800">Expert Staff</h3>
            <p className="mt-2 text-slate-500">Each venue provides a dedicated host with deep knowledge of their culinary offerings.</p>
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-sm bg-white p-3 border border-slate-100 shadow-sm">
                <Shield className="h-8 w-8 text-slate-500" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-slate-800">Exclusive Partnership</h3>
            <p className="mt-2 text-slate-500">Our restaurant partners work exclusively with Convive to provide these unique experiences.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-sm shadow-sm overflow-hidden border border-slate-100">
                <Skeleton className="h-64 w-full bg-slate-50" />
                <div className="p-6 bg-white">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-32 mb-1 bg-slate-50" />
                    <Skeleton className="h-4 w-10 bg-slate-50" />
                  </div>
                  <Skeleton className="h-4 w-48 mb-3 bg-slate-50" />
                  <div className="flex space-x-2 mb-4">
                    <Skeleton className="h-6 w-16 rounded-sm bg-slate-50" />
                    <Skeleton className="h-6 w-16 rounded-sm bg-slate-50" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-14 bg-slate-50" />
                    <Skeleton className="h-4 w-20 bg-slate-50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-sm border border-slate-100 shadow-sm">
            <h3 className="text-lg font-medium text-slate-800 mb-2">Unable to load partner venues</h3>
            <p className="text-slate-500 mb-4">There was an error loading our exclusive partner venues.</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="rounded-sm border-slate-300 text-slate-600 hover:bg-slate-50">
              Try Again
            </Button>
          </div>
        ) : restaurants && Array.isArray(restaurants) && restaurants.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant: any) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <Button asChild variant="outline" className="border-slate-300 text-slate-600 rounded-sm px-8 hover:bg-slate-50">
                <Link href="/restaurants">
                  View All Partner Venues
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-sm border border-slate-100 shadow-sm">
            <h3 className="text-lg font-medium text-slate-800 mb-2">Venue Partnerships Coming Soon</h3>
            <p className="text-slate-500">We're finalizing partnerships with the most exclusive restaurants in your city.</p>
          </div>
        )}
      </div>
    </div>
  );
}
