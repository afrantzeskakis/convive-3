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

// Helper function to extract unique characteristics of each wine
const extractUniqueCharacteristics = (wine: WineRecommendation, allWines: WineRecommendation[]): string[] => {
  const characteristics: string[] = [];
  
  if (!wine.tasting_notes) return characteristics;
  
  const wineNotes = wine.tasting_notes.toLowerCase();
  // Get notes from all other wines
  const otherWinesNotes = allWines
    .filter(w => w.id !== wine.id)
    .map(w => w.tasting_notes?.toLowerCase() || '');
  
  // Helper to check if a trait is unique to this wine
  const isUnique = (trait: string): boolean => {
    return !otherWinesNotes.some(notes => notes.includes(trait));
  };
  
  // Helper to check intensity differences
  const checkIntensityDifference = (trait: string): string | null => {
    const intensityModifiers = [
      'touch of', 'hint of', 'notes of', 'nuances of', 'layers of',
      'subtle', 'pronounced', 'dominant', 'whisper of', 'burst of'
    ];
    
    // Check if this wine has the trait with a modifier
    let thisWineIntensity = null;
    for (const modifier of intensityModifiers) {
      if (wineNotes.includes(`${modifier} ${trait}`)) {
        thisWineIntensity = modifier;
        break;
      }
    }
    
    // Check if this wine has trait without modifier
    if (!thisWineIntensity && wineNotes.includes(trait)) {
      thisWineIntensity = 'full';
    }
    
    if (!thisWineIntensity) return null;
    
    // Check other wines for same trait with different intensity
    let othersHaveTrait = false;
    let othersHaveLessIntensity = true;
    
    for (const otherNotes of otherWinesNotes) {
      if (otherNotes.includes(trait)) {
        othersHaveTrait = true;
        // Check if others have it with less intensity
        if (otherNotes.includes(`touch of ${trait}`) || otherNotes.includes(`hint of ${trait}`)) {
          // Others have less intensity
        } else if (thisWineIntensity === 'touch of' || thisWineIntensity === 'hint of') {
          othersHaveLessIntensity = false;
        }
      }
    }
    
    if (othersHaveTrait && thisWineIntensity === 'full' && othersHaveLessIntensity) {
      return `More ${trait}`;
    } else if (othersHaveTrait && (thisWineIntensity === 'touch of' || thisWineIntensity === 'hint of')) {
      return `Subtle ${trait}`;
    }
    
    return null;
  };
  
  // Check for intensity differences in common traits
  const commonTraits = ['citrus', 'citrus zest', 'oak', 'vanilla', 'spice', 'tannins'];
  for (const trait of commonTraits) {
    const intensityDiff = checkIntensityDifference(trait);
    if (intensityDiff && characteristics.length < 3) {
      characteristics.push(intensityDiff);
    }
  }
  
  // Check for unique flavors
  const flavorKeywords = {
    'hazelnut': ['hazelnut', 'nutty', 'toasted nuts'],
    'honey': ['honey', 'honeyed'],
    'spice': ['spice', 'spicy', 'nuances of spice'],
    'brioche': ['brioche', 'bread', 'yeast'],
    'chocolate': ['chocolate', 'cocoa'],
    'coffee': ['coffee', 'espresso'],
    'tobacco': ['tobacco', 'smoke'],
    'leather': ['leather'],
    'mineral': ['mineral', 'minerality'],
    'floral': ['floral', 'flowers']
  };
  
  for (const [flavor, variations] of Object.entries(flavorKeywords)) {
    if (characteristics.length >= 3) break;
    
    const hasThisFlavor = variations.some(v => wineNotes.includes(v));
    const othersHaveFlavor = otherWinesNotes.some(notes => 
      variations.some(v => notes.includes(v))
    );
    
    if (hasThisFlavor && !othersHaveFlavor) {
      characteristics.push(`Notes of ${flavor}`);
    }
  }
  
  // Check for unique texture/mouthfeel
  const textureKeywords = {
    'Luxurious mousse': ['luxurious mousse', 'rich mousse'],
    'Silky texture': ['silky mouth feel', 'silky mouthfeel', 'silky texture'],
    'Creamy texture': ['creamy texture', 'creamy mouthfeel'],
    'Crisp finish': ['crisp finish', 'crisp acidity'],
    'Velvety texture': ['velvety texture', 'velvety mouthfeel']
  };
  
  for (const [texture, variations] of Object.entries(textureKeywords)) {
    if (characteristics.length >= 3) break;
    
    const hasThisTexture = variations.some(v => wineNotes.includes(v));
    if (hasThisTexture && isUnique(variations[0])) {
      characteristics.push(texture);
    }
  }
  
  // Check for unique fruit notes
  const fruitKeywords = ['cherry', 'blackberry', 'raspberry', 'plum', 'apple', 'pear', 
                        'peach', 'apricot', 'tropical', 'pineapple'];
  
  for (const fruit of fruitKeywords) {
    if (characteristics.length >= 3) break;
    
    if (wineNotes.includes(fruit) && isUnique(fruit)) {
      characteristics.push(`${fruit.charAt(0).toUpperCase() + fruit.slice(1)} notes`);
    }
  }
  
  // Add vintage year if unique among the selections
  const vintages = allWines.map(w => w.vintage).filter(v => v);
  const uniqueVintages = [...new Set(vintages)];
  if (uniqueVintages.length > 1 && characteristics.length < 3) {
    characteristics.push(`${wine.vintage} vintage`);
  }
  
  return characteristics.slice(0, 3);
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

                  {/* Unique Characteristics */}
                  <div className="border-t pt-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      What Makes It Special
                    </h4>
                    <ul className="space-y-1">
                      {(() => {
                        const characteristics = extractUniqueCharacteristics(wine, recommendations);
                        // If no unique characteristics found, show general traits
                        if (characteristics.length === 0) {
                          return (
                            <li className="text-xs text-muted-foreground italic">
                              Classic {wine.type || 'wine'} profile
                            </li>
                          );
                        }
                        return characteristics.map((char, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-purple-500 mt-0.5">•</span>
                            <span>{char}</span>
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>

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