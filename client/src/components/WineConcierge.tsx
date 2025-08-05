import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wine, Search, DollarSign, Star, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface WineRecommendation {
  id: number;
  wine_name: string;
  producer: string;
  vintage: string;
  type: string;
  region: string;
  country: string;
  price: string | number;
  grape_variety: string;
  tasting_notes: string;
  food_pairing: string;
  serving_temp: string;
  glass_price: string | number;
  similarity_score: number;
  is_wild_card: boolean;
  match_reason: string;
}

interface WineConciergeProps {
  restaurantId: number;
}

interface EmbeddingStats {
  restaurant_id: number;
  total_wines: number;
  wines_with_embeddings: number;
  wines_without_embeddings: number;
}

export function WineConcierge({ restaurantId }: WineConciergeProps) {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState<WineRecommendation[]>([]);
  const { toast } = useToast();

  // Check embedding statistics
  const { data: stats } = useQuery<EmbeddingStats>({
    queryKey: [`/api/wine-concierge/embeddings/stats/${restaurantId}`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Generate embeddings mutation
  const generateEmbeddings = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/wine-concierge/embeddings/generate`, { restaurantId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Embedding Generation Started",
        description: "Wine embeddings are being generated. This may take a few minutes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate embeddings",
        variant: "destructive",
      });
    },
  });

  // Get recommendations mutation
  const getRecommendations = useMutation({
    mutationFn: async (searchQuery: string) => {
      const response = await apiRequest("POST", "/api/wine-concierge/recommend", { 
        restaurantId, 
        query: searchQuery 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setRecommendations(data.recommendations || []);
      if (data.recommendations?.length === 0) {
        toast({
          title: "No Matches Found",
          description: "Try adjusting your search criteria",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get recommendations",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      getRecommendations.mutate(query);
    }
  };

  const formatPrice = (price: string | number | undefined) => {
    if (!price) return "N/A";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(0)}`;
  };

  const needsEmbeddings = stats && stats.wines_without_embeddings > 0;
  const embeddingProgress = stats ? Math.round((stats.wines_with_embeddings / stats.total_wines) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wine className="h-5 w-5" />
            Wine Concierge
          </CardTitle>
          <CardDescription>
            Find the perfect wine based on guest preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Embedding Status */}
          {stats && (
            <div className="mb-6 p-4 bg-secondary/20 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Wine Analysis Status</span>
                <span className="text-sm text-muted-foreground">
                  {stats.wines_with_embeddings} / {stats.total_wines} wines analyzed
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mb-3">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${embeddingProgress}%` }}
                />
              </div>
              {needsEmbeddings && (
                <Button
                  onClick={() => generateEmbeddings.mutate()}
                  disabled={generateEmbeddings.isPending}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  {generateEmbeddings.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Analysis...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Remaining Wines
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="e.g. 'light red wine under $60' or 'bold white with seafood'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                disabled={getRecommendations.isPending}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={!query.trim() || getRecommendations.isPending}
            >
              {getRecommendations.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding Wines...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Get Recommendations
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recommended Wines</h3>
          {recommendations.map((wine, index) => (
            <Card 
              key={wine.id} 
              className={wine.is_wild_card ? "border-purple-500/50" : ""}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {wine.wine_name}
                    </CardTitle>
                    <CardDescription>
                      {wine.producer} • {wine.vintage}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatPrice(wine.price)}</div>
                    {wine.glass_price && (
                      <div className="text-sm text-muted-foreground">
                        Glass: {formatPrice(wine.glass_price)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant={wine.is_wild_card ? "secondary" : "default"}>
                    {wine.match_reason}
                  </Badge>
                  {wine.similarity_score && (
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3" />
                      {Math.round(wine.similarity_score * 100)}% match
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Wine Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <div className="font-medium">{wine.type || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Varietal:</span>
                    <div className="font-medium">{wine.grape_variety || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Region:</span>
                    <div className="font-medium">{wine.region || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Country:</span>
                    <div className="font-medium">{wine.country || "N/A"}</div>
                  </div>
                </div>

                <Separator />

                {/* Tasting Notes */}
                {wine.tasting_notes && (
                  <div>
                    <h4 className="font-medium mb-1">Tasting Notes</h4>
                    <p className="text-sm text-muted-foreground">
                      {wine.tasting_notes}
                    </p>
                  </div>
                )}

                {/* Food Pairing */}
                {wine.food_pairing && (
                  <div>
                    <h4 className="font-medium mb-1">Food Pairing</h4>
                    <p className="text-sm text-muted-foreground">
                      {wine.food_pairing}
                    </p>
                  </div>
                )}

                {/* Serving Temperature */}
                {wine.serving_temp && (
                  <div>
                    <h4 className="font-medium mb-1">Serving Temperature</h4>
                    <p className="text-sm text-muted-foreground">
                      {wine.serving_temp}
                    </p>
                  </div>
                )}

                {/* Comparison with Previous Wine */}
                {index > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">
                      Compared to {recommendations[0].wine_name}:
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {getComparisonPoints(wine, recommendations[0]).map((point, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to generate comparison points
function getComparisonPoints(wine: WineRecommendation, firstWine: WineRecommendation): string[] {
  const points: string[] = [];

  // Price comparison
  const winePrice = typeof wine.price === 'string' ? parseFloat(wine.price) : wine.price;
  const firstPrice = typeof firstWine.price === 'string' ? parseFloat(firstWine.price) : firstWine.price;
  
  if (winePrice && firstPrice) {
    const priceDiff = winePrice - firstPrice;
    if (Math.abs(priceDiff) > 5) {
      points.push(
        priceDiff > 0 
          ? `$${Math.round(priceDiff)} more expensive`
          : `$${Math.round(-priceDiff)} less expensive`
      );
    }
  }

  // Type comparison
  if (wine.type !== firstWine.type) {
    points.push(`${wine.type} instead of ${firstWine.type}`);
  }

  // Region comparison
  if (wine.region !== firstWine.region && wine.region && firstWine.region) {
    points.push(`From ${wine.region} vs ${firstWine.region}`);
  }

  // Varietal comparison
  if (wine.grape_variety !== firstWine.grape_variety && wine.grape_variety && firstWine.grape_variety) {
    points.push(`${wine.grape_variety} grapes vs ${firstWine.grape_variety}`);
  }

  // Wild card note
  if (wine.is_wild_card) {
    points.push("Adventurous choice for guests open to discovery");
  }

  return points.slice(0, 3); // Limit to 3 comparison points
}