/**
 * Wine Detail Modal Component
 * 
 * Displays comprehensive wine information in a safe, accessible modal
 * with offline caching support
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, MapPin, Calendar, Grape, Award, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WineData } from "@/types/wine";

interface WineDetailModalProps {
  wine: WineData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WineDetailModal({ wine, isOpen, onClose }: WineDetailModalProps) {
  if (!wine) return null;



  const formatRating = (rating: string | null) => {
    if (!rating) return null;
    const numRating = parseFloat(rating);
    return isNaN(numRating) ? null : numRating.toFixed(1);
  };

  const formattedRating = formatRating(wine.vivino_rating);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {wine.wine_name} {wine.vintage}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {wine.producer}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Badges Section */}
            <div className="flex flex-wrap gap-2">
              {wine.verified && (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                  <Award className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              
              {wine.verified_source === 'Vivino' && formattedRating && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Rating: {formattedRating}
                </Badge>
              )}
              
              {wine.wine_type && (
                <Badge variant="outline">
                  {wine.wine_type}
                </Badge>
              )}
            </div>

            {/* Wine Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Region</p>
                    <p className="text-sm text-muted-foreground">
                      {wine.region}, {wine.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Vintage</p>
                    <p className="text-sm text-muted-foreground">{wine.vintage}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Grape className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Varietals</p>
                    <p className="text-sm text-muted-foreground">{wine.varietals}</p>
                  </div>
                </div>

                {formattedRating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-muted-foreground fill-current" />
                    <div>
                      <p className="text-sm font-medium">Rating</p>
                      <p className="text-sm text-muted-foreground">{formattedRating}/5.0</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Verified Tasting Profile */}
            {wine.tasting_notes && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Tasting Profile
                  {wine.verified_source === 'Vivino' && (
                    <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                      Verified Data
                    </Badge>
                  )}
                </h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">{wine.tasting_notes}</p>
                </div>
              </div>
            )}

            {/* Wine Characteristics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Flavor & Aroma Profile */}
              <div className="space-y-4">
                {wine.flavor_notes && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Flavor Profile</h4>
                    <p className="text-sm text-muted-foreground">{wine.flavor_notes}</p>
                  </div>
                )}
                
                {wine.aroma_notes && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Aroma Characteristics</h4>
                    <p className="text-sm text-muted-foreground">{wine.aroma_notes}</p>
                  </div>
                )}
              </div>

              {/* Wine Structure */}
              <div className="space-y-4">
                {wine.body_description && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Body</h4>
                    <p className="text-sm text-muted-foreground capitalize">{wine.body_description}</p>
                  </div>
                )}
                
                {wine.blend_description && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Composition</h4>
                    <p className="text-sm text-muted-foreground">{wine.blend_description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* What Makes This Wine Special - Positioned between aroma and food pairings */}
            {wine.what_makes_special && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  What Makes This Wine Special
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">{wine.what_makes_special}</p>
              </div>
            )}

            {/* Technical Characteristics Grid */}
            <div className="space-y-4">
              <div className="space-y-4">
                
                <div className="grid grid-cols-2 gap-3">
                  {wine.acidity && (
                    <div>
                      <h5 className="text-xs font-medium">Acidity</h5>
                      <p className="text-xs text-muted-foreground capitalize">{wine.acidity}</p>
                    </div>
                  )}
                  
                  {wine.tannin_level && (
                    <div>
                      <h5 className="text-xs font-medium">Tannins</h5>
                      <p className="text-xs text-muted-foreground capitalize">{wine.tannin_level}</p>
                    </div>
                  )}
                  
                  {wine.finish_length && (
                    <div>
                      <h5 className="text-xs font-medium">Finish</h5>
                      <p className="text-xs text-muted-foreground capitalize">{wine.finish_length}</p>
                    </div>
                  )}
                  
                  {wine.oak_influence && (
                    <div>
                      <h5 className="text-xs font-medium">Oak</h5>
                      <p className="text-xs text-muted-foreground capitalize">{wine.oak_influence}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Food Pairing & Service */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wine.food_pairing && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Food Pairings & Flavor Interactions</h4>
                  <div className="bg-green-50 p-3 rounded-lg space-y-2">
                    <p className="text-sm text-green-800 font-medium">Recommended Pairings:</p>
                    <p className="text-sm text-green-800">{wine.food_pairing}</p>
                    
                    {(wine.flavor_notes || wine.aroma_notes || wine.tannin_level || wine.acidity) && (
                      <div className="mt-3 pt-2 border-t border-green-200">
                        <p className="text-xs text-green-700 font-medium mb-1">Why These Pairings Work:</p>
                        <div className="text-xs text-green-700 space-y-1">
                          {wine.acidity && (
                            <p>• <span className="font-medium">Acidity ({wine.acidity})</span> cuts through rich fats and oils, cleansing the palate</p>
                          )}
                          {wine.tannin_level && (
                            <p>• <span className="font-medium">Tannins ({wine.tannin_level})</span> complement protein textures and contrast with fatty elements</p>
                          )}
                          {wine.flavor_notes && wine.flavor_notes.toLowerCase().includes('fruit') && (
                            <p>• <span className="font-medium">Fruit notes</span> provide complementary sweetness to balance savory and spiced dishes</p>
                          )}
                          {wine.flavor_notes && (wine.flavor_notes.toLowerCase().includes('herb') || wine.flavor_notes.toLowerCase().includes('spice')) && (
                            <p>• <span className="font-medium">Herbal/spice elements</span> echo and enhance similar flavors in seasoned dishes</p>
                          )}
                          {wine.flavor_notes && (wine.flavor_notes.toLowerCase().includes('oak') || wine.flavor_notes.toLowerCase().includes('vanilla')) && (
                            <p>• <span className="font-medium">Oak influence</span> complements smoky, grilled, and roasted preparations</p>
                          )}
                          {wine.body_description && wine.body_description.toLowerCase().includes('full') && (
                            <p>• <span className="font-medium">Full body</span> matches the intensity of rich, hearty dishes without being overwhelmed</p>
                          )}
                          {wine.body_description && (wine.body_description.toLowerCase().includes('light') || wine.body_description.toLowerCase().includes('medium')) && (
                            <p>• <span className="font-medium">Lighter body</span> allows delicate food flavors to shine while providing subtle enhancement</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {wine.serving_temp && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Serving Temperature</h4>
                    <p className="text-sm text-muted-foreground">{wine.serving_temp}</p>
                  </div>
                )}
                
                {wine.aging_potential && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Aging Potential</h4>
                    <p className="text-sm text-muted-foreground">{wine.aging_potential}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Database Reference Information */}
            {wine.vivino_id && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Wine Database Reference</p>
                <p className="text-sm text-blue-700">ID: {wine.vivino_id}</p>
                {wine.vivino_rating && (
                  <p className="text-sm text-blue-700 mt-1">
                    Professional Rating: {wine.vivino_rating}/5.0
                  </p>
                )}
              </div>
            )}

            {/* Additional Information */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Added to database: {new Date(wine.created_at).toLocaleDateString()}
              </p>
              {wine.verified && wine.verified_source && (
                <p className="text-xs text-muted-foreground">
                  Verified with external wine database
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}