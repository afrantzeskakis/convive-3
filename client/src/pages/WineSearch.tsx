import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, ExternalLink, Star, MapPin, Calendar, Grape } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Wine {
  id: number;
  wine_name: string;
  producer: string;
  vintage: number;
  region: string;
  country: string;
  verified: boolean;
  verified_source: string;
  vivino_rating: string;
  wine_type: string;
  tasting_notes: string;
  vivino_url: string;
  vivino_id: string;
  created_at: string;
}

export default function WineSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/sommelier/search', searchQuery, verifiedOnly],
    enabled: searchQuery.length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams({
        q: searchQuery,
        verified_only: verifiedOnly.toString()
      });
      const response = await fetch(`/api/sommelier/search?${params}`);
      if (!response.ok) throw new Error('Failed to search wines');
      return response.json();
    }
  });

  const { data: wineDetails } = useQuery({
    queryKey: ['/api/sommelier/wine', selectedWine?.id],
    enabled: !!selectedWine,
    queryFn: async () => {
      const response = await fetch(`/api/sommelier/wine/${selectedWine!.id}`);
      if (!response.ok) throw new Error('Failed to get wine details');
      return response.json();
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Wine Database Search</h1>
        <p className="text-muted-foreground">
          Search wines with authentic Vivino data verification
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Wines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by wine name, producer, region, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="verified-only"
                checked={verifiedOnly}
                onCheckedChange={setVerifiedOnly}
              />
              <Label htmlFor="verified-only">Verified only</Label>
            </div>
          </div>

          {searchQuery.length >= 2 && (
            <div className="space-y-4">
              {isLoading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Searching wines...</p>
                </div>
              )}

              {searchResults?.wines && searchResults.wines.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.total} wines
                  </p>
                  <div className="grid gap-3">
                    {searchResults.wines.map((wine: Wine) => (
                      <Card 
                        key={wine.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedWine?.id === wine.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedWine(wine)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">
                                  {wine.wine_name} {wine.vintage && `(${wine.vintage})`}
                                </h3>
                                {wine.verified && (
                                  <Badge variant="secondary" className="text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {wine.producer}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {wine.region && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {wine.region}, {wine.country}
                                  </div>
                                )}
                                {wine.wine_type && (
                                  <div className="flex items-center gap-1">
                                    <Grape className="h-3 w-3" />
                                    {wine.wine_type}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              {wine.vivino_rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">{wine.vivino_rating}</span>
                                </div>
                              )}
                              {wine.vivino_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://${wine.vivino_url}`, '_blank');
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {searchResults && searchResults.wines.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No wines found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedWine && wineDetails?.wine && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grape className="h-5 w-5" />
              Wine Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {wineDetails.wine.wine_name}
                  </h3>
                  <p className="text-muted-foreground">{wineDetails.wine.producer}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {wineDetails.wine.vintage && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Vintage</Label>
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {wineDetails.wine.vintage}
                      </p>
                    </div>
                  )}
                  {wineDetails.wine.wine_type && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <p>{wineDetails.wine.wine_type}</p>
                    </div>
                  )}
                  {wineDetails.wine.region && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Region</Label>
                      <p>{wineDetails.wine.region}</p>
                    </div>
                  )}
                  {wineDetails.wine.country && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Country</Label>
                      <p>{wineDetails.wine.country}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {wineDetails.wine.verified && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Verification Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Verified via {wineDetails.wine.verified_source}
                      </Badge>
                      {wineDetails.wine.vivino_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{wineDetails.wine.vivino_rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {wineDetails.wine.vivino_url && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Vivino Link</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${wineDetails.wine.vivino_url}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Vivino
                    </Button>
                  </div>
                )}

                {wineDetails.wine.vivino_id && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Vivino ID</Label>
                    <p className="text-sm font-mono">{wineDetails.wine.vivino_id}</p>
                  </div>
                )}
              </div>
            </div>

            {wineDetails.wine.tasting_notes && 
             wineDetails.wine.tasting_notes !== '[object Object]' && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Tasting Notes</Label>
                  <p className="text-sm mt-1">{wineDetails.wine.tasting_notes}</p>
                </div>
              </>
            )}

            <Separator />
            <div className="text-xs text-muted-foreground">
              Added to database: {new Date(wineDetails.wine.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}