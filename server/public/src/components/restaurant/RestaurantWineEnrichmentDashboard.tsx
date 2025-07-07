import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wine,
  Upload,
  Search,
  Sparkles,
  Star,
  FileText,
  Database,
  RefreshCcw,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import { BatchEnrichmentButton } from './BatchEnrichmentButton';

interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisineType: string;
  address: string;
}

interface WineStats {
  total: number;
  enriched: number;
  premium: number;
  completionPercentage: number;
}

interface Wine {
  id: number;
  restaurant_id: number;
  restaurantId: number;
  wine_name: string;
  producer: string;
  vintage: string;
  region: string;
  country?: string;
  varietals?: string;
  wine_type: string;
  verified?: boolean;
  verified_source?: string;
  enrichment_status: 'pending' | 'processing' | 'completed' | 'failed';
  enrichment_started_at?: string | null;
  enrichment_completed_at?: string | null;
  wine_rating?: string;
  general_guest_experience?: string;
  tasting_notes?: string;
  flavor_notes?: string;
  aroma_notes?: string;
  what_makes_special?: string;
  body_description?: string;
  food_pairing?: string;
  serving_temp?: string;
  aging_potential?: string;
  menu_price?: string;
  cost_price?: string;
  inventory_count?: number;
  wine_list_category?: string;
  created_at: string;
  updated_at: string;
}

interface RestaurantWineEnrichmentDashboardProps {
  selectedRestaurant?: Restaurant;
}

export function RestaurantWineEnrichmentDashboard({ selectedRestaurant }: RestaurantWineEnrichmentDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [restaurantFilter, setRestaurantFilter] = useState<number | 'all'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all restaurants for selection
  const { data: restaurants = [] } = useQuery({
    queryKey: ['/api/restaurants'],
    retry: false,
  });

  // Allow restaurant selection
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number>(1);

  // Fetch wine statistics
  const { data: wineStats, isLoading: statsLoading } = useQuery<WineStats>({
    queryKey: ['/api/restaurant-wines/stats', selectedRestaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurant-wines/stats?restaurantId=${selectedRestaurantId}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    retry: false,
  });

  // Fetch wine list with search and filter parameters
  const { data: wines = [], isLoading: winesLoading, refetch: refetchWines } = useQuery<Wine[]>({
    queryKey: ['/api/restaurant-wines/wines', selectedRestaurantId, searchTerm, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        restaurantId: selectedRestaurantId.toString(),
        limit: '100'
      });
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      const response = await fetch(`/api/restaurant-wines/wines?${params}`);
      if (!response.ok) throw new Error('Failed to fetch wines');
      return response.json();
    },
    retry: false,
  });

  // No additional filtering needed - backend handles it all
  const filteredWines = wines;

  // Upload wine list mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; restaurantId: number }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('restaurantId', data.restaurantId.toString());
      
      const response = await fetch('/api/restaurant-wines/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Success', 
        description: `Successfully uploaded ${data.winesUploaded} wines` 
      });
      setUploadFile(null);
      refetchWines();
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-wines/stats', selectedRestaurantId] });
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-wines/wines', selectedRestaurantId] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Upload failed', 
        description: error.message || 'Failed to upload wine list',
        variant: 'destructive' 
      });
    },
  });

  // Enrich wine mutation
  const enrichMutation = useMutation({
    mutationFn: async (wineId: number) => {
      const response = await fetch(`/api/restaurant-wines/enrich/${wineId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Enrichment failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Wine enrichment started successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-wines/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-wines/stats'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Enrichment failed', 
        description: error.message || 'Failed to start wine enrichment',
        variant: 'destructive' 
      });
    },
  });

  // Bulk enrich mutation
  const bulkEnrichMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/restaurant-wines/enrich-all', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Bulk enrichment failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Bulk enrichment started successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-wines/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-wines/stats'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Bulk enrichment failed', 
        description: error.message || 'Failed to start bulk enrichment',
        variant: 'destructive' 
      });
    },
  });

  const handleUpload = () => {
    if (!uploadFile) {
      toast({ title: 'Error', description: 'Please select a file to upload', variant: 'destructive' });
      return;
    }

    if (!selectedRestaurantId) {
      toast({ title: 'Error', description: 'Please select a restaurant', variant: 'destructive' });
      return;
    }

    uploadMutation.mutate({ file: uploadFile, restaurantId: selectedRestaurantId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Wine Enrichment System</h2>
          <p className="text-muted-foreground">
            Upload wine lists and leverage AI to generate comprehensive premium wine profiles
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          5-Stage AI Enhancement
        </Badge>
      </div>

      {/* Restaurant Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Selection</CardTitle>
          <CardDescription>Select restaurant to view wine enrichment data</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedRestaurantId.toString()} onValueChange={(value) => setSelectedRestaurantId(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Restaurant 1 (483 wines)</SelectItem>
              <SelectItem value="7">Restaurant 7 (20 wines - Recent Upload)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wines</CardTitle>
            <Wine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '...' : wineStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">wines in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Enriched</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '...' : wineStats?.enriched || 0}</div>
            <p className="text-xs text-muted-foreground">with AI profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Status</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '...' : wineStats?.premium || 0}</div>
            <p className="text-xs text-muted-foreground">premium wines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '...' : wineStats?.completionPercentage || 0}%</div>
            <Progress value={wineStats?.completionPercentage || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload & Enrich
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Wine Database
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Wine List
              </CardTitle>
              <CardDescription>
                Upload your wine list in multiple formats (CSV, TXT, Word, PDF). The system automatically extracts wine information and enriches each wine with comprehensive AI-generated profiles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurant-select">Select Restaurant</Label>
                <Select 
                  value={restaurantFilter.toString()} 
                  onValueChange={(value) => setRestaurantFilter(value === 'all' ? 'all' : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a restaurant..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Restaurants</SelectItem>
                    {(restaurants as Restaurant[]).map((restaurant: Restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wine-file">Wine List File</Label>
                <Input
                  id="wine-file"
                  type="file"
                  accept=".csv,.txt,.docx,.doc,.pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: CSV, TXT, DOCX, DOC, PDF with intelligent parsing
                </p>
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={uploadMutation.isPending || !uploadFile || restaurantFilter === 'all'}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Uploading & Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Start AI Enrichment
                  </>
                )}
              </Button>

              {restaurantFilter === 'all' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select a specific restaurant to upload wine lists.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* AI Enrichment Process Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                5-Stage AI Enrichment Process
              </CardTitle>
              <CardDescription>
                Each wine undergoes comprehensive AI analysis across five specialized stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                {[
                  { stage: 'Historical Research', icon: Globe, desc: 'Producer heritage & terroir analysis' },
                  { stage: 'Tasting Profile', icon: Wine, desc: 'Aromatic & flavor characteristics' },
                  { stage: 'Prestige Analysis', icon: Award, desc: 'Premium positioning & exclusivity' },
                  { stage: 'Food Pairing', icon: FileText, desc: 'Culinary compatibility mapping' },
                  { stage: 'Service Specs', icon: Star, desc: 'Professional service guidelines' }
                ].map((item, index) => (
                  <div key={index} className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-medium text-sm">{item.stage}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wine Database Tab */}
        <TabsContent value="manage" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search wines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedRestaurant && (
              <BatchEnrichmentButton 
                restaurantId={selectedRestaurant.id}
                onEnrichmentStart={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/restaurant-wines/stats'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/restaurant-wines/list'] });
                }}
              />
            )}
          </div>

          <div className="grid gap-4">
            {winesLoading ? (
              <div className="text-center py-8">
                <RefreshCcw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading wines...</p>
              </div>
            ) : filteredWines.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Wine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No wines found</h3>
                  <p className="text-sm text-muted-foreground">
                    {wines.length === 0 ? 'Upload a wine list to get started.' : 'Try adjusting your search filters.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredWines.map((wine) => (
                <Card key={wine.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{wine.wine_name}</h3>
                          <Badge className={`${getStatusColor(wine.enrichment_status)} border-0`}>
                            {getStatusIcon(wine.enrichment_status)}
                            <span className="ml-1 capitalize">{wine.enrichment_status}</span>
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><strong>Producer:</strong> {wine.producer}</p>
                          <p><strong>Vintage:</strong> {wine.vintage} | <strong>Region:</strong> {wine.region}</p>
                          <p><strong>Type:</strong> {wine.wine_type}</p>
                          {wine.what_makes_special && (
                            <p className="text-xs italic mt-2 line-clamp-2">{wine.what_makes_special.substring(0, 120)}...</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {wine.enrichment_status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => enrichMutation.mutate(wine.id)}
                            disabled={enrichMutation.isPending}
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            Enrich
                          </Button>
                        )}
                        {wine.enrichment_status === 'completed' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedWine(wine)}>
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Wine className="w-5 h-5" />
                                  {wine.wine_name}
                                </DialogTitle>
                                <DialogDescription>
                                  AI-enhanced premium wine profile
                                </DialogDescription>
                              </DialogHeader>
                              {selectedWine && (
                                <div className="space-y-6">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                      <h4 className="font-medium mb-2">Wine Details</h4>
                                      <div className="space-y-1 text-sm">
                                        <p><strong>Producer:</strong> {selectedWine.producer}</p>
                                        <p><strong>Vintage:</strong> {selectedWine.vintage}</p>
                                        <p><strong>Region:</strong> {selectedWine.region}</p>
                                        <p><strong>Country:</strong> {selectedWine.country}</p>
                                        <p><strong>Type:</strong> {selectedWine.wine_type}</p>
                                        {selectedWine.varietals && (
                                          <p><strong>Varietals:</strong> {selectedWine.varietals}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Restaurant Information</h4>
                                      <div className="space-y-1 text-sm">
                                        {selectedWine.wine_list_category && (
                                          <p><strong>Category:</strong> {selectedWine.wine_list_category}</p>
                                        )}
                                        {selectedWine.inventory_count !== undefined && (
                                          <p><strong>Inventory:</strong> {selectedWine.inventory_count} bottles</p>
                                        )}
                                        <p><strong>Status:</strong> 
                                          <Badge className={`ml-2 ${getStatusColor(selectedWine.enrichment_status)} border-0`}>
                                            {selectedWine.enrichment_status}
                                          </Badge>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    {selectedWine.wine_rating && (
                                      <div>
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                          <Star className="w-4 h-4" />
                                          Wine Rating
                                        </h4>
                                        <div className="rounded border p-3 text-sm">
                                          <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-yellow-600">{selectedWine.wine_rating}</span>
                                            <span className="text-muted-foreground">/ 5.0</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {selectedWine.general_guest_experience && (
                                      <div>
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                          <Star className="w-4 h-4" />
                                          General Guest Experience
                                        </h4>
                                        <ScrollArea className="h-32 rounded border p-3 text-sm">
                                          {selectedWine.general_guest_experience}
                                        </ScrollArea>
                                      </div>
                                    )}

                                    {selectedWine.what_makes_special && (
                                      <div>
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                          <Award className="w-4 h-4" />
                                          What Makes This Wine Special
                                        </h4>
                                        <ScrollArea className="h-32 rounded border p-3 text-sm">
                                          {selectedWine.what_makes_special}
                                        </ScrollArea>
                                      </div>
                                    )}
                                    
                                    {selectedWine.tasting_notes && (
                                      <div>
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                          <Wine className="w-4 h-4" />
                                          Tasting Notes
                                        </h4>
                                        <ScrollArea className="h-32 rounded border p-3 text-sm">
                                          {selectedWine.tasting_notes}
                                        </ScrollArea>
                                      </div>
                                    )}
                                    
                                    {selectedWine.aroma_notes && (
                                      <div>
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                          <Globe className="w-4 h-4" />
                                          Aroma Profile
                                        </h4>
                                        <ScrollArea className="h-32 rounded border p-3 text-sm">
                                          {selectedWine.aroma_notes}
                                        </ScrollArea>
                                      </div>
                                    )}
                                    
                                    {selectedWine.flavor_notes && (
                                      <div>
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                          <FileText className="w-4 h-4" />
                                          Flavor Profile
                                        </h4>
                                        <ScrollArea className="h-32 rounded border p-3 text-sm">
                                          {selectedWine.flavor_notes}
                                        </ScrollArea>
                                      </div>
                                    )}
                                    
                                    {selectedWine.food_pairing && (
                                      <div>
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                          <FileText className="w-4 h-4" />
                                          Food Pairing
                                        </h4>
                                        <ScrollArea className="h-32 rounded border p-3 text-sm">
                                          {selectedWine.food_pairing}
                                        </ScrollArea>
                                      </div>
                                    )}

                                    {selectedWine.body_description && (
                                      <div>
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                          <Wine className="w-4 h-4" />
                                          Body & Structure
                                        </h4>
                                        <ScrollArea className="h-32 rounded border p-3 text-sm">
                                          {selectedWine.body_description}
                                        </ScrollArea>
                                      </div>
                                    )}

                                    {selectedWine.serving_temp && (
                                      <div>
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                          <Star className="w-4 h-4" />
                                          Service Information
                                        </h4>
                                        <div className="rounded border p-3 text-sm space-y-2">
                                          <p><strong>Serving Temperature:</strong> {selectedWine.serving_temp}</p>
                                          {selectedWine.aging_potential && (
                                            <p><strong>Aging Potential:</strong> {selectedWine.aging_potential}</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Enrichment Progress</CardTitle>
                <CardDescription>Track AI enrichment completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Completion</span>
                    <span className="font-bold">{wineStats?.completionPercentage || 0}%</span>
                  </div>
                  <Progress value={wineStats?.completionPercentage || 0} />
                  
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total wines</span>
                      <span>{wineStats?.total || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>AI enriched</span>
                      <span>{wineStats?.enriched || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Premium status</span>
                      <span>{wineStats?.premium || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>AI enrichment system metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">System Status</span>
                    </div>
                    <Badge variant="secondary" className="text-green-600">Operational</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">AI Model</span>
                    </div>
                    <Badge variant="secondary">GPT-4o</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Database</span>
                    </div>
                    <Badge variant="secondary">Isolated</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Enhancement Stages</span>
                    </div>
                    <Badge variant="secondary">5-Stage</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}