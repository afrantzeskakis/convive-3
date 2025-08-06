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
import { 
  identifyTastingNotes, 
  findUniqueNotes, 
  formatNoteForDisplay, 
  sortNotesByPriority 
} from "@/lib/wine-tasting-notes";
import { HighlightableWineText } from "./HighlightableWineText";

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
  what_makes_special: string;
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

// Helper function to extract unique characteristics of each wine using the tasting notes guide
const extractUniqueCharacteristics = (wine: WineRecommendation, allWines: WineRecommendation[]): string[] => {
  const characteristics: string[] = [];
  
  // Parse tasting notes for all wines using the comprehensive guide
  const wineNotes = wine.tasting_notes ? identifyTastingNotes(wine.tasting_notes) : [];
  
  // Get notes from other wines
  const otherWines = allWines.filter(w => w.id !== wine.id);
  const otherWineNotes = otherWines.map(w => 
    w.tasting_notes ? identifyTastingNotes(w.tasting_notes) : []
  );
  
  // 1. Find unique tasting notes - notes that appear in this wine but not in others
  const uniqueNotes: string[] = [];
  for (const note of wineNotes) {
    const appearsInOthers = otherWineNotes.some(notes => notes.includes(note));
    if (!appearsInOthers) {
      uniqueNotes.push(note);
    }
  }
  
  // Sort unique notes by priority and format
  const sortedNotes = sortNotesByPriority(uniqueNotes);
  characteristics.push(...sortedNotes.slice(0, 4).map(note => formatNoteForDisplay(note)));
  
  // 2. Add intensity-based differences if needed
  if (characteristics.length < 4 && wine.tasting_notes) {
    const wineNotesLower = wine.tasting_notes.toLowerCase();
    
    // Check for shared notes with intensity differences
    const sharedNotesWithIntensity: string[] = [];
    for (const note of wineNotes) {
      const appearsInOthers = otherWineNotes.some(notes => notes.includes(note));
      if (appearsInOthers) {
        // Check if this wine has more intensity for this note
        const intensityModifiers = ['burst of', 'dominant', 'pronounced', 'intense', 'layers of', 'hint of', 'subtle', 'delicate'];
        for (const modifier of intensityModifiers) {
          if (wineNotesLower.includes(`${modifier} ${note}`)) {
            const othersHaveModifier = otherWines.some(w => 
              (w.tasting_notes?.toLowerCase() || '').includes(`${modifier} ${note}`)
            );
            if (!othersHaveModifier) {
              const formattedNote = modifier.charAt(0).toUpperCase() + modifier.slice(1) + ' ' + note;
              if (!characteristics.includes(formattedNote)) {
                sharedNotesWithIntensity.push(formattedNote);
              }
              break;
            }
          }
        }
      }
    }
    
    // Add intensity-based characteristics
    const remaining = 4 - characteristics.length;
    characteristics.push(...sharedNotesWithIntensity.slice(0, remaining));
  }
  
  // 3. Add region differences if unique and still need more
  if (characteristics.length < 4 && wine.region) {
    const regions = allWines.map(w => w.region).filter(r => r);
    const uniqueRegions = [...new Set(regions)];
    if (uniqueRegions.length > 1) {
      const othersHaveSameRegion = allWines.some(w => w.id !== wine.id && w.region === wine.region);
      if (!othersHaveSameRegion) {
        characteristics.push(`From ${wine.region}`);
      }
    }
  }
  
  // 4. Add grape variety differences if unique
  if (characteristics.length < 4 && wine.grape_variety) {
    const varieties = allWines.map(w => w.grape_variety).filter(v => v);
    const uniqueVarieties = [...new Set(varieties)];
    if (uniqueVarieties.length > 1) {
      const othersHaveSameVariety = allWines.some(w => w.id !== wine.id && w.grape_variety === wine.grape_variety);
      if (!othersHaveSameVariety) {
        characteristics.push(wine.grape_variety);
      }
    }
  }
  
  // 5. Add body/style descriptors from tasting notes
  if (characteristics.length < 4 && wine.tasting_notes) {
    const bodyDescriptors = ['full-bodied', 'medium-bodied', 'light-bodied', 'rich', 'elegant', 'crisp', 'smooth', 'bold', 'delicate', 'complex', 'layered', 'structured'];
    for (const descriptor of bodyDescriptors) {
      if (wine.tasting_notes.toLowerCase().includes(descriptor)) {
        const othersHaveDescriptor = otherWines.some(w => 
          (w.tasting_notes?.toLowerCase() || '').includes(descriptor)
        );
        if (!othersHaveDescriptor && !characteristics.includes(descriptor.charAt(0).toUpperCase() + descriptor.slice(1))) {
          characteristics.push(descriptor.charAt(0).toUpperCase() + descriptor.slice(1));
          if (characteristics.length >= 4) break;
        }
      }
    }
  }
  
  // 6. Add more tasting characteristics from wine description
  if (characteristics.length < 4 && wine.tasting_notes) {
    // Look for texture descriptors
    const textureDescriptors = ['silky', 'velvety', 'creamy', 'chalky', 'tannic', 'grippy', 'supple', 'round', 'angular'];
    for (const descriptor of textureDescriptors) {
      if (wine.tasting_notes.toLowerCase().includes(descriptor)) {
        const othersHaveDescriptor = otherWines.some(w => 
          (w.tasting_notes?.toLowerCase() || '').includes(descriptor)
        );
        if (!othersHaveDescriptor && !characteristics.includes(descriptor.charAt(0).toUpperCase() + descriptor.slice(1))) {
          characteristics.push(descriptor.charAt(0).toUpperCase() + descriptor.slice(1));
          if (characteristics.length >= 4) break;
        }
      }
    }
  }
  
  // 7. Add finish/aftertaste characteristics if unique
  if (characteristics.length < 4 && wine.tasting_notes) {
    const finishDescriptors = ['long finish', 'short finish', 'lingering', 'persistent', 'clean finish', 'dry finish'];
    for (const descriptor of finishDescriptors) {
      if (wine.tasting_notes.toLowerCase().includes(descriptor)) {
        const othersHaveDescriptor = otherWines.some(w => 
          (w.tasting_notes?.toLowerCase() || '').includes(descriptor)
        );
        if (!othersHaveDescriptor) {
          characteristics.push(descriptor.charAt(0).toUpperCase() + descriptor.slice(1));
          if (characteristics.length >= 4) break;
        }
      }
    }
  }
  
  // 8. Add more specific wine style descriptors
  if (characteristics.length < 4) {
    const styleDescriptors: string[] = [];
    
    // Add wine type as a distinguisher if types differ
    const types = allWines.map(w => w.type?.toLowerCase()).filter(t => t);
    const uniqueTypes = [...new Set(types)];
    if (uniqueTypes.length > 1 && wine.type) {
      if (wine.type.toLowerCase().includes('red')) {
        styleDescriptors.push('Red wine style');
      } else if (wine.type.toLowerCase().includes('white')) {
        styleDescriptors.push('White wine style');
      } else if (wine.type.toLowerCase().includes('rosé')) {
        styleDescriptors.push('Rosé style');
      } else if (wine.type.toLowerCase().includes('sparkling')) {
        styleDescriptors.push('Sparkling style');
      } else if (wine.type.toLowerCase().includes('champagne')) {
        styleDescriptors.push('Champagne method');
      }
    }
    
    // Add producer style if unique
    if (wine.producer && characteristics.length < 4) {
      const producers = allWines.map(w => w.producer).filter(p => p);
      const uniqueProducers = [...new Set(producers)];
      if (uniqueProducers.length > 1) {
        const othersHaveSameProducer = allWines.some(w => w.id !== wine.id && w.producer === wine.producer);
        if (!othersHaveSameProducer) {
          styleDescriptors.push(`${wine.producer} house style`);
        }
      }
    }
    
    characteristics.push(...styleDescriptors.slice(0, 4 - characteristics.length));
  }
  
  // 9. Look for acidity/sweetness level differences
  if (characteristics.length < 4 && wine.tasting_notes) {
    const acidityDescriptors = ['high acidity', 'bright acidity', 'crisp acidity', 'balanced acidity', 'low acidity', 'fresh acidity'];
    const sweetnessDescriptors = ['bone dry', 'dry', 'off-dry', 'semi-sweet', 'sweet', 'lusciously sweet'];
    
    const allDescriptors = [...acidityDescriptors, ...sweetnessDescriptors];
    for (const descriptor of allDescriptors) {
      if (wine.tasting_notes.toLowerCase().includes(descriptor)) {
        const othersHaveDescriptor = otherWines.some(w => 
          (w.tasting_notes?.toLowerCase() || '').includes(descriptor)
        );
        if (!othersHaveDescriptor) {
          characteristics.push(descriptor.charAt(0).toUpperCase() + descriptor.slice(1));
          if (characteristics.length >= 4) break;
        }
      }
    }
  }
  
  // STRICT ENFORCEMENT: Always return between 3-4 differences
  // Never include vintage, serving temperature, or food pairing as differences
  if (characteristics.length < 3) {
    // Emergency fallback - add wine-specific distinguishing features
    const fallbacks: string[] = [];
    
    // Try to add more specific wine characteristics
    if (wine.type) {
      fallbacks.push(`${wine.type} character`);
    }
    if (wine.country && !characteristics.some(c => c.includes(wine.country))) {
      fallbacks.push(`${wine.country} style`);
    }
    if (fallbacks.length === 0) {
      fallbacks.push('Distinctive profile', 'Unique character', 'Special selection');
    }
    
    while (characteristics.length < 3 && fallbacks.length > 0) {
      const fallback = fallbacks.shift()!;
      if (!characteristics.includes(fallback)) {
        characteristics.push(fallback);
      }
    }
  }
  
  // Return exactly 3-4 characteristics (minimum 3, maximum 4)
  return characteristics.slice(0, 4).length >= 3 ? characteristics.slice(0, 4) : characteristics.slice(0, 3);
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
                    <HighlightableWineText 
                      text={createWineSummary(wine)}
                      className="text-sm text-muted-foreground leading-relaxed"
                      showInstructions={index === 0}
                    />
                  </div>

                  {/* Unique Characteristics */}
                  <div className="border-t pt-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Key Differences
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
                            <HighlightableWineText text={char} className="inline" />
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
                      {/* What Makes This Wine Special - First Section */}
                      {wine.what_makes_special && (
                        <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                          <h5 className="text-xs font-semibold mb-2 text-purple-900 dark:text-purple-100">
                            What Makes This Wine Special
                          </h5>
                          <HighlightableWineText 
                            text={wine.what_makes_special}
                            className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed"
                          />
                        </div>
                      )}
                      
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
                          <HighlightableWineText 
                            text={wine.tasting_notes}
                            className="text-xs text-muted-foreground"
                          />
                        </div>
                      )}

                      {wine.food_pairing && (
                        <div>
                          <h5 className="text-xs font-semibold mb-1">Food Pairing</h5>
                          <HighlightableWineText 
                            text={wine.food_pairing}
                            className="text-xs text-muted-foreground"
                          />
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