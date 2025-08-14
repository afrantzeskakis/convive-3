import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wine, Search, Star, Utensils, Sparkles, Eye, Globe, Award, Calendar, Thermometer } from 'lucide-react';
import { Link } from 'wouter';

interface Wine {
  id: number;
  wine_id?: number;
  wine_name: string;
  producer: string;
  vintage?: number | string;
  region: string;
  country?: string;
  wine_type: string;
  price?: number | string;
  menu_price?: string;
  by_the_glass?: boolean;
  featured?: boolean;
  tasting_notes?: string;
  wine_rating?: number | string;
  general_guest_experience?: string;
  flavor_notes?: string;
  aroma_notes?: string;
  what_makes_special?: string;
  body_description?: string;
  food_pairing?: string;
  serving_temp?: string;
  aging_potential?: string;
  wine_list_category?: string;
  inventory_count?: number;
  verified?: boolean;
  verified_source?: string;
  varietals?: string;
  enrichment_status?: string;
  created_at?: string;
  updated_at?: string;
}

interface RestaurantWineSectionProps {
  restaurantId: number;
  isUserView?: boolean;
}

export function RestaurantWineSection({ restaurantId, isUserView = false }: RestaurantWineSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [showWineDetails, setShowWineDetails] = useState(false);

  // Fetch restaurant wines
  const { data: wines = [], isLoading } = useQuery({
    queryKey: ['restaurant-wines', restaurantId, searchQuery, selectedType, selectedRegion],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedType && selectedType !== 'all') params.append('type', selectedType);
      if (selectedRegion && selectedRegion !== 'all') params.append('region', selectedRegion);
      
      const response = await fetch(`/api/restaurants/${restaurantId}/wines/search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch wines');
      return response.json();
    }
  });

  const getWineTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'red': return 'bg-red-100 text-red-800';
      case 'white': return 'bg-yellow-100 text-yellow-800';
      case 'rosé': case 'rose': return 'bg-pink-100 text-pink-800';
      case 'sparkling': return 'bg-blue-100 text-blue-800';
      case 'dessert': return 'bg-amber-100 text-amber-800';
      case 'fortified': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewWineDetails = (wine: Wine) => {
    setSelectedWine(wine);
    setShowWineDetails(true);
  };

  const featuredWines = wines.filter((wine: Wine) => wine.featured);
  const byTheGlassWines = wines.filter((wine: Wine) => wine.by_the_glass);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Wine className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p>Loading wine collection...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Wine Collection</h2>
          <p className="text-muted-foreground">Explore our curated selection of wines</p>
        </div>
        {!isUserView && (
          <Link href="/wine-concierge">
            <Button variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Wine Concierge
            </Button>
          </Link>
        )}
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Wine type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="rosé">Rosé</SelectItem>
                <SelectItem value="sparkling">Sparkling</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                <SelectItem value="bordeaux">Bordeaux</SelectItem>
                <SelectItem value="burgundy">Burgundy</SelectItem>
                <SelectItem value="tuscany">Tuscany</SelectItem>
                <SelectItem value="napa">Napa Valley</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="w-full flex flex-wrap gap-1">
          <TabsTrigger value="all" className="flex-1 min-w-[120px]">All Wines ({wines.length})</TabsTrigger>
          <TabsTrigger value="featured" className="flex-1 min-w-[120px]">Featured ({featuredWines.length})</TabsTrigger>
          <TabsTrigger value="glass" className="flex-1 min-w-[120px]">By the Glass ({byTheGlassWines.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <WineGrid wines={wines} getWineTypeColor={getWineTypeColor} isUserView={isUserView} onViewDetails={handleViewWineDetails} />
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <WineGrid wines={featuredWines} getWineTypeColor={getWineTypeColor} isUserView={isUserView} onViewDetails={handleViewWineDetails} />
        </TabsContent>

        <TabsContent value="glass" className="space-y-4">
          <WineGrid wines={byTheGlassWines} getWineTypeColor={getWineTypeColor} isUserView={isUserView} onViewDetails={handleViewWineDetails} />
        </TabsContent>
      </Tabs>

      {/* Wine Details Dialog */}
      <Dialog open={showWineDetails} onOpenChange={setShowWineDetails}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wine className="w-5 h-5" />
              {selectedWine?.wine_name}
            </DialogTitle>
            <DialogDescription>
              {selectedWine?.producer} • {selectedWine?.vintage}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            {selectedWine && (
              <div className="space-y-6">
                {/* Basic Wine Information */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Wine className="h-4 w-4" />
                      Wine Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Producer:</span> {selectedWine.producer}</p>
                      <p><span className="font-medium">Vintage:</span> {selectedWine.vintage || 'NV'}</p>
                      <p><span className="font-medium">Region:</span> {selectedWine.region}</p>
                      {selectedWine.country && (
                        <p><span className="font-medium">Country:</span> {selectedWine.country}</p>
                      )}
                      <p><span className="font-medium">Type:</span> {selectedWine.wine_type}</p>
                      {selectedWine.varietals && (
                        <p><span className="font-medium">Varietals:</span> {selectedWine.varietals}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Service Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedWine.menu_price && (
                        <p><span className="font-medium">Price:</span> ${selectedWine.menu_price}</p>
                      )}
                      {selectedWine.wine_rating && (
                        <p><span className="font-medium">Rating:</span> {selectedWine.wine_rating}/5 ⭐</p>
                      )}
                      {selectedWine.serving_temp && (
                        <p><span className="font-medium">Serving Temperature:</span> {selectedWine.serving_temp}</p>
                      )}
                      {selectedWine.aging_potential && (
                        <p><span className="font-medium">Aging Potential:</span> {selectedWine.aging_potential}</p>
                      )}
                      {selectedWine.wine_list_category && (
                        <p><span className="font-medium">Category:</span> {selectedWine.wine_list_category}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Guest Experience */}
                {selectedWine.general_guest_experience && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Guest Experience
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedWine.general_guest_experience}
                    </p>
                  </div>
                )}

                {/* What Makes It Special */}
                {selectedWine.what_makes_special && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      What Makes It Special
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedWine.what_makes_special}
                    </p>
                  </div>
                )}

                {/* Tasting Profile */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Wine className="h-4 w-4" />
                    Tasting Profile
                  </h4>
                  
                  {selectedWine.tasting_notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Tasting Notes</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedWine.tasting_notes}
                      </p>
                    </div>
                  )}
                  
                  {selectedWine.aroma_notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Aroma</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedWine.aroma_notes}
                      </p>
                    </div>
                  )}
                  
                  {selectedWine.flavor_notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Flavor Profile</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedWine.flavor_notes}
                      </p>
                    </div>
                  )}
                  
                  {selectedWine.body_description && (
                    <div>
                      <p className="text-sm font-medium mb-1">Body & Structure</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedWine.body_description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Food Pairing */}
                {selectedWine.food_pairing && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      Food Pairing Recommendations
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedWine.food_pairing}
                    </p>
                  </div>
                )}

                {/* Verification Status */}
                {selectedWine.verified && (
                  <div className="pt-4 border-t">
                    <Badge variant="outline" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      Verified via {selectedWine.verified_source || 'External Source'}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WineGrid({ wines, getWineTypeColor, isUserView, onViewDetails }: { 
  wines: Wine[]; 
  getWineTypeColor: (type: string) => string;
  isUserView: boolean;
  onViewDetails: (wine: Wine) => void;
}) {
  if (wines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Wine className="mx-auto h-8 w-8 mb-2" />
        <p>No wines found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {wines.map((wine: Wine) => (
        <Card key={wine.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Wine details */}
              <div className="lg:col-span-8 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Wine className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{wine.producer} {wine.wine_name}</h3>
                  {wine.vintage && (
                    <Badge variant="outline">{wine.vintage}</Badge>
                  )}
                  {wine.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {wine.by_the_glass && (
                    <Badge variant="secondary">By the Glass</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getWineTypeColor(wine.wine_type)}>
                    {wine.wine_type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {wine.region}
                  </span>
                  {wine.wine_rating && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                      {wine.wine_rating}/5
                    </div>
                  )}
                </div>
                
                {wine.tasting_notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {wine.tasting_notes}
                  </p>
                )}
                
                {wine.what_makes_special && (
                  <p className="text-xs text-muted-foreground italic line-clamp-2">
                    {wine.what_makes_special}
                  </p>
                )}
              </div>
              
              {/* Price and actions */}
              <div className="lg:col-span-4 flex flex-col items-end gap-2">
                {(wine.menu_price || wine.price) && (
                  <div className="text-lg font-semibold">
                    ${wine.menu_price || wine.price}
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(wine)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}