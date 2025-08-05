import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wine, Search, DollarSign, Star, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

// Helper function to create a 3-sentence summary
const createWineSummary = (wine: WineRecommendation): string => {
  const sentences: string[] = [];
  
  // Sentence 1: Basic info
  sentences.push(`${wine.producer} ${wine.wine_name} is a ${wine.type} from ${wine.region}, ${wine.country}.`);
  
  // Sentence 2: Flavor profile
  if (wine.tasting_notes) {
    const notes = wine.tasting_notes.split('.')[0] + '.';
    sentences.push(notes.length > 150 ? notes.substring(0, 147) + '...' : notes);
  } else {
    sentences.push(`This ${wine.grape_variety || wine.type} offers distinctive character.`);
  }
  
  // Sentence 3: Food pairing or serving suggestion
  if (wine.food_pairing) {
    const pairing = wine.food_pairing.split('.')[0] + '.';
    sentences.push(pairing.length > 150 ? pairing.substring(0, 147) + '...' : pairing);
  } else if (wine.serving_temp) {
    sentences.push(`Best served at ${wine.serving_temp}.`);
  } else {
    sentences.push(`A versatile wine suitable for various occasions.`);
  }
  
  return sentences.join(' ');
};

// Helper function to extract key differences
const extractKeyDifferences = (wine: WineRecommendation, referenceWine: WineRecommendation): string[] => {
  const differences: string[] = [];
  
  // Price difference (always include if significant)
  const winePrice = typeof wine.price === 'string' ? parseFloat(wine.price.replace(/[^0-9.]/g, '')) : wine.price;
  const refPrice = typeof referenceWine.price === 'string' ? parseFloat(referenceWine.price.replace(/[^0-9.]/g, '')) : referenceWine.price;
  const priceDiff = Math.abs(winePrice - refPrice);
  if (priceDiff > 10) {
    differences.push(`${winePrice > refPrice ? 'Higher' : 'Lower'} price point by $${priceDiff.toFixed(0)}`);
  }
  
  // Analyze tasting notes for flavor profile differences
  if (wine.tasting_notes && referenceWine.tasting_notes) {
    const wineNotes = wine.tasting_notes.toLowerCase();
    const refNotes = referenceWine.tasting_notes.toLowerCase();
    
    // Extract flavor keywords
    const fruitKeywords = ['cherry', 'blackberry', 'raspberry', 'plum', 'apple', 'pear', 'citrus', 'lemon', 'peach', 'apricot'];
    const bodyKeywords = ['light', 'medium', 'full', 'bold', 'delicate', 'robust', 'elegant'];
    const tanninKeywords = ['tannic', 'smooth', 'silky', 'grippy', 'soft tannins', 'firm tannins'];
    
    // Find body differences
    const wineBody = bodyKeywords.find(keyword => wineNotes.includes(keyword));
    const refBody = bodyKeywords.find(keyword => refNotes.includes(keyword));
    if (wineBody && refBody && wineBody !== refBody) {
      differences.push(`${wineBody.charAt(0).toUpperCase() + wineBody.slice(1)}-bodied vs ${refBody}-bodied`);
    }
    
    // Find fruit profile differences
    const wineFruits = fruitKeywords.filter(fruit => wineNotes.includes(fruit));
    const refFruits = fruitKeywords.filter(fruit => refNotes.includes(fruit));
    if (wineFruits.length > 0 && refFruits.length > 0 && wineFruits[0] !== refFruits[0]) {
      differences.push(`${wineFruits[0].charAt(0).toUpperCase() + wineFruits[0].slice(1)} notes vs ${refFruits[0]} notes`);
    }
    
    // Find tannin differences
    const wineTannins = tanninKeywords.find(keyword => wineNotes.includes(keyword));
    const refTannins = tanninKeywords.find(keyword => refNotes.includes(keyword));
    if (wineTannins && refTannins && wineTannins !== refTannins) {
      differences.push(`${wineTannins.charAt(0).toUpperCase() + wineTannins.slice(1)} vs ${refTannins}`);
    }
  }
  
  // Region/Origin difference (more descriptive)
  if (wine.country !== referenceWine.country || wine.region !== referenceWine.region) {
    if (wine.region && referenceWine.region) {
      differences.push(`${wine.region} terroir vs ${referenceWine.region}`);
    } else {
      differences.push(`${wine.country} origin vs ${referenceWine.country}`);
    }
  }
  
  // Grape variety difference (more descriptive)
  if (wine.grape_variety !== referenceWine.grape_variety && wine.grape_variety && referenceWine.grape_variety) {
    differences.push(`${wine.grape_variety} character vs ${referenceWine.grape_variety}`);
  }
  
  // Wine type/style difference
  if (wine.type !== referenceWine.type) {
    differences.push(`${wine.type} style vs ${referenceWine.type}`);
  }
  
  // Vintage difference (only if significant)
  if (wine.vintage !== referenceWine.vintage) {
    const vintageGap = Math.abs(parseInt(wine.vintage) - parseInt(referenceWine.vintage));
    if (vintageGap >= 3) {
      differences.push(`${vintageGap} years ${parseInt(wine.vintage) > parseInt(referenceWine.vintage) ? 'younger' : 'older'}`);
    }
  }
  
  // Food pairing differences
  if (wine.food_pairing && referenceWine.food_pairing && differences.length < 3) {
    const winePairing = wine.food_pairing.toLowerCase();
    const refPairing = referenceWine.food_pairing.toLowerCase();
    const meatKeywords = ['beef', 'lamb', 'pork', 'chicken', 'fish', 'seafood', 'duck', 'game'];
    
    const wineMeat = meatKeywords.find(meat => winePairing.includes(meat));
    const refMeat = meatKeywords.find(meat => refPairing.includes(meat));
    
    if (wineMeat && refMeat && wineMeat !== refMeat) {
      differences.push(`Pairs with ${wineMeat} vs ${refMeat}`);
    }
  }
  
  // Ensure we have exactly 3 meaningful differences
  return differences.slice(0, 3);
};

export function WineConcierge({ restaurantId }: WineConciergeProps) {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState<WineRecommendation[]>([]);
  const [expandedWines, setExpandedWines] = useState<Set<number>>(new Set());
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
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((wine, index) => (
              <Card 
                key={wine.id} 
                className={wine.is_wild_card ? "border-purple-500/50" : ""}
              >
                <CardHeader>
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {wine.wine_name}
                    </CardTitle>
                    <CardDescription>
                      {wine.producer} • {wine.vintage}
                    </CardDescription>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-2xl font-bold">
                      {formatPrice(wine.price)}
                    </div>
                    <Badge variant={wine.is_wild_card ? "secondary" : "default"} className="text-xs">
                      {index === 2 ? "Wild Card" : index === 1 ? "Alternative" : "Best Match"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* 3-Sentence Summary */}
                  <div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {createWineSummary(wine)}
                    </p>
                  </div>

                  {/* Key Differences (show for 2nd and 3rd wines) */}
                  {index > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Key Differences
                      </h4>
                      <ul className="space-y-1">
                        {extractKeyDifferences(wine, recommendations[0]).map((diff, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-purple-500 mt-0.5">•</span>
                            <span>{diff}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Expandable Full Details */}
                  <Collapsible 
                    open={expandedWines.has(wine.id)}
                    onOpenChange={(open) => {
                      const newExpanded = new Set(expandedWines);
                      if (open) {
                        newExpanded.add(wine.id);
                      } else {
                        newExpanded.delete(wine.id);
                      }
                      setExpandedWines(newExpanded);
                    }}
                  >
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-between hover:bg-purple-50 dark:hover:bg-purple-950"
                      >
                        <span className="text-xs">View Full Details</span>
                        {expandedWines.has(wine.id) ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
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

                      {wine.tasting_notes && (
                        <div>
                          <h5 className="text-xs font-semibold mb-1">Full Tasting Notes</h5>
                          <p className="text-xs text-muted-foreground">
                            {wine.tasting_notes}
                          </p>
                        </div>
                      )}

                      {wine.food_pairing && (
                        <div>
                          <h5 className="text-xs font-semibold mb-1">Food Pairing</h5>
                          <p className="text-xs text-muted-foreground">
                            {wine.food_pairing}
                          </p>
                        </div>
                      )}

                      {wine.serving_temp && (
                        <div>
                          <h5 className="text-xs font-semibold mb-1">Serving Temperature</h5>
                          <p className="text-xs text-muted-foreground">
                            {wine.serving_temp}
                          </p>
                        </div>
                      )}

                      {wine.glass_price && (
                        <div>
                          <h5 className="text-xs font-semibold mb-1">Glass Price</h5>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(wine.glass_price)}
                          </p>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ))}
          </div>
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