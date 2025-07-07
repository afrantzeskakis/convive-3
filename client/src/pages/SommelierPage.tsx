import { useState, useRef, useEffect } from "react";

import { Wine, Upload, Search, FileText, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function SommelierPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string>("text");
  const [mainTab, setMainTab] = useState<string>("process");
  const [wineListText, setWineListText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wineList, setWineList] = useState<any[]>([]);
  const [selectedWine, setSelectedWine] = useState<any | null>(null);
  const [enrichedWine, setEnrichedWine] = useState<any | null>(null);
  const [customerPreferences, setCustomerPreferences] = useState<string>("");
  const [recommendations, setRecommendations] = useState<string>("");
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [serviceStatus, setServiceStatus] = useState<{available: boolean, message: string} | null>(null);
  
  // For database management
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Function to handle wine search
  const handleSearch = async () => {
    if (searchQuery.trim().length < 3) {
      toast({
        title: "Search Query Too Short",
        description: "Please enter at least 3 characters to search.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // For now, we'll implement a basic search by fetching all wines
      // and filtering client-side
      const response = await fetch("/api/sommelier/all-wines");
      const data = await response.json();
      
      if (data.wines && Array.isArray(data.wines)) {
        // Filter wines by name, producer, or region that contains the search query
        const filteredWines = data.wines.filter((wine: any) => {
          const searchTerms = [
            wine.name?.value || "",
            wine.producer?.value || "",
            wine.region?.value || "",
            wine.country?.value || ""
          ].map(term => typeof term === 'string' ? term.toLowerCase() : "");
          
          return searchTerms.some(term => term.includes(searchQuery.toLowerCase()));
        });
        
        setSearchResults(filteredWines);
        
        toast({
          title: `Found ${filteredWines.length} wines`,
          description: `Matching wines for "${searchQuery}"`,
        });
      } else {
        setSearchResults([]);
        toast({
          title: "No Wines Found",
          description: "The wine database is empty or there was an issue with the search.",
        });
      }
    } catch (error) {
      console.error("Error searching wines:", error);
      toast({
        title: "Search Error",
        description: "Failed to search wine database",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to view wine details
  const handleViewWine = (wine: any) => {
    setSelectedWine(wine);
    handleEnrichWine(wine);
  };
  
  // Check if the sommelier service is available
  async function checkStatus() {
    setIsCheckingStatus(true);
    try {
      const response = await fetch('/api/sommelier/status');
      const data = await response.json();
      setServiceStatus(data);
      
      if (!data.available) {
        toast({
          title: "Service Unavailable",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking service status:', error);
      setServiceStatus({
        available: false,
        message: "Error connecting to sommelier service"
      });
      
      toast({
        title: "Connection Error",
        description: "Could not connect to the sommelier service",
        variant: "destructive"
      });
    } finally {
      setIsCheckingStatus(false);
    }
  }

  // Store the uploaded file
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Handle wine list file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name);
    
    // Store the file for direct upload
    setUploadedFile(file);

    // Also read the text content for preview or text-based processing
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setWineListText(event.target.result as string);
      }
    };
    reader.readAsText(file);
    
    // Reset the file input so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  // Process the wine list
  const handleProcessWineList = async () => {
    // Check if we have content to process
    if (!wineListText.trim() && !uploadedFile) {
      toast({
        title: "Empty Wine List",
        description: "Please enter a wine list or upload a file.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setWineList([]);
    setSelectedWine(null);
    setEnrichedWine(null);
    setRecommendations("");

    try {
      let response;
      
      // If there's a file uploaded, use FormData for multipart/form-data submission
      if (uploadedFile) {
        const formData = new FormData();
        // Make sure the field name matches exactly what the server expects in the multer config
        formData.append('wineListFile', uploadedFile);
        formData.append('addToDatabase', 'true'); // Add to database without restaurant association
        
        console.log('Uploading file:', uploadedFile.name, 'Size:', uploadedFile.size);
        
        response = await fetch('/api/sommelier/ingest-wine-list', {
          method: 'POST',
          // Don't set Content-Type header - it will be set automatically with the boundary
          body: formData
        });
      } else {
        // Otherwise use JSON for text submission
        response = await fetch('/api/sommelier/ingest-wine-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            wineListText,
            addToDatabase: true // This indicates wines should be stored without restaurant association
          })
        });
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to process wine list");
      }
      
      setWineList(data.wines);
      
      toast({
        title: "Wine List Processed",
        description: `Successfully extracted ${data.wines.length} wines${data.storedInDatabase ? ' and added to database' : ''}.`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error processing wine list:', error);
      
      toast({
        title: "Processing Error",
        description: error.message || "An error occurred while processing the wine list",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enrich a selected wine with detailed information
  const handleEnrichWine = async (wine: any) => {
    setSelectedWine(wine);
    setEnrichedWine(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/sommelier/enrich-wine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wine })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to enrich wine");
      }
      
      setEnrichedWine(data.wine);
    } catch (error: any) {
      console.error('Error enriching wine:', error);
      
      toast({
        title: "Enrichment Error",
        description: error.message || "An error occurred while enriching the wine information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get wine recommendations based on customer preferences
  const handleGetRecommendations = async () => {
    if (!customerPreferences.trim()) {
      toast({
        title: "Empty Preferences",
        description: "Please enter customer preferences.",
        variant: "destructive"
      });
      return;
    }

    if (!enrichedWine && (!wineList || wineList.length === 0)) {
      toast({
        title: "No Wines Available",
        description: "Please process a wine list first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setRecommendations("");

    try {
      // Use either the enriched wine or all wines from the wine list
      const wines = enrichedWine ? [enrichedWine] : wineList;
      
      const response = await fetch('/api/sommelier/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wines,
          preferences: customerPreferences
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to get recommendations");
      }
      
      setRecommendations(data.formatted_output);
      
      toast({
        title: "Recommendations Ready",
        description: "Wine recommendations generated successfully.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      
      toast({
        title: "Recommendation Error",
        description: error.message || "An error occurred while generating recommendations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear the current state and start over
  const handleReset = () => {
    setWineListText("");
    setWineList([]);
    setSelectedWine(null);
    setEnrichedWine(null);
    setCustomerPreferences("");
    setRecommendations("");
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Check service status on component mount
  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="container mx-auto py-8">

      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Sommelier Tool</h1>
          <p className="text-muted-foreground">
            Process wine lists, analyze wines, and generate personalized recommendations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={checkStatus}
            disabled={isCheckingStatus}
            className="flex items-center"
          >
            {isCheckingStatus ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wine className="mr-2 h-4 w-4" />
            )}
            Check Service Status
          </Button>
        </div>
      </div>
      
      {serviceStatus && (
        <div className={cn(
          "p-4 mb-6 border rounded-md",
          serviceStatus.available ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "w-3 h-3 rounded-full mr-3",
              serviceStatus.available ? "bg-green-500" : "bg-red-500"
            )} />
            <div>
              <h3 className="font-medium">
                Service Status: {serviceStatus.available ? "Available" : "Unavailable"}
              </h3>
              <p className="text-sm text-muted-foreground">{serviceStatus.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="process" className="flex-1">
            <Wine className="w-4 h-4 mr-2" />
            Process Wine Lists
          </TabsTrigger>
          <TabsTrigger value="recommend" className="flex-1">
            <Search className="w-4 h-4 mr-2" />
            Wine Recommendations
          </TabsTrigger>
          <TabsTrigger value="database" className="flex-1">
            <FileText className="w-4 h-4 mr-2" />
            Wine Database
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-8", mainTab !== "process" && "hidden")}>
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Wine List Processing</h2>
              <Badge variant="outline" className="ml-2">Database Wine List</Badge>
            </div>
            <p className="text-muted-foreground mb-4">
              This tool allows you to upload wine lists to build a baseline database without attaching to any specific restaurant.
              All wines processed here will be stored for testing and future recommendations.
            </p>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="text" className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Enter Text
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="mt-4">
                <Label htmlFor="wine-list">Paste Wine List</Label>
                <Textarea
                  id="wine-list"
                  placeholder="Paste the wine list here..."
                  value={wineListText}
                  onChange={(e) => setWineListText(e.target.value)}
                  className="min-h-[200px] mt-2"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setWineListText(`
Wine List

RED WINES
Château Margaux 2015, Bordeaux, France - $425
Opus One 2018, Napa Valley, USA - $315
Tignanello 2019, Tuscany, Italy - $210
Penfolds Grange 2017, South Australia - $850

WHITE WINES
Puligny-Montrachet 2020, Burgundy, France - $195
Cloudy Bay Sauvignon Blanc 2022, Marlborough, New Zealand - $85
Kistler Chardonnay 2020, Sonoma Coast, USA - $160

SPARKLING WINES
Dom Pérignon 2012, Champagne, France - $350
Schramsberg Blanc de Blancs 2019, Napa Valley, USA - $125
                      `);
                    }}
                  >
                    Load Sample Wine List
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="upload" className="mt-4">
                <Label htmlFor="wine-list-file">Upload Wine List File</Label>
                <div className="mt-2">
                  <div className="flex items-center gap-4">
                    <Input
                      id="wine-list-file"
                      type="file"
                      accept=".txt,.csv,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const fileInput = document.getElementById('wine-list-file') as HTMLInputElement;
                        if (fileInput) fileInput.click();
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Browse Files
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported formats: TXT, CSV, PDF, DOC, DOCX (max 10MB)
                  </p>
                  {uploadedFile && (
                    <div className="mt-4 bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        {uploadedFile.name}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </span>
                      </p>
                      <p className="text-xs text-green-600 mt-1">File ready for processing</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex mt-6 space-x-2">
              <Button
                onClick={handleProcessWineList}
                disabled={isLoading || (!wineListText.trim() && !uploadedFile)}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Process Wine List
              </Button>
              
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </Card>
          
          {wineList.length > 0 && (
            <Card className="p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Extracted Wines</h2>
              <div className="overflow-y-auto max-h-[400px] pr-2">
                {wineList.map((wine, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 mb-2 rounded-md cursor-pointer hover:bg-primary/5 transition-colors",
                      selectedWine === wine ? "bg-primary/10 border-l-4 border-primary" : "border"
                    )}
                    onClick={() => handleEnrichWine(wine)}
                  >
                    <h3 className="font-medium">{wine.name}</h3>
                    <div className="text-sm flex flex-wrap gap-x-4 text-muted-foreground">
                      {wine.vintage && <span>Vintage: {wine.vintage}</span>}
                      {wine.restaurant_price && <span>Price: {wine.restaurant_price}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {selectedWine && (
            <Card className="p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Customer Preferences</h2>
              <Label htmlFor="preferences">Enter Customer Preferences</Label>
              <Textarea
                id="preferences"
                placeholder="e.g., 'Looking for a full-bodied red wine that pairs well with ribeye steak, preferably under $100'"
                value={customerPreferences}
                onChange={(e) => setCustomerPreferences(e.target.value)}
                className="min-h-[100px] mt-2"
              />
              
              <div className="grid grid-cols-1 gap-2 mt-3">
                <div className="text-sm text-muted-foreground">Quick preference templates:</div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCustomerPreferences("I'm looking for a full-bodied red wine that pairs well with a ribeye steak. I prefer something with dark fruit flavors and a hint of oak. My budget is around $150.")}
                  >
                    Full-bodied Red
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCustomerPreferences("I'd like a crisp, refreshing white wine to pair with grilled seafood. I enjoy citrus notes and minerality. Looking to spend under $100.")}
                  >
                    Crisp White
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCustomerPreferences("Could you recommend a celebratory champagne or sparkling wine? It's for a special occasion and I'm willing to spend up to $300.")}
                  >
                    Celebration Sparkling
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleGetRecommendations}
                disabled={isLoading || !customerPreferences.trim()}
                className="mt-4 w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wine className="mr-2 h-4 w-4" />
                )}
                Generate Recommendations
              </Button>
            </Card>
          )}
        </div>
        
        <div>
          {enrichedWine && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Wine Details</h2>
              
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium">
                    {enrichedWine.name.value} {enrichedWine.vintage?.value}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 text-muted-foreground">
                    <span>{enrichedWine.region?.value}, {enrichedWine.country?.value}</span>
                    {enrichedWine.restaurant_price?.value && (
                      <span className="font-medium text-primary">{enrichedWine.restaurant_price.value}</span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm uppercase tracking-wider text-muted-foreground">Wine Details</h4>
                      <div className="mt-3 space-y-2">
                        {enrichedWine.varietals && (
                          <div className="flex justify-between">
                            <span className="font-medium">Varietals</span>
                            <span className="text-right">{Array.isArray(enrichedWine.varietals.value) 
                              ? enrichedWine.varietals.value.join(', ') 
                              : enrichedWine.varietals.value}</span>
                          </div>
                        )}
                        
                        {enrichedWine.producer && (
                          <div className="flex justify-between">
                            <span className="font-medium">Producer</span>
                            <span className="text-right">{enrichedWine.producer.value}</span>
                          </div>
                        )}

                        {enrichedWine.vintage && (
                          <div className="flex justify-between">
                            <span className="font-medium">Vintage</span>
                            <span className="text-right">{enrichedWine.vintage.value}</span>
                          </div>
                        )}
                        
                        {enrichedWine.alcohol_percent && (
                          <div className="flex justify-between">
                            <span className="font-medium">Alcohol</span>
                            <span className="text-right">{enrichedWine.alcohol_percent.value}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(enrichedWine.food_pairings || enrichedWine.serving_temp_celsius) && (
                      <div>
                        <h4 className="text-sm uppercase tracking-wider text-muted-foreground">Service Recommendations</h4>
                        <div className="mt-3 space-y-2">
                          {enrichedWine.food_pairings && (
                            <div>
                              <span className="font-medium">Food Pairings</span>
                              <p className="mt-1">{enrichedWine.food_pairings.value}</p>
                            </div>
                          )}
                          
                          {enrichedWine.serving_temp_celsius && (
                            <div>
                              <span className="font-medium">Serving Temperature</span>
                              <p className="mt-1">{enrichedWine.serving_temp_celsius.value}°C</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm uppercase tracking-wider text-muted-foreground">Tasting Profile</h4>
                      <div className="mt-3 space-y-3">
                        {enrichedWine.body && (
                          <div>
                            <div className="flex justify-between">
                              <span className="font-medium">Body</span>
                              <span>{enrichedWine.body.value}</span>
                            </div>
                            <div className="mt-1 h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ 
                                  width: `${typeof enrichedWine.body.value === 'string' 
                                    ? (enrichedWine.body.value.toLowerCase().includes('full') ? 100 : 
                                       enrichedWine.body.value.toLowerCase().includes('medium') ? 60 : 30) 
                                    : 50}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        {enrichedWine.acidity && (
                          <div>
                            <div className="flex justify-between">
                              <span className="font-medium">Acidity</span>
                              <span>{enrichedWine.acidity.value}</span>
                            </div>
                            <div className="mt-1 h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ 
                                  width: `${typeof enrichedWine.acidity.value === 'string' 
                                    ? (enrichedWine.acidity.value.toLowerCase().includes('high') ? 100 : 
                                       enrichedWine.acidity.value.toLowerCase().includes('medium') ? 60 : 30) 
                                    : 50}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        {enrichedWine.tannin && (
                          <div>
                            <div className="flex justify-between">
                              <span className="font-medium">Tannin</span>
                              <span>{enrichedWine.tannin.value}</span>
                            </div>
                            <div className="mt-1 h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ 
                                  width: `${typeof enrichedWine.tannin.value === 'string' 
                                    ? (enrichedWine.tannin.value.toLowerCase().includes('high') ? 100 : 
                                       enrichedWine.tannin.value.toLowerCase().includes('medium') ? 60 : 30) 
                                    : 50}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {enrichedWine.flavors_normalized && (
                      <div>
                        <h4 className="text-sm uppercase tracking-wider text-muted-foreground">Flavor Profile</h4>
                        <p className="mt-3">{enrichedWine.flavors_normalized.value}</p>
                      </div>
                    )}
                    
                    {enrichedWine.style_summary && (
                      <div>
                        <h4 className="text-sm uppercase tracking-wider text-muted-foreground">Style</h4>
                        <p className="mt-3">{enrichedWine.style_summary.value}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {recommendations && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
              <div className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm">
                {recommendations}
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* Wine Recommendations Tab */}
      <div className={cn("space-y-6", mainTab !== "recommend" && "hidden")}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Wine Recommendations</h2>
            <Badge variant="outline">Live Service Mode</Badge>
          </div>
          <p className="text-muted-foreground mb-6">
            Get instant wine recommendations for guests based on their preferences and your restaurant's inventory.
          </p>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="guest-description">Guest Description</Label>
              <Textarea
                id="guest-description"
                placeholder="Enter guest's wine preferences (e.g., 'Looking for a bold red wine to pair with steak, enjoys full-bodied wines with good tannins')"
                value={customerPreferences}
                onChange={(e) => setCustomerPreferences(e.target.value)}
                className="min-h-[100px] mt-2"
              />
            </div>
            
            <Button 
              onClick={async () => {
                if (!customerPreferences.trim()) {
                  toast({
                    title: "Missing Information",
                    description: "Please enter the guest's wine preferences.",
                    variant: "destructive"
                  });
                  return;
                }
                
                setIsLoading(true);
                try {
                  // Use existing sommelier API for wine recommendations
                  const response = await fetch('/api/sommelier/recommend-wines', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      guest_description: customerPreferences,
                      restaurant_id: 1 // Default for testing
                    })
                  });
                  
                  const data = await response.json();
                  if (data.success) {
                    setRecommendations(JSON.stringify(data.recommendations, null, 2));
                  } else {
                    throw new Error(data.error || 'Failed to get recommendations');
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to generate wine recommendations. Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <Wine className="w-4 h-4 mr-2" />
                  Get Wine Recommendations
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}