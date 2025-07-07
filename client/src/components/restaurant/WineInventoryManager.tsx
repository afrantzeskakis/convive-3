import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Wine, Upload, FileText, Filter } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Wine {
  id: number;
  wine_id: number;
  wine_name: string;
  producer: string;
  vintage?: number;
  region: string;
  country: string;
  wine_type: string;
  wine_style?: string;
  price?: number;
  by_the_glass: boolean;
  featured: boolean;
  active: boolean;
  inventory_count: number;
  tasting_notes?: string;
  what_makes_special?: string;
  wine_rating?: number;
  food_pairing?: string;
}

interface WineInventoryManagerProps {
  restaurantId: number;
}

export function WineInventoryManager({ restaurantId }: WineInventoryManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showAddWineDialog, setShowAddWineDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch upload history
  const { data: uploads = [] } = useQuery({
    queryKey: ['wine-uploads', restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/wines/uploads`);
      if (!response.ok) throw new Error('Failed to fetch uploads');
      return response.json();
    }
  });

  // Update wine mutation
  const updateWineMutation = useMutation({
    mutationFn: async ({ wineId, updates }: { wineId: number; updates: Partial<Wine> }) => {
      const response = await fetch(`/api/restaurants/${restaurantId}/wines/${wineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update wine');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-wines', restaurantId] });
      toast({ title: 'Wine updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update wine', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Remove wine mutation
  const removeWineMutation = useMutation({
    mutationFn: async (wineId: number) => {
      const response = await fetch(`/api/restaurants/${restaurantId}/wines/${wineId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove wine');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-wines', restaurantId] });
      toast({ title: 'Wine removed from inventory' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to remove wine', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Upload wine list mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('wineList', file);
      
      const response = await fetch(`/api/restaurants/${restaurantId}/wines/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-wines', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['wine-uploads', restaurantId] });
      toast({ title: 'Wine list uploaded successfully' });
      setShowUploadDialog(false);
    },
    onError: (error) => {
      toast({ 
        title: 'Upload failed', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleWineUpdate = (wine: Wine, field: string, value: any) => {
    updateWineMutation.mutate({
      wineId: wine.wine_id,
      updates: { [field]: value }
    });
  };

  const getWineTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'red': return 'bg-red-100 text-red-800';
      case 'white': return 'bg-yellow-100 text-yellow-800';
      case 'rosé': case 'rose': return 'bg-pink-100 text-pink-800';
      case 'sparkling': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Wine Inventory</h2>
          <p className="text-muted-foreground">Manage your restaurant's wine collection</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Wine List</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with your wine list. The system will match wines to our global database.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="wine-file">Select wine list file (CSV)</Label>
                  <Input
                    id="wine-file"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    disabled={uploadMutation.isPending}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Format: producer, wine_name, vintage, price (one wine per line)
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
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
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedRegion('all');
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wine inventory */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Wine Inventory ({wines.length})</TabsTrigger>
          <TabsTrigger value="uploads">Upload History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading wines...</div>
          ) : wines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No wines found. Upload a wine list to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {wines.map((wine: Wine) => (
                <Card key={wine.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                      {/* Wine details */}
                      <div className="lg:col-span-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <Wine className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">{wine.producer} {wine.wine_name}</h3>
                          {wine.vintage && (
                            <Badge variant="outline">{wine.vintage}</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getWineTypeColor(wine.wine_type)}>
                            {wine.wine_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {wine.region}, {wine.country}
                          </span>
                        </div>
                        
                        {wine.tasting_notes && (
                          <p className="text-sm text-muted-foreground">
                            {wine.tasting_notes}
                          </p>
                        )}
                      </div>
                      
                      {/* Pricing and availability */}
                      <div className="lg:col-span-3 space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor={`price-${wine.id}`}>Price</Label>
                          <Input
                            id={`price-${wine.id}`}
                            type="number"
                            value={wine.price || ''}
                            onChange={(e) => handleWineUpdate(wine, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Price"
                            className="h-8"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`inventory-${wine.id}`}>Inventory</Label>
                          <Input
                            id={`inventory-${wine.id}`}
                            type="number"
                            value={wine.inventory_count || 0}
                            onChange={(e) => handleWineUpdate(wine, 'inventory_count', parseInt(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      {/* Settings and actions */}
                      <div className="lg:col-span-3 space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`glass-${wine.id}`}>By the glass</Label>
                            <Switch
                              id={`glass-${wine.id}`}
                              checked={wine.by_the_glass}
                              onCheckedChange={(checked) => handleWineUpdate(wine, 'by_the_glass', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`featured-${wine.id}`}>Featured</Label>
                            <Switch
                              id={`featured-${wine.id}`}
                              checked={wine.featured}
                              onCheckedChange={(checked) => handleWineUpdate(wine, 'featured', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`active-${wine.id}`}>Active</Label>
                            <Switch
                              id={`active-${wine.id}`}
                              checked={wine.active}
                              onCheckedChange={(checked) => handleWineUpdate(wine, 'active', checked)}
                            />
                          </div>
                        </div>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeWineMutation.mutate(wine.wine_id)}
                          disabled={removeWineMutation.isPending}
                          className="w-full"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="uploads" className="space-y-4">
          {uploads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upload history yet.
            </div>
          ) : (
            <div className="space-y-4">
              {uploads.map((upload: any) => (
                <Card key={upload.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{upload.original_filename}</span>
                          <Badge 
                            variant={upload.upload_status === 'completed' ? 'default' : 
                                   upload.upload_status === 'failed' ? 'destructive' : 'secondary'}
                          >
                            {upload.upload_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(upload.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {upload.upload_status === 'completed' && (
                        <div className="text-right text-sm">
                          <div>Total: {upload.total_wines_in_file}</div>
                          <div>Matched: {upload.wines_matched}</div>
                          <div>Added: {upload.wines_added}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}