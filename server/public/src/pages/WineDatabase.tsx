import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Wine, Search, Filter, ChevronLeft, ChevronRight, Database, Eye, Download, Wifi, WifiOff, Star, Award, Zap, BookOpen } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { WineDetailModal } from "../components/WineDetailModal";
import { useWineCache } from "../hooks/useWineCache";
import { WineData, WineSearchResponse, WineStats } from "@/types/wine";

const WineDatabase = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState("wine_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterType, setFilterType] = useState("all");
  
  // Modal and caching state
  const [selectedWine, setSelectedWine] = useState<WineData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Wine caching hook
  const { 
    getCachedWines, 
    cacheWines, 
    updateCachedWine, 
    getCacheStats, 
    cacheStatus 
  } = useWineCache();

  // Query for wine statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/sommelier/stats"],
    queryFn: async () => {
      const response = await fetch("/api/sommelier/stats", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch wine statistics");
      }
      return response.json();
    }
  });

  // Query for wines list with caching
  const { data: wineData, isLoading, refetch } = useQuery({
    queryKey: ["/api/sommelier/wines", currentPage, pageSize, sortBy, sortOrder, searchTerm, filterType],
    queryFn: async (): Promise<WineSearchResponse> => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
          sortBy,
          sortOrder,
          search: searchTerm,
          ...(filterType !== "all" && { type: filterType })
        });

        const response = await fetch(`/api/sommelier/wines?${params}`, {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch wines");
        }
        
        const data = await response.json();
        
        // Cache wines data for offline use
        if (data.wines && Array.isArray(data.wines)) {
          cacheWines(data.wines);
        }
        
        return data;
      } catch (error) {
        // Fallback to cached data if offline
        if (!navigator.onLine) {
          const cachedWines = getCachedWines();
          const stats = getCacheStats();
          
          toast({
            title: "Offline Mode",
            description: `Using cached data (${stats.total} wines)`
          });
          
          return {
            wines: cachedWines.slice((currentPage - 1) * pageSize, currentPage * pageSize),
            total: cachedWines.length,
            page: currentPage,
            pageSize,
            totalPages: Math.ceil(cachedWines.length / pageSize)
          };
        }
        throw error;
      }
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Handle wine detail modal
  const handleWineClick = (wine: WineData) => {
    setSelectedWine(wine);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWine(null);
  };

  // Handle cache download for offline use
  const handleCacheDownload = () => {
    const stats = getCacheStats();
    toast({
      title: "Cache Downloaded",
      description: `${stats.total} wines cached for offline use`
    });
  };

  // Offline status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Wine Database
          </h1>
          <p className="text-muted-foreground">
            Search and browse wines in the global database
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Wines</CardTitle>
              <Wine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWines}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Wines</CardTitle>
              <Badge variant="secondary" className="h-4 w-fit text-xs">
                Research
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedWines}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalWines > 0 ? Math.round((stats.verifiedWines / stats.totalWines) * 100) : 0}% verified
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restaurant Wines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRestaurantWines}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentUploads?.length || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Wines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by producer, wine name, region, or varietal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Wine Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="sparkling">Sparkling</SelectItem>
                  <SelectItem value="rosé">Rosé</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Wine Results</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/sommelier/gpt4o-fallback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ limit: 15 })
                    });
                    
                    if (response.ok) {
                      toast({
                        title: "Research Started",
                        description: "Validating wine authenticity with GPT-4o knowledge"
                      });
                      setTimeout(() => {
                        refetch();
                      }, 5000);
                    } else {
                      throw new Error('Failed to start research');
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to start research",
                      variant: "destructive"
                    });
                  }
                }}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <Database className="h-4 w-4 mr-2" />
                Research
                <span className="ml-1 text-xs">
                  ({stats ? Math.round((stats.verifiedWines / stats.totalWines) * 100) : 0}%)
                </span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/sommelier/research-enrich', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include'
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      toast({
                        title: "Enhanced Research Enrichment Started",
                        description: `Applying comprehensive depth to all verified wines`
                      });
                      setTimeout(() => {
                        refetch();
                      }, 10000);
                    } else {
                      throw new Error('Failed to start enhanced research enrichment');
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to start enhanced research enrichment",
                      variant: "destructive"
                    });
                  }
                }}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Star className="h-4 w-4 mr-2" />
                Research Enrich
                <span className="ml-1 text-xs">
                  (Enhance All)
                </span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/sommelier/complete-database-enhancement', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include'
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      toast({
                        title: "Complete Database Enhancement Started",
                        description: "Processing all 286 wines with research verification and comprehensive depth"
                      });
                      setTimeout(() => {
                        refetch();
                      }, 30000);
                    } else {
                      throw new Error('Failed to start complete database enhancement');
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to start complete database enhancement",
                      variant: "destructive"
                    });
                  }
                }}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
              >
                <Zap className="h-4 w-4 mr-2" />
                Complete Enhancement
                <span className="ml-1 text-xs">
                  (All {stats?.totalWines || 0} wines)
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/sommelier/educational-enrichment', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ rejectedWineIds: [284, 297, 298] })
                    });
                    
                    if (response.ok) {
                      toast({
                        title: "Theoretical Enrichment Started",
                        description: "Creating comprehensive theoretical wine profiles for rejected wines"
                      });
                      setTimeout(() => {
                        refetch();
                      }, 12000);
                    } else {
                      throw new Error('Failed to start theoretical enrichment');
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to start theoretical enrichment",
                      variant: "destructive"
                    });
                  }
                }}
                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
              >
                <Zap className="h-4 w-4 mr-2" />
                Theoretical Enrich
                <span className="ml-1 text-xs">
                  (3 rejected wines)
                </span>
              </Button>

              <span className="text-sm text-muted-foreground">
                {wineData ? `${wineData.total} wines found` : "Loading..."}
              </span>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading wines...</p>
            </div>
          ) : wineData && wineData.wines.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSortChange("producer")}
                    >
                      Producer {sortBy === "producer" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSortChange("wine_name")}
                    >
                      Wine Name {sortBy === "wine_name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSortChange("vintage")}
                    >
                      Vintage {sortBy === "vintage" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Varietal</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Tasting Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wineData.wines.map((wine) => (
                    <TableRow key={wine.id}>
                      <TableCell className="font-medium">{wine.producer || "—"}</TableCell>
                      <TableCell>
                        <button 
                          onClick={() => handleWineClick(wine)}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                        >
                          {wine.wine_name}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWineClick(wine)}
                          className="ml-2 h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                      <TableCell>{wine.vintage || "—"}</TableCell>
                      <TableCell>{Array.isArray(wine.varietals) ? wine.varietals.join(', ') : wine.varietals || "—"}</TableCell>
                      <TableCell>{wine.region || "—"}</TableCell>
                      <TableCell>
                        {wine.wine_type && (
                          <Badge variant="outline" className="capitalize">
                            {wine.wine_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {wine.verified ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {wine.wine_rating ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{wine.wine_rating}</span>
                            <span className="text-xs text-muted-foreground">★</span>
                            {wine.verified && wine.verified_source === 'GPT-4o Research' && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Research
                              </Badge>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {wine.tasting_notes ? (
                          <div className="text-sm text-muted-foreground truncate" title={wine.tasting_notes}>
                            {wine.tasting_notes.length > 80 
                              ? wine.tasting_notes.substring(0, 80) + '...' 
                              : wine.tasting_notes
                            }
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No tasting notes</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {wineData.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, wineData.total)} of {wineData.total} wines
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant={1 === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(1)}
                          >
                            1
                          </Button>
                          {currentPage > 4 && <span className="text-sm">...</span>}
                        </>
                      )}
                      
                      {/* Pages around current page */}
                      {Array.from({ length: Math.min(5, wineData.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(wineData.totalPages - 4, currentPage - 2)) + i;
                        if (pageNum <= wineData.totalPages) {
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                        return null;
                      })}
                      
                      {/* Last page */}
                      {currentPage < wineData.totalPages - 2 && (
                        <>
                          {currentPage < wineData.totalPages - 3 && <span className="text-sm">...</span>}
                          <Button
                            variant={wineData.totalPages === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(wineData.totalPages)}
                          >
                            {wineData.totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {/* Jump to page */}
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-muted-foreground">Go to:</span>
                      <Select value={currentPage.toString()} onValueChange={(value) => handlePageChange(parseInt(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: wineData.totalPages }, (_, i) => i + 1).map((page) => (
                            <SelectItem key={page} value={page.toString()}>
                              {page}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= wineData.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No wines found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "Upload some wine lists to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wine Detail Modal */}
      <WineDetailModal 
        wine={selectedWine}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default WineDatabase;