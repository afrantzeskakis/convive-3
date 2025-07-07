import React, { useState } from 'react';
import { Award, Restaurant } from '@/types/restaurant';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, AlertCircleIcon, CheckCircleIcon, InfoIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface RestaurantAwardsManagerProps {
  restaurantId: number;
}

const RestaurantAwardsManager: React.FC<RestaurantAwardsManagerProps> = ({ restaurantId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch restaurant details including awards
  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: ['/api/restaurants', restaurantId],
    enabled: !!restaurantId,
  });

  // Mutation to refresh awards
  const refreshAwardsMutation = useMutation({
    mutationFn: async () => {
      setRefreshing(true);
      return apiRequest(`/api/restaurants/${restaurantId}/refresh-awards`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', restaurantId] });
      toast({
        title: 'Awards refreshed',
        description: 'The restaurant awards have been updated successfully.',
        variant: 'default',
      });
      setRefreshing(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to refresh restaurant awards. Please try again later.',
        variant: 'destructive',
      });
      setRefreshing(false);
    },
  });

  // Check for API key status
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'missing' | 'available'>('checking');
  
  // Effect to check if the key is configured by attempting an API call
  React.useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch('/api/perplexity/status');
        const data = await response.json();
        setApiKeyStatus(data.available ? 'available' : 'missing');
      } catch (error) {
        setApiKeyStatus('missing');
      }
    };
    
    checkApiKey();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Awards</CardTitle>
          <CardDescription>Loading restaurant details...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Awards</CardTitle>
          <CardDescription>Error loading restaurant details</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const awards = restaurant?.awards || null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Restaurant Awards</CardTitle>
            <CardDescription>
              Manage awards and accolades for {restaurant?.name}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshAwardsMutation.mutate()}
            disabled={refreshing || refreshAwardsMutation.isPending || apiKeyStatus !== 'available'}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Awards
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {apiKeyStatus === 'missing' && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start">
            <AlertCircleIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-800 font-medium">Perplexity API Key not configured</p>
              <p className="text-sm text-amber-700">
                Automatic award discovery requires a Perplexity API key. Please add the
                PERPLEXITY_API_KEY to your environment variables.
              </p>
            </div>
          </div>
        )}

        {refreshAwardsMutation.isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex items-start">
            <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Searching for awards...</p>
              <p className="text-sm text-blue-700">
                We're searching for awards and accolades for this restaurant. This may take a moment.
              </p>
            </div>
          </div>
        )}

        {awards && awards.length > 0 ? (
          <div className="space-y-4">
            {awards.map((award: Award, index: number) => (
              <div key={`${award.name}-${index}`} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium">{award.name}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {award.year}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{award.organization}</p>
                {award.category && (
                  <p className="text-sm mt-1">Category: {award.category}</p>
                )}
                {award.description && (
                  <p className="text-sm italic mt-1">{award.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No awards found for this restaurant</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Refresh Awards" to search for awards and recognitions
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4 bg-muted/10">
        <div className="text-xs text-muted-foreground">
          <p>
            Awards are automatically discovered using the Perplexity AI API. Results may vary based on
            available information.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RestaurantAwardsManager;