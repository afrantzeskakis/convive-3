import React, { useState, useRef } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { Loader2, ChefHat, Wine, Phone, Upload, UploadCloud, FileText, Info, List, CheckCircle, AlignJustify, HelpCircle, Sparkles, Search, Database } from "lucide-react";

export function AITestPage() {
  const { toast } = useToast();
  
  // API Status 
  const [statusMessage, setStatusMessage] = useState('');
  
  // Recipe Analysis
  const [recipeText, setRecipeText] = useState('');
  const [recipeFile, setRecipeFile] = useState<File | null>(null);
  const recipeFileRef = useRef<HTMLInputElement>(null);
  const [recipeAnalysisResult, setRecipeAnalysisResult] = useState<any>(null);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  
  // Wine Analysis
  const [wineText, setWineText] = useState('');
  const [wineFile, setWineFile] = useState<File | null>(null);
  const wineFileRef = useRef<HTMLInputElement>(null);
  const [wineAnalysisResult, setWineAnalysisResult] = useState<any>(null);
  const [isWineLoading, setIsWineLoading] = useState(false);
  const [selectedWine, setSelectedWine] = useState<string>('');
  const [wineDetailResult, setWineDetailResult] = useState<any>(null);
  const [isWineDetailLoading, setIsWineDetailLoading] = useState(false);
  
  // Wine Database
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isDatabaseLoading, setIsDatabaseLoading] = useState(false);
  const [wineToView, setWineToView] = useState<any>(null);
  const [activeWineTab, setActiveWineTab] = useState<string>('analysis');
  
  // Call AI
  const [callScript, setCallScript] = useState<string>('');
  const [callScriptType, setCallScriptType] = useState<string>('reservation');
  const [callResult, setCallResult] = useState<any>(null);
  const [isCallLoading, setIsCallLoading] = useState(false);

  // Check if OpenAI API is properly configured
  const checkAIStatus = async () => {
    try {
      setStatusMessage('Checking OpenAI API status...');
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      
      if (data.available) {
        setStatusMessage('✅ OpenAI API is configured and ready to use');
      } else {
        setStatusMessage('❌ OpenAI API is not configured. Please provide a valid API key.');
      }
    } catch (error) {
      setStatusMessage('❌ Error checking OpenAI API status');
      console.error('Error checking AI status:', error);
    }
  };

  // Recipe Analysis Functions
  const handleRecipeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRecipeFile(e.target.files[0]);
    }
  };

  const analyzeRecipe = async () => {
    if (!recipeText.trim() && !recipeFile) {
      toast({
        title: "No recipe provided",
        description: "Please either enter recipe text or upload a recipe file",
        variant: "destructive"
      });
      return;
    }

    setIsRecipeLoading(true);
    setRecipeAnalysisResult(null);
    
    try {
      let response;
      
      if (recipeFile) {
        const formData = new FormData();
        formData.append('recipeFile', recipeFile);
        
        response = await fetch('/api/ai/recipe-analysis', {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch('/api/ai/recipe-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipeText }),
        });
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setRecipeAnalysisResult(data.analysis);
      toast({
        title: "Recipe analysis complete",
        description: "Recipe has been successfully analyzed",
      });
    } catch (error) {
      console.error('Error analyzing recipe:', error);
      toast({
        title: "Recipe analysis failed",
        description: "Failed to analyze recipe. See console for details.",
        variant: "destructive"
      });
    } finally {
      setIsRecipeLoading(false);
    }
  };

  // Wine Analysis Functions
  const handleWineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setWineFile(e.target.files[0]);
    }
  };

  const analyzeWineList = async () => {
    if (!wineText.trim() && !wineFile) {
      toast({
        title: "No wine list provided",
        description: "Please either enter wine list text or upload a file",
        variant: "destructive"
      });
      return;
    }

    setIsWineLoading(true);
    setWineAnalysisResult(null);
    
    try {
      let response;
      
      if (wineFile) {
        const formData = new FormData();
        formData.append('wineListFile', wineFile);
        
        response = await fetch('/api/ai/wine-analysis', {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch('/api/ai/wine-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ wineListText: wineText }),
        });
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setWineAnalysisResult(data.analysis);
      toast({
        title: "Wine list analysis complete",
        description: "Wine list has been successfully analyzed",
      });
    } catch (error) {
      console.error('Error analyzing wine list:', error);
      toast({
        title: "Wine list analysis failed",
        description: "Failed to analyze wine list. See console for details.",
        variant: "destructive"
      });
    } finally {
      setIsWineLoading(false);
    }
  };
  
  const getWineDetails = async () => {
    if (!selectedWine) {
      toast({
        title: "No wine selected",
        description: "Please select a wine to get detailed information",
        variant: "destructive"
      });
      return;
    }

    setIsWineDetailLoading(true);
    
    try {
      const response = await fetch('/api/ai/wine-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          wine: { name: selectedWine }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setWineDetailResult(data.info);
      toast({
        title: "Wine details retrieved",
        description: `Details for ${selectedWine} have been retrieved`,
      });
    } catch (error) {
      console.error('Error getting wine details:', error);
      toast({
        title: "Failed to get wine details",
        description: "Could not retrieve wine details. See console for details.",
        variant: "destructive"
      });
    } finally {
      setIsWineDetailLoading(false);
    }
  };

  // Call Script AI Functions
  const generateCallScript = async () => {
    if (!callScript.trim()) {
      toast({
        title: "No call context provided",
        description: "Please provide information for the call script",
        variant: "destructive"
      });
      return;
    }

    setIsCallLoading(true);
    setCallResult(null);
    
    try {
      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          context: callScript,
          type: callScriptType 
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setCallResult(data.script);
      toast({
        title: "Call script generated",
        description: "AI has successfully generated a call script",
      });
    } catch (error) {
      console.error('Error generating call script:', error);
      toast({
        title: "Script generation failed",
        description: "Failed to generate call script. See console for details.",
        variant: "destructive"
      });
    } finally {
      setIsCallLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Convive AI Features Test Center</h1>
        <Button onClick={checkAIStatus} variant="outline">
          Check AI Status
        </Button>
      </div>
      
      {statusMessage && (
        <div className="p-4 bg-slate-100 rounded-md mb-8">
          <p className="font-medium">{statusMessage}</p>
        </div>
      )}
      
      <Tabs defaultValue="recipe" className="space-y-6">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="recipe" className="flex gap-2 items-center">
            <ChefHat className="h-4 w-4" />
            Recipe Analysis
          </TabsTrigger>
          <TabsTrigger value="wine" className="flex gap-2 items-center">
            <Wine className="h-4 w-4" />
            Wine Analysis
          </TabsTrigger>
          <TabsTrigger value="wineupload" className="flex gap-2 items-center">
            <Upload className="h-4 w-4" />
            Wine Upload
          </TabsTrigger>
          <TabsTrigger value="call" className="flex gap-2 items-center">
            <Phone className="h-4 w-4" />
            Call Scripts
          </TabsTrigger>
        </TabsList>
        
        {/* Recipe Analysis Tab */}
        <TabsContent value="recipe" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Recipe Input
                </CardTitle>
                <CardDescription>Enter a recipe to analyze or upload a recipe file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipe-text">Recipe Text</Label>
                  <Textarea
                    id="recipe-text"
                    placeholder="Paste recipe instructions, ingredients, and any other details here..."
                    className="min-h-[150px]"
                    value={recipeText}
                    onChange={(e) => setRecipeText(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recipe-file">Or Upload Recipe File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="recipe-file"
                      type="file"
                      ref={recipeFileRef}
                      className="hidden"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleRecipeFileChange}
                    />
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => recipeFileRef.current?.click()}
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      {recipeFile ? recipeFile.name : "Choose File"}
                    </Button>
                    {recipeFile && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setRecipeFile(null)}
                      >
                        <Loader2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={analyzeRecipe} 
                  disabled={isRecipeLoading}
                >
                  {isRecipeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Recipe...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Recipe
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Process</CardTitle>
                <CardDescription>How the AI processes recipes to extract meaningful insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Text Extraction</h3>
                      <p className="text-sm text-muted-foreground">Extracts recipe text from various formats</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <List className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Structure Identification</h3>
                      <p className="text-sm text-muted-foreground">Identifies ingredients, instructions, cooking times</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Entity Recognition</h3>
                      <p className="text-sm text-muted-foreground">Recognizes cooking techniques, allergens, and special ingredients</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <AlignJustify className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Knowledge Enrichment</h3>
                      <p className="text-sm text-muted-foreground">Adds culinary context and educational elements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Teaching Points</h3>
                      <p className="text-sm text-muted-foreground">Identifies opportunities for host education at dinner tables</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recipe Analysis Results */}
          {recipeAnalysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>Recipe Analysis Results</CardTitle>
                <CardDescription>
                  The AI has extracted and analyzed the following information from the recipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <pre className="font-mono text-sm">
                    {JSON.stringify(recipeAnalysisResult, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Wine Analysis Tab */}
        <TabsContent value="wine" className="space-y-6">
          {/* Wine Analysis/Database Selection Tabs */}
          <div className="mb-6">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger
                value="analysis"
                className="flex gap-2 items-center"
                onClick={() => setActiveWineTab('analysis')}
                data-active={activeWineTab === 'analysis'}
              >
                <Wine className="h-4 w-4" />
                Wine Analysis
              </TabsTrigger>
              <TabsTrigger
                value="database"
                className="flex gap-2 items-center"
                onClick={() => setActiveWineTab('database')}
                data-active={activeWineTab === 'database'}
              >
                <Database className="h-4 w-4" />
                Wine Database
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Wine Analysis Section */}
          {activeWineTab === 'analysis' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wine className="h-5 w-5" />
                      Wine List Input
                    </CardTitle>
                    <CardDescription>Enter a wine list to analyze or upload a file</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="wine-text">Wine List Text</Label>
                      <Textarea
                        id="wine-text"
                        placeholder="Paste wine list details here..."
                        className="min-h-[150px]"
                        value={wineText}
                        onChange={(e) => setWineText(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="wine-file">Or Upload Wine List File</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="wine-file"
                          type="file"
                          ref={wineFileRef}
                          className="hidden"
                          accept=".txt,.pdf,.doc,.docx"
                          onChange={handleWineFileChange}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => wineFileRef.current?.click()}
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />
                          {wineFile ? wineFile.name : "Choose File"}
                        </Button>
                        {wineFile && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setWineFile(null)}
                          >
                            <Loader2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={analyzeWineList} 
                      disabled={isWineLoading}
                    >
                      {isWineLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing Wine List...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze Wine List
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Wine Details Lookup</CardTitle>
                    <CardDescription>Get detailed information about a specific wine</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wine-selection">Select or Type Wine Name</Label>
                      <div className="flex gap-2">
                        <Input
                          id="wine-selection"
                          placeholder="Enter wine name..."
                          value={selectedWine}
                          onChange={(e) => setSelectedWine(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={getWineDetails} 
                          disabled={isWineDetailLoading || !selectedWine}
                        >
                          {isWineDetailLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Info className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {wineAnalysisResult && (
                      <div className="mt-4">
                        <Label>Wines in Analyzed List</Label>
                        <ScrollArea className="h-[150px] mt-2">
                          <div className="space-y-2">
                            {wineAnalysisResult.wines?.map((wine: any, index: number) => (
                              <Badge 
                                key={index} 
                                variant="outline"
                                className="mr-2 mb-2 cursor-pointer hover:bg-primary/10"
                                onClick={() => setSelectedWine(wine.name)}
                              >
                                {wine.name}
                              </Badge>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Wine Analysis Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wineAnalysisResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Wine List Analysis</CardTitle>
                      <CardDescription>
                        Overview of analyzed wine list
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] rounded-md border p-4">
                        <pre className="font-mono text-sm">
                          {JSON.stringify(wineAnalysisResult, null, 2)}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
                
                {wineDetailResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Wine Details</CardTitle>
                      <CardDescription>
                        Detailed information about {selectedWine}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] rounded-md border p-4">
                        <pre className="font-mono text-sm">
                          {JSON.stringify(wineDetailResult, null, 2)}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
          
          {/* Wine Database Section */}
          {activeWineTab === 'database' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Wine Database</h2>
                <Badge variant="outline">Manage Wines</Badge>
              </div>
              <p className="text-muted-foreground mb-4">
                Search the wine database to find, view, and manage stored wines. This helps you identify duplicates and verify the database content.
              </p>
              
              <div className="space-y-6">
                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="text-lg font-medium mb-2">Search or View All Wines</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex flex-1 gap-2">
                      <Input 
                        placeholder="Search by name, producer, or region..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => {
                          if (searchQuery.trim().length < 3) {
                            toast({
                              title: "Search query too short",
                              description: "Please enter at least 3 characters",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          setIsDatabaseLoading(true);
                          fetch(`/api/sommelier/search-wines?q=${encodeURIComponent(searchQuery)}`)
                            .then(response => response.json())
                            .then(data => {
                              if (data.wines && data.wines.length > 0) {
                                setSearchResults(data.wines);
                                toast({
                                  title: `Found ${data.wines.length} wines`,
                                  description: `Matching wines for "${searchQuery}"`,
                                });
                              } else {
                                setSearchResults([]);
                                toast({
                                  title: "No Wines Found",
                                  description: `No wines match "${searchQuery}"`,
                                });
                              }
                              setIsDatabaseLoading(false);
                            })
                            .catch(error => {
                              console.error("Error searching wines:", error);
                              toast({
                                title: "Search Failed",
                                description: "Failed to search wine database",
                                variant: "destructive"
                              });
                              setIsDatabaseLoading(false);
                            });
                        }}
                        disabled={searchQuery.trim().length < 3 || isDatabaseLoading}
                      >
                        {isDatabaseLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="mr-2 h-4 w-4" />
                        )}
                        Search
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsDatabaseLoading(true);
                          setSearchQuery("");
                          
                          fetch("/api/sommelier/all-wines")
                            .then(response => response.json())
                            .then(data => {
                              if (data.wines) {
                                // Check for duplicates by creating a map of wine name + vintage + producer
                                const uniqueMap = new Map();
                                const duplicates = [];
                                
                                data.wines.forEach((wine: any) => {
                                  const key = `${wine.name?.value || ''}|${wine.vintage?.value || ''}|${wine.producer?.value || ''}`.toLowerCase();
                                  if (uniqueMap.has(key)) {
                                    duplicates.push({
                                      original: uniqueMap.get(key),
                                      duplicate: wine
                                    });
                                  } else {
                                    uniqueMap.set(key, wine);
                                  }
                                });
                                
                                // Set unique wines as search results
                                setSearchResults(Array.from(uniqueMap.values()));
                                
                                // Display duplicate count
                                toast({
                                  title: `Found ${data.wines.length} wines`,
                                  description: `${duplicates.length} potential duplicates detected. Showing ${uniqueMap.size} unique wines.`,
                                });
                              } else {
                                setSearchResults([]);
                                toast({
                                  title: "No Wines Found",
                                  description: "The wine database appears to be empty.",
                                });
                              }
                              setIsDatabaseLoading(false);
                            })
                            .catch(error => {
                              console.error("Error fetching all wines:", error);
                              toast({
                                title: "Error Fetching Wines",
                                description: "Failed to retrieve wine database.",
                                variant: "destructive"
                              });
                              setIsDatabaseLoading(false);
                            });
                        }}
                        disabled={isDatabaseLoading}
                      >
                        Show All Wines
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsDatabaseLoading(true);
                          setSearchQuery("");
                          
                          fetch("/api/sommelier/find-duplicates")
                            .then(response => response.json())
                            .then(data => {
                              if (data.duplicates) {
                                const allDuplicates = data.duplicates.flatMap((group: any[]) => group);
                                setSearchResults(allDuplicates);
                                toast({
                                  title: `Found ${data.duplicates.length} duplicate groups`,
                                  description: `${allDuplicates.length} total duplicate wines detected.`,
                                });
                              } else {
                                setSearchResults([]);
                                toast({
                                  title: "No Duplicates Found",
                                  description: "No duplicate wines were detected in the database.",
                                });
                              }
                              setIsDatabaseLoading(false);
                            })
                            .catch(error => {
                              console.error("Error finding duplicates:", error);
                              toast({
                                title: "Error Finding Duplicates",
                                description: "Failed to analyze wine database for duplicates.",
                                variant: "destructive"
                              });
                              setIsDatabaseLoading(false);
                            });
                        }}
                        disabled={isDatabaseLoading}
                      >
                        Find Duplicates
                      </Button>
                    </div>
                  </div>
                </div>
                
                {isDatabaseLoading && (
                  <div className="flex justify-center p-8">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div className="text-sm text-muted-foreground">Loading wines...</div>
                    </div>
                  </div>
                )}
                
                {searchResults.length > 0 && !isDatabaseLoading && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">
                      Wine Database Results ({searchResults.length} wines)
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {searchResults.map((wine, index) => (
                        <Card key={index} className="h-full">
                          <CardHeader>
                            <CardTitle className="text-base">{wine.name?.value || "Unknown Wine"}</CardTitle>
                            <CardDescription>
                              {wine.producer?.value && <div>{wine.producer.value}</div>}
                              {wine.vintage?.value && <div>Vintage: {wine.vintage.value}</div>}
                              {wine.region?.value && <div>{wine.region.value}</div>}
                              {wine.country?.value && <div>{wine.country.value}</div>}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            {wine.varietals?.value && (
                              <div>
                                <span className="font-medium">Grapes:</span> {Array.isArray(wine.varietals.value) 
                                  ? wine.varietals.value.join(", ") 
                                  : wine.varietals.value}
                              </div>
                            )}
                            {wine.style_summary?.value && (
                              <div>
                                <span className="font-medium">Style:</span> {wine.style_summary.value}
                              </div>
                            )}
                            {wine.body?.value && (
                              <div>
                                <span className="font-medium">Body:</span> {wine.body.value}
                              </div>
                            )}
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" size="sm" onClick={() => {
                              setWineToView(wine);
                              
                              toast({
                                title: "Wine Details",
                                description: `Viewing details for ${wine.name?.value || "Unknown Wine"}`,
                              });
                            }}>
                              <Info className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {!isDatabaseLoading && searchResults.length === 0 && searchQuery && (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-muted-foreground">
                      No wines found matching your search criteria.
                    </div>
                  </div>
                )}
                
                {/* Wine Detail Modal */}
                {wineToView && (
                  <Card className="border rounded-lg p-4 mt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{wineToView.name?.value || "Unknown Wine"}</h3>
                        <p className="text-muted-foreground">
                          {wineToView.producer?.value} {wineToView.vintage?.value && `• ${wineToView.vintage.value}`}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setWineToView(null)}>
                        Close
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-1">Wine Details</h4>
                          <div className="space-y-1 text-sm">
                            {wineToView.producer?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Producer:</span>
                                <span>{wineToView.producer.value}</span>
                              </div>
                            )}
                            {wineToView.region?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Region:</span>
                                <span>{wineToView.region.value}</span>
                              </div>
                            )}
                            {wineToView.country?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Country:</span>
                                <span>{wineToView.country.value}</span>
                              </div>
                            )}
                            {wineToView.vintage?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Vintage:</span>
                                <span>{wineToView.vintage.value}</span>
                              </div>
                            )}
                            {wineToView.varietals?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Grapes:</span>
                                <span>{Array.isArray(wineToView.varietals.value) 
                                  ? wineToView.varietals.value.join(", ") 
                                  : wineToView.varietals.value}</span>
                              </div>
                            )}
                            {wineToView.style?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Wine Style:</span>
                                <span>{wineToView.style.value}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-1">Tasting Profile</h4>
                          <div className="space-y-1 text-sm">
                            {wineToView.body?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Body:</span>
                                <span>{wineToView.body.value}</span>
                              </div>
                            )}
                            {wineToView.acidity?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Acidity:</span>
                                <span>{wineToView.acidity.value}</span>
                              </div>
                            )}
                            {wineToView.tannin?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Tannin:</span>
                                <span>{wineToView.tannin.value}</span>
                              </div>
                            )}
                            {wineToView.sweetness?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Sweetness:</span>
                                <span>{wineToView.sweetness.value}</span>
                              </div>
                            )}
                            {wineToView.alcohol?.value && (
                              <div className="flex">
                                <span className="font-medium w-24">Alcohol:</span>
                                <span>{wineToView.alcohol.value}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {wineToView.tasting_notes?.value && (
                          <div>
                            <h4 className="font-medium mb-1">Tasting Notes</h4>
                            <p className="text-sm">{wineToView.tasting_notes.value}</p>
                          </div>
                        )}
                        
                        {wineToView.style_summary?.value && (
                          <div>
                            <h4 className="font-medium mb-1">Style Summary</h4>
                            <p className="text-sm">{wineToView.style_summary.value}</p>
                          </div>
                        )}
                        
                        {wineToView.food_pairings?.value && (
                          <div>
                            <h4 className="font-medium mb-1">Food Pairings</h4>
                            <p className="text-sm">{Array.isArray(wineToView.food_pairings.value) 
                              ? wineToView.food_pairings.value.join(", ") 
                              : wineToView.food_pairings.value}</p>
                          </div>
                        )}
                        
                        {wineToView.winemaking_notes?.value && (
                          <div>
                            <h4 className="font-medium mb-1">Winemaking Notes</h4>
                            <p className="text-sm">{wineToView.winemaking_notes.value}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <pre className="text-xs text-muted-foreground border rounded-md p-4 overflow-auto">
                        {JSON.stringify(wineToView, null, 2)}
                      </pre>
                    </div>
                  </Card>
                )}
              </div>
            </Card>
          )}
        </TabsContent>
        
        {/* Call Scripts Tab */}
        {/* Wine Upload Tab */}
        <TabsContent value="wineupload" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Wine List Upload
                </CardTitle>
                <CardDescription>Upload and process wine lists with AI analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 bg-slate-50 rounded-lg text-center">
                  <Database className="h-12 w-12 mx-auto mb-4 text-primary/60" />
                  <h3 className="text-xl font-medium mb-2">Wine Upload Feature</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    The Wine Upload page provides a more comprehensive interface for processing and managing wine lists.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/wine-upload'} 
                    className="w-full md:w-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Go to Wine Upload Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="call" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Call Script Generator
                </CardTitle>
                <CardDescription>Generate AI-powered scripts for restaurant calls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="script-type">Script Type</Label>
                  <Select
                    value={callScriptType}
                    onValueChange={setCallScriptType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select script type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reservation">Reservation Call</SelectItem>
                      <SelectItem value="confirmation">Confirmation Call</SelectItem>
                      <SelectItem value="partnership">Restaurant Partnership</SelectItem>
                      <SelectItem value="feedback">Customer Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="call-context">Call Context</Label>
                  <Textarea
                    id="call-context"
                    placeholder="Provide context and key details for the call script..."
                    className="min-h-[200px]"
                    value={callScript}
                    onChange={(e) => setCallScript(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={generateCallScript} 
                  disabled={isCallLoading}
                >
                  {isCallLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Script...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Call Script
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Call Script</CardTitle>
                <CardDescription>The generated call script will appear here</CardDescription>
              </CardHeader>
              <CardContent>
                {isCallLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : callResult ? (
                  <ScrollArea className="h-[350px] rounded-md border p-4">
                    <div className="space-y-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {callResult}
                      </pre>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Phone className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Script Generated Yet</p>
                    <p className="text-sm text-center mt-2">
                      Fill out the form and click "Generate Call Script" to see results here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AITestPage;