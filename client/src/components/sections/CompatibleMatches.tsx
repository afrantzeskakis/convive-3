import { useQuery } from "@tanstack/react-query";
import MatchCard from "@/components/cards/MatchCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export default function CompatibleMatches() {
  const { user } = useAuth();
  
  const { data: matches, isLoading, error } = useQuery({
    queryKey: [`/api/users/${user?.id}/matches`],
    enabled: !!user?.id,
  });

  if (!user) return null;

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold font-poppins text-gray-900">Your Compatible Matches</h2>
          <Link href="/matches" className="text-primary font-medium hover:text-primary/90">
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <Skeleton className="h-56 w-full" />
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-6 w-32 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <div className="flex flex-wrap gap-1">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load matches</h3>
            <p className="text-gray-600 mb-4">There was an error finding your compatible matches.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : matches && Array.isArray(matches) && matches.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {matches.map((match: any) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-4">Complete your profile to find your perfect dining companions.</p>
            <Button className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/questionnaire">Complete Questionnaire</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
