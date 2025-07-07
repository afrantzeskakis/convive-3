import { useQuery } from "@tanstack/react-query";
import MeetupCard from "../cards/MeetupCard";
import { Button } from "../ui/button";
import { Link } from "wouter";
import { Skeleton } from "../ui/skeleton";

export default function UpcomingMeetups() {
  const { data: meetups, isLoading, error } = useQuery({
    queryKey: ['/api/meetups/upcoming'],
  });

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold font-poppins text-gray-900">Upcoming Meetups</h2>
          <Link href="/my-meetups" className="text-primary font-medium hover:text-primary/90">
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <Skeleton className="h-48 w-full" />
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-6 w-48 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-14 w-14 rounded-lg" />
                  </div>
                  <div className="mt-4">
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="mt-4">
                    <Skeleton className="h-8 w-32" />
                  </div>
                  <div className="mt-4 flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load meetups</h3>
            <p className="text-gray-600 mb-4">There was an error loading the upcoming meetups.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : meetups && Array.isArray(meetups) && meetups.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {meetups.map((meetup: any) => (
              <MeetupCard key={meetup.id} meetup={meetup} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming meetups</h3>
            <p className="text-gray-600 mb-4">Be the first to create a dining experience!</p>
            <Button className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/create-meetup">Create Meetup</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
