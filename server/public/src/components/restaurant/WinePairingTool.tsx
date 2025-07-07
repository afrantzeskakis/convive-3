import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../hooks/use-toast';
import { Wine, Utensils, Star, Thermometer } from 'lucide-react';
import { apiRequest } from '../../lib/queryClient';

interface WinePairingResult {
  restaurantId: number;
  dishes: string[];
  totalWinesAvailable: number;
  pairings: {
    dish: string;
    recommended_wines: {
      wine_id: number;
      wine_name: string;
      pairing_explanation: string;
      confidence_score: number;
      serving_notes: string;
    }[];
  }[];
  sommelier_notes: string;
}

interface WineRecommendationResult {
  restaurantId: number;
  preferences: any;
  totalWinesConsidered: number;
  recommendations: {
    wine_id: number;
    wine_name: string;
    match_explanation: string;
    tasting_preview: string;
    value_notes: string;
    confidence_score: number;
  }[];
  sommelier_insights: string;
}

interface WinePairingToolProps {
  restaurantId: number;
}

export function WinePairingTool({ restaurantId }: WinePairingToolProps) {
  const [dishes, setDishes] = useState('');
  const [preferences, setPreferences] = useState({
    wine_type: '',
    body: '',
    region: '',
    budget: ''
  });
  const [occasion, setOccasion] = useState('');
  const [pairingResult, setPairingResult] = useState<WinePairingResult | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<WineRecommendationResult | null>(null);
  
  const { toast } = useToast();

  // Wine pairing mutation
  const pairingMutation = useMutation({
    mutationFn: async ({ dishes, preferences }: { dishes: string[]; preferences?: any }) => {
      const response = await fetch(`/api/restaurants/${restaurantId}/wine-pairing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishes, preferences }),
      });
      if (!response.ok) throw new Error('Failed to generate pairings');
      return response.json();
    },
    onSuccess: (data) => {
      setPairingResult(data);
      toast({ title: 'Wine pairings generated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to generate pairings', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Wine recommendation mutation
  const recommendationMutation = useMutation({
    mutationFn: async ({ preferences, occasion, budget }: { preferences: any; occasion?: string; budget?: string }) => {
      const response = await fetch(`/api/restaurants/${restaurantId}/wine-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences, occasion, budget }),
      });
      if (!response.ok) throw new Error('Failed to generate recommendations');
      return response.json();
    },
    onSuccess: (data) => {
      setRecommendationResult(data);
      toast({ title: 'Wine recommendations generated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to generate recommendations', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const handleGeneratePairings = () => {
    if (!dishes.trim()) {
      toast({ 
        title: 'Please enter dishes', 
        description: 'Add some dishes to get wine pairing recommendations',
        variant: 'destructive' 
      });
      return;
    }
    
    const dishList = dishes.split('\n').filter(dish => dish.trim()).map(dish => dish.trim());
    pairingMutation.mutate({ dishes: dishList, preferences });
  };

  const handleGenerateRecommendations = () => {
    const hasPreferences = Object.values(preferences).some(value => value);
    
    if (!hasPreferences && !occasion) {
      toast({ 
        title: 'Please set preferences', 
        description: 'Add some preferences or occasion to get recommendations',
        variant: 'destructive' 
      });
      return;
    }
    
    recommendationMutation.mutate({ 
      preferences: hasPreferences ? preferences : undefined, 
      occasion: occasion || undefined,
      budget: preferences.budget || undefined
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Wine Pairing & Recommendations</h2>
        <p className="text-muted-foreground">AI-powered wine suggestions for your restaurant</p>
      </div>

      <Tabs defaultValue="pairing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pairing">Food Pairing</TabsTrigger>
          <TabsTrigger value="recommendations">Wine Recommendations</TabsTrigger>
        </TabsList>

        {/* Food Pairing Tab */}
        <TabsContent value="pairing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Utensils className="mr-2 h-5 w-5" />
                Food & Wine Pairing
              </CardTitle>
              <CardDescription>
                Enter your dishes to get expert wine pairing recommendations from your inventory.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dishes">Dishes (one per line)</Label>
                <Textarea
                  id="dishes"
                  placeholder="Grilled salmon with lemon&#10;Beef tenderloin with mushroom sauce&#10;Chocolate tart"
                  value={dishes}
                  onChange={(e) => setDishes(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Wine Type</Label>
                  <Select value={preferences.wine_type} onValueChange={(value) => setPreferences({...preferences, wine_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="rosé">Rosé</SelectItem>
                      <SelectItem value="sparkling">Sparkling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Body</Label>
                  <Select value={preferences.body} onValueChange={(value) => setPreferences({...preferences, body: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any body</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select value={preferences.region} onValueChange={(value) => setPreferences({...preferences, region: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any region</SelectItem>
                      <SelectItem value="bordeaux">Bordeaux</SelectItem>
                      <SelectItem value="burgundy">Burgundy</SelectItem>
                      <SelectItem value="tuscany">Tuscany</SelectItem>
                      <SelectItem value="napa">Napa Valley</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Select value={preferences.budget} onValueChange={(value) => setPreferences({...preferences, budget: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any budget</SelectItem>
                      <SelectItem value="budget">Budget-friendly</SelectItem>
                      <SelectItem value="mid-range">Mid-range</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGeneratePairings} 
                disabled={pairingMutation.isPending}
                className="w-full"
              >
                <Wine className="mr-2 h-4 w-4" />
                {pairingMutation.isPending ? 'Generating...' : 'Generate Pairings'}
              </Button>
            </CardContent>
          </Card>

          {/* Pairing Results */}
          {pairingResult && (
            <Card>
              <CardHeader>
                <CardTitle>Wine Pairing Results</CardTitle>
                <CardDescription>
                  Found {pairingResult.totalWinesAvailable} wines in your inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {pairingResult.pairings.map((pairing, index) => (
                  <div key={index} className="space-y-4 border-b pb-4 last:border-b-0">
                    <h4 className="font-semibold text-lg flex items-center">
                      <Utensils className="mr-2 h-4 w-4" />
                      {pairing.dish}
                    </h4>
                    
                    <div className="space-y-3">
                      {pairing.recommended_wines.map((wine, wineIndex) => (
                        <div key={wineIndex} className="bg-muted/30 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{wine.wine_name}</h5>
                            <Badge className={getConfidenceColor(wine.confidence_score)}>
                              {Math.round(wine.confidence_score * 100)}% match
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {wine.pairing_explanation}
                          </p>
                          
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Thermometer className="mr-1 h-3 w-3" />
                            {wine.serving_notes}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {pairingResult.sommelier_notes && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Sommelier Notes</h4>
                    <p className="text-blue-800 text-sm">{pairingResult.sommelier_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Wine Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5" />
                Wine Recommendations
              </CardTitle>
              <CardDescription>
                Get personalized wine recommendations based on preferences and occasion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Occasion</Label>
                  <Select value={occasion} onValueChange={setOccasion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any occasion</SelectItem>
                      <SelectItem value="romantic dinner">Romantic dinner</SelectItem>
                      <SelectItem value="business meeting">Business meeting</SelectItem>
                      <SelectItem value="celebration">Celebration</SelectItem>
                      <SelectItem value="casual dining">Casual dining</SelectItem>
                      <SelectItem value="wine tasting">Wine tasting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerateRecommendations} 
                disabled={recommendationMutation.isPending}
                className="w-full"
              >
                <Star className="mr-2 h-4 w-4" />
                {recommendationMutation.isPending ? 'Generating...' : 'Get Recommendations'}
              </Button>
            </CardContent>
          </Card>

          {/* Recommendation Results */}
          {recommendationResult && (
            <Card>
              <CardHeader>
                <CardTitle>Wine Recommendations</CardTitle>
                <CardDescription>
                  Based on {recommendationResult.totalWinesConsidered} wines in your collection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendationResult.recommendations.map((wine, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{wine.wine_name}</h4>
                      <Badge className={getConfidenceColor(wine.confidence_score)}>
                        {Math.round(wine.confidence_score * 100)}% match
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Why it fits:</strong> {wine.match_explanation}</p>
                      <p><strong>Tasting notes:</strong> {wine.tasting_preview}</p>
                      <p><strong>Value:</strong> {wine.value_notes}</p>
                    </div>
                  </div>
                ))}
                
                {recommendationResult.sommelier_insights && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Sommelier Insights</h4>
                    <p className="text-green-800 text-sm">{recommendationResult.sommelier_insights}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}