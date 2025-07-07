import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Loader2, Upload, FileText, Database } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

type ProcessedWine = {
  wine_name: string;
  vintage?: string;
  producer?: string;
  region?: string;
  country?: string;
  varietals?: string;
  wine_data?: any;
};

type ProgressData = {
  total: number;
  processed: number;
  errors: number;
  percent: number;
  currentBatch: number;
  totalBatches: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message: string;
  startTime?: Date;
  lastUpdateTime: Date;
};

type ApiResponse = {
  success: boolean;
  message: string;
  processedCount?: number;
  errorCount?: number;
  totalInDatabase?: number;
  sampleWines?: ProcessedWine[];
  progressId?: string;
  stats?: {
    processed: number;
    errors: number;
    databaseTotal: number;
  };
};

// Processing progress indicator component
function ProcessingProgress({ progress }: { progress: ProgressData | null }) {
  if (!progress) return null;
  
  return (
    <div className="space-y-2">
      <div className="bg-secondary/30 h-2.5 rounded-full overflow-hidden">
        <div 
          className="bg-primary h-full transition-all duration-500 ease-in-out" 
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {progress.processed} of {progress.total} wines
          {progress.errors > 0 && ` (${progress.errors} errors)`}
        </span>
        <span>{progress.percent}%</span>
      </div>
      
      {progress.totalBatches > 1 && (
        <div className="text-xs text-muted-foreground text-center">
          Batch {progress.currentBatch} of {progress.totalBatches}
        </div>
      )}
    </div>
  );
}

export default function WineUploadPage() {
  const { toast } = useToast();
  const [wineListText, setWineListText] = useState<string>(
    `Tenuta dell'Ornellaia Ornellaia 2019, Bolgheri, Tuscany, Italy - $225
Château Margaux 2015, Margaux, Bordeaux, France - $995
Screaming Eagle Cabernet Sauvignon 2018, Napa Valley, California - $3,500
Domaine de la Romanée-Conti La Tâche Grand Cru 2017, Burgundy, France - $5,995
Penfolds Grange 2016, South Australia - $850`
  );
  const [wineFile, setWineFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ApiResponse | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const progressIntervalRef = React.useRef<number | null>(null);

  // Clear progress polling when component unmounts
  React.useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Handle real-time progress updates
  const startProgressPolling = (id: string) => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
    }

    setProgressId(id);
    
    // Poll for progress updates every 2 seconds
    progressIntervalRef.current = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/sommelier/progress/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch progress: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.progress) {
          setProgressData(data.progress);
          
          // If processing is complete or errored, stop polling
          if (data.progress.status === 'complete' || data.progress.status === 'error') {
            if (progressIntervalRef.current) {
              window.clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            
            // If complete, refresh the analysis result
            if (data.progress.status === 'complete') {
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("Error polling for progress:", error);
      }
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);
      setWineFile(file);
      
      // Read the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setWineListText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTextUpload = async () => {
    if (!wineListText || wineListText.trim().length < 10) {
      toast({
        title: "Invalid Wine List",
        description: "Please enter a valid wine list with at least a few wines",
        variant: "destructive"
      });
      return;
    }

    // Reset states
    setIsLoading(true);
    setAnalysisResult(null);
    setProgressData(null);
    
    // Clear any existing progress polling
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    try {
      console.log("Processing wine list text:", wineListText.length, "characters");

      const response = await fetch('/api/sommelier/process-wine-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wineListText: wineListText })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Wine list processing initiated:", result);
      
      setAnalysisResult(result);
      
      // If result contains a progressId, start polling for progress updates
      if (result.progressId) {
        startProgressPolling(result.progressId);
        
        toast({
          title: "Processing Started",
          description: "Wine list processing has started. Progress will be updated in real-time.",
        });
      } else {
        // If no progressId, processing is already complete
        setIsLoading(false);
        
        toast({
          title: "Processing Complete",
          description: `Processed ${result.processedCount || 0} wines and added them to the database`,
        });
      }
    } catch (error) {
      console.error("Wine list processing failed:", error);
      setIsLoading(false);
      
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Wine Database</h1>
      <p className="text-muted-foreground mb-6">
        Upload and analyze wine lists to build a comprehensive wine database.
      </p>
      
      <Tabs defaultValue="text" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="text">Enter Wine List Text</TabsTrigger>
          <TabsTrigger value="file">Upload Wine List File</TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Wine List Text</CardTitle>
                <CardDescription>
                  Enter your wine list with one wine per line
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={wineListText}
                  onChange={(e) => setWineListText(e.target.value)}
                  className="min-h-[250px] font-mono text-sm"
                  placeholder="Enter wine list here..."
                />

                <Button
                  className="w-full"
                  onClick={handleTextUpload}
                  disabled={isLoading || !wineListText}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Wine List...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Process Wine List
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Results</CardTitle>
                <CardDescription>
                  See how many wines were processed and added to the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 font-medium">
                        {progressData ? progressData.message : "Starting wine list processing..."}
                      </span>
                    </div>
                    
                    <ProcessingProgress progress={progressData} />
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-secondary/50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{analysisResult.processedCount || 0}</p>
                        <p className="text-sm text-muted-foreground">Wines Processed</p>
                      </div>
                      <div className="bg-secondary/50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{analysisResult.errorCount || 0}</p>
                        <p className="text-sm text-muted-foreground">Errors</p>
                      </div>
                      <div className="bg-secondary/50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{analysisResult.totalInDatabase || 0}</p>
                        <p className="text-sm text-muted-foreground">Total in Database</p>
                      </div>
                    </div>

                    {analysisResult.sampleWines && analysisResult.sampleWines.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Sample Wines</h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {analysisResult.sampleWines.map((wine: ProcessedWine, index: number) => (
                            <div key={index} className="p-3 border rounded-md">
                              <p className="font-medium">{wine.wine_name}</p>
                              <div className="text-sm text-gray-600 flex flex-wrap gap-x-3">
                                {wine.vintage && <span>Vintage: {wine.vintage}</span>}
                                {wine.producer && <span>Producer: {wine.producer}</span>}
                                {wine.region && <span>Region: {wine.region}</span>}
                                {wine.country && <span>Country: {wine.country}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Process a wine list to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="file">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Wine List File</CardTitle>
                <CardDescription>
                  Upload a text file containing your wine list
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="wine-file">Select Wine List File</Label>
                  <div className="mt-2">
                    <Input
                      id="wine-file"
                      type="file"
                      accept=".txt,.csv"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported formats: TXT, CSV (one wine per line)
                  </p>
                </div>

                {wineFile && (
                  <div className="bg-secondary/50 p-3 rounded-md">
                    <p className="text-sm font-medium flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      {wineFile.name}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {(wineFile.size / 1024).toFixed(1)} KB
                      </span>
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleTextUpload}
                  disabled={isLoading || !wineFile}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing File...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Process Wine List File
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Results</CardTitle>
                <CardDescription>
                  See how many wines were processed and added to the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Processing wine list...</span>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-secondary/50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{analysisResult.processedCount || 0}</p>
                        <p className="text-sm text-muted-foreground">Wines Processed</p>
                      </div>
                      <div className="bg-secondary/50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{analysisResult.errorCount || 0}</p>
                        <p className="text-sm text-muted-foreground">Errors</p>
                      </div>
                      <div className="bg-secondary/50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{analysisResult.totalInDatabase || 0}</p>
                        <p className="text-sm text-muted-foreground">Total in Database</p>
                      </div>
                    </div>

                    {analysisResult.sampleWines && analysisResult.sampleWines.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Sample Wines</h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {analysisResult.sampleWines.map((wine: ProcessedWine, index: number) => (
                            <div key={index} className="p-3 border rounded-md">
                              <p className="font-medium">{wine.wine_name}</p>
                              <div className="text-sm text-gray-600 flex flex-wrap gap-x-3">
                                {wine.vintage && <span>Vintage: {wine.vintage}</span>}
                                {wine.producer && <span>Producer: {wine.producer}</span>}
                                {wine.region && <span>Region: {wine.region}</span>}
                                {wine.country && <span>Country: {wine.country}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Upload a wine list file to see results</p>
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