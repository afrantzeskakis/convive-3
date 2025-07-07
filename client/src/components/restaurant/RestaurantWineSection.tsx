import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wine, Search, Star, Utensils } from 'lucide-react';

interface Wine {
  id: number;
  wine_id: number;
  wine_name: string;
  producer: string;
  vintage?: number;
  region: string;
  wine_type: string;
  price?: number;
  by_the_glass: boolean;
  featured: boolean;
  tasting_notes?: string;
  wine_rating?: number;
}

interface RestaurantWineSectionProps {
  restaurantId: number;
  isUserView?: boolean;
}

export function RestaurantWineSection({ restaurantId, isUserView = false }: RestaurantWineSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Fetch restaurant wines
  const { data: wines = [], isLoading } = useQuery({
    queryKey: ['restaurant-wines', restaurantId, searchQuery, selectedType, selectedRegion],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedType) params.append('type', selectedType);
      if (selectedRegion) params.append('region', selectedRegion);
      
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
      default: return 'bg-gray-100 text-gray-800';
    }
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
      <div>
        <h2 className="text-2xl font-bold">Wine Collection</h2>
        <p className="text-muted-foreground">Explore our curated selection of wines</p>
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
                <SelectItem value="">All types</SelectItem>
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
                <SelectItem value="">All regions</SelectItem>
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
        <TabsList>
          <TabsTrigger value="all">All Wines ({wines.length})</TabsTrigger>
          <TabsTrigger value="featured">Featured ({featuredWines.length})</TabsTrigger>
          <TabsTrigger value="glass">By the Glass ({byTheGlassWines.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <WineGrid wines={wines} getWineTypeColor={getWineTypeColor} isUserView={isUserView} />
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <WineGrid wines={featuredWines} getWineTypeColor={getWineTypeColor} isUserView={isUserView} />
        </TabsContent>

        <TabsContent value="glass" className="space-y-4">
          <WineGrid wines={byTheGlassWines} getWineTypeColor={getWineTypeColor} isUserView={isUserView} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WineGrid({ wines, getWineTypeColor, isUserView }: { 
  wines: Wine[]; 
  getWineTypeColor: (type: string) => string;
  isUserView: boolean;
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
                  <p className="text-sm text-muted-foreground">
                    {wine.tasting_notes}
                  </p>
                )}
              </div>
              
              {/* Price and actions */}
              <div className="lg:col-span-4 flex items-center justify-between lg:justify-end">
                <div className="text-right">
                  {wine.price && (
                    <div className="text-lg font-semibold">
                      ${wine.price}
                    </div>
                  )}
                  {wine.by_the_glass && wine.price && (
                    <div className="text-sm text-muted-foreground">
                      Glass: ${Math.round(wine.price / 4)}
                    </div>
                  )}
                </div>
                
                {isUserView && (
                  <Button variant="outline" size="sm" className="ml-4">
                    <Utensils className="h-4 w-4 mr-2" />
                    Pair with Food
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}