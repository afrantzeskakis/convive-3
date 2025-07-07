/**
 * Wine Recommendations Page - Mobile-First Server Interface
 * Allows servers to get wine recommendations for guests
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wine, Clock, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WineMatch {
  wine_id: number;
  wine_name: string;
  producer: string;
  vintage?: string;
  price: string;
  match_score: number;
  match_type: "perfect" | "surprise";
  characteristics: {
    acidity?: string;
    tannins?: string;
    intensity?: string;
    sweetness?: string;
    body_description?: string;
  };
  description: string;
  missed_criteria?: string[];
}

interface RecommendationResponse {
  success: boolean;
  recommendations: WineMatch[];
  guest_preferences: any;
  total_inventory: number;
  processing_time: number;
}

export default function WineRecommendations() {
  const [guestDescription, setGuestDescription] = useState("");
  const [recommendations, setRecommendations] = useState<WineMatch[]>([]);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const { toast } = useToast();

  const recommendationMutation = useMutation({
    mutationFn: async (description: string): Promise<RecommendationResponse> => {
      const response = await fetch("/api/wine-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          restaurant_id: 1, // TODO: Get from auth context
          guest_description: description,
          server_user_id: 1 // TODO: Get from auth context
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get wine recommendations');
      }
      
      const data = await response.json();
      return data;
    },
    onSuccess: (data: RecommendationResponse) => {
      setRecommendations(data.recommendations);
      setProcessingTime(data.processing_time);
      toast({
        title: "Wine recommendations ready!",
        description: `Found ${data.recommendations.length} perfect matches in ${(data.processing_time / 1000).toFixed(1)}s`,
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to get recommendations",
        description: "Please try describing the wine request differently",
        variant: "destructive",
      });
    },
  });

  const handleGetRecommendations = () => {
    if (!guestDescription.trim()) {
      toast({
        title: "Please describe the wine request",
        description: "Enter what the guest is looking for",
        variant: "destructive",
      });
      return;
    }

    recommendationMutation.mutate(guestDescription);
  };

  const handleClearResults = () => {
    setRecommendations([]);
    setGuestDescription("");
    setProcessingTime(0);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Wine className="h-6 w-6" />
          Wine Recommendations
        </h1>
        <p className="text-gray-600">
          Describe what your guest is looking for and get instant wine matches
        </p>
      </div>

      {/* Guest Description Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Guest Wine Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe what your guest wants... 
Examples:
• 'Something bold and red, not too expensive'
• 'Light white wine, crisp and refreshing'
• 'Full-bodied red with good tannins for the ribeye'"
            value={guestDescription}
            onChange={(e) => setGuestDescription(e.target.value)}
            rows={4}
            className="text-base"
          />
          
          <div className="flex gap-2">
            <Button 
              onClick={handleGetRecommendations}
              disabled={recommendationMutation.isPending}
              className="flex-1 text-base py-6"
            >
              {recommendationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding wines...
                </>
              ) : (
                <>
                  <Wine className="mr-2 h-4 w-4" />
                  Get Recommendations
                </>
              )}
            </Button>
            
            {recommendations.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleClearResults}
                className="px-4 py-6"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Time Display */}
      {processingTime > 0 && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          Processed in {(processingTime / 1000).toFixed(1)} seconds
        </div>
      )}

      {/* Wine Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            Recommended Wines ({recommendations.length})
          </h2>
          
          {recommendations.map((wine, index) => (
            <Card 
              key={wine.wine_id} 
              className={`border-l-4 ${
                wine.match_type === "perfect" 
                  ? "border-l-green-500 bg-green-50" 
                  : "border-l-blue-500 bg-blue-50"
              }`}
            >
              <CardContent className="p-6">
                {/* Wine Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {wine.wine_name} {wine.vintage}
                    </h3>
                    <p className="text-gray-600">{wine.producer}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {wine.price}
                    </div>
                    <Badge 
                      variant={wine.match_type === "perfect" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {wine.match_type === "perfect" ? "Perfect Match" : "Surprise Pick"}
                    </Badge>
                  </div>
                </div>

                {/* Wine Description */}
                <p className="text-gray-800 mb-4 leading-relaxed">
                  {wine.description}
                </p>

                {/* Characteristics */}
                {Object.keys(wine.characteristics).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Professional Characteristics:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {wine.characteristics.acidity && (
                        <div>
                          <span className="text-gray-600">Acidity:</span> {wine.characteristics.acidity}
                        </div>
                      )}
                      {wine.characteristics.tannins && (
                        <div>
                          <span className="text-gray-600">Tannins:</span> {wine.characteristics.tannins}
                        </div>
                      )}
                      {wine.characteristics.intensity && (
                        <div>
                          <span className="text-gray-600">Intensity:</span> {wine.characteristics.intensity}
                        </div>
                      )}
                      {wine.characteristics.sweetness && (
                        <div>
                          <span className="text-gray-600">Sweetness:</span> {wine.characteristics.sweetness}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Missed Criteria for Surprise Picks */}
                {wine.match_type === "surprise" && wine.missed_criteria && wine.missed_criteria.length > 0 && (
                  <div className="bg-blue-100 border border-blue-200 rounded p-3">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Why this is still excellent:
                    </p>
                    <p className="text-sm text-blue-700">
                      Doesn't match: {wine.missed_criteria.join(", ")}, but offers exceptional 
                      quality and flavor that your guest will love.
                    </p>
                  </div>
                )}

                {/* Match Score (for debugging - remove in production) */}
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <Star className="h-3 w-3" />
                  Confidence: {Math.round(wine.match_score * 100)}%
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!recommendationMutation.isPending && recommendations.length === 0 && guestDescription === "" && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wine className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to help your guests
            </h3>
            <p className="text-gray-600 max-w-md">
              Describe what your guest is looking for and get instant, 
              professional wine recommendations from your restaurant's inventory.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}