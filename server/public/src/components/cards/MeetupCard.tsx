import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { format } from "date-fns";

interface MeetupCardProps {
  meetup: {
    id: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    restaurant: {
      name: string;
      address: string;
      imageUrl: string;
    };
    participants: Array<{
      id: number;
      fullName: string;
      profilePicture?: string;
    }>;
  };
}

export default function MeetupCard({ meetup }: MeetupCardProps) {
  const meetupDate = new Date(meetup.date);
  const formattedMonth = format(meetupDate, 'MMM').toUpperCase();
  const formattedDay = format(meetupDate, 'd');
  
  // Map status to badge variant
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  // Format status for display
  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card className="overflow-hidden border border-gray-200">
      <div className="relative">
        <img 
          className="h-48 w-full object-cover" 
          src={meetup.restaurant.imageUrl} 
          alt={meetup.restaurant.name}
        />
      </div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <Badge 
              variant={getBadgeVariant(meetup.status) as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"} 
              className="mb-2"
            >
              {getStatusText(meetup.status)}
            </Badge>
            <h3 className="text-xl font-semibold font-poppins">{meetup.title}</h3>
            <p className="text-gray-600">{meetup.restaurant.name}</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2">
            <span className="text-sm font-semibold">{formattedMonth}</span>
            <span className="text-xl font-bold">{formattedDay}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center">
            <i className="fas fa-clock text-gray-400 mr-2"></i>
            <span className="text-gray-600">{meetup.startTime} - {meetup.endTime}</span>
          </div>
          <div className="flex items-center mt-1">
            <i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>
            <span className="text-gray-600">{meetup.restaurant.address}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex -space-x-2 overflow-hidden">
            {meetup.participants.slice(0, 4).map((participant) => (
              <Avatar key={participant.id} className="h-8 w-8 border-2 border-white">
                <AvatarImage src={participant.profilePicture} alt={participant.fullName} />
                <AvatarFallback>{participant.fullName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            ))}
            {meetup.participants.length > 4 && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 border-2 border-white">
                <span className="text-xs font-medium">+{meetup.participants.length - 4}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <Link href={`/meetup/${meetup.id}`}>
            <a className="text-primary font-medium">View Details</a>
          </Link>
          <Link href={`/meetup/${meetup.id}/chat`}>
            <a className="text-[#00A699] font-medium">Chat</a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
