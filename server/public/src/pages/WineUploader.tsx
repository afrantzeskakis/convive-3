import React, { useState, useRef } from "react";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Loader2, Wine, FileText, UploadCloud, CheckCircle, AlertCircle } from "lucide-react";

/**
 * Wine List Uploader Component
 * 
 * This component provides a standalone interface for uploading wine lists
 * to the global database and restaurant-specific database.
 */
const WineUploader = () => {
  const { toast } = useToast();
  const [wineListText, setWineListText] = useState("");
  const [wineFile, setWineFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingResults, setProcessingResults] = useState<any>(null);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  
  // Function to handle text input change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWineListText(e.target.value);
  };
  
  // Function to handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setWineFile(file);
      
      // Read file contents
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setWineListText(content);
        }
      };
      reader.readAsText(file);
      
      toast({
        title: "File loaded",
        description: `${file.name} (${(file.size / 1024).toFixed(1)} KB) loaded successfully`,
      });
    }
  };
  
  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wineListText.trim()) {
      toast({
        title: "No wine list provided",
        description: "Please paste wine list text or upload a file",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus("Starting wine list processing...");
    setProcessingResults(null);
    
    try {
      // Decide which endpoint to use based on whether restaurantId is provided
      const endpoint = restaurantId 
        ? `/api/sommelier/restaurant/${restaurantId}/upload-wine-list`
        : '/api/sommelier/upload-wine-list';
      
      const formData = new FormData();
      
      // If we have a file, add it to the form data
      if (wineFile) {
        formData.append('wineList', wineFile);
      } else {
        // Create a new file from the text input
        const textFile = new Blob([wineListText], {type: 'text/plain'});
        formData.append('wineList', textFile, 'wine-list.txt');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Wine list processing result:", result);
      
      // Update progress to complete
      setProcessingProgress(100);
      setProcessingStatus("Processing complete!");
      setProcessingResults(result.data);
      
      toast({
        title: "Wine list processed",
        description: `Successfully processed ${result.data?.processedCount || 0} wines`,
      });
    } catch (error) {
      console.error("Error processing wine list:", error);
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process wine list",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Function to reset the form
  const handleReset = () => {
    setWineListText("");
    setWineFile(null);
    setProcessingResults(null);
    setProcessingProgress(0);
    setProcessingStatus("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Wine className="h-5 w-5" />
            Wine List Uploader
          </CardTitle>
          <CardDescription>
            Upload wine lists to process with GPT-4o and add to the database
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Restaurant selection for restaurant admins */}
            <div className="space-y-2">
              <Label htmlFor="restaurant-id">Restaurant ID (optional)</Label>
              <Input 
                id="restaurant-id" 
                type="number"
                placeholder="Leave empty for global database"
                min="1"
                value={restaurantId || ''}
                onChange={(e) => setRestaurantId(e.target.value ? parseInt(e.target.value) : null)}
              />
              <p className="text-xs text-muted-foreground">
                If provided, wines will be associated with this restaurant
              </p>
            </div>
            
            {/* Wine list text input */}
            <div className="space-y-2">
              <Label htmlFor="wine-list-text">Wine List Text</Label>
              <Textarea 
                id="wine-list-text" 
                placeholder="Paste wine list here, one wine per line..."
                className="min-h-[200px] font-mono text-sm"
                rows={8}
                value={wineListText}
                onChange={handleTextChange}
              />
              <p className="text-xs text-muted-foreground">
                Format: Enter each wine on a separate line
              </p>
            </div>
            
            {/* File upload option */}
            <div className="space-y-2">
              <Label>Or Upload Wine List File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="wine-file"
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {wineFile ? wineFile.name : "Choose File"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Text files (.txt) with one wine per line work best
              </p>
            </div>
            
            {/* Processing status */}
            {(isProcessing || processingStatus) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing Status</span>
                  <span className="text-xs text-muted-foreground">
                    {processingProgress}%
                  </span>
                </div>
                <Progress value={processingProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">{processingStatus}</p>
              </div>
            )}
            
            {/* Results summary */}
            {processingResults && (
              <Alert className={processingResults.success ? "bg-green-50" : "bg-red-50"}>
                <div className="flex items-center gap-2">
                  {processingResults.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertTitle>
                    {processingResults.success ? "Processing Complete" : "Processing Failed"}
                  </AlertTitle>
                </div>
                <AlertDescription className="mt-2">
                  <div className="text-sm">
                    <p>Processed: {processingResults.processedCount} wines</p>
                    {processingResults.errorCount > 0 && (
                      <p>Errors: {processingResults.errorCount}</p>
                    )}
                    {processingResults.totalInDatabase && (
                      <p>Total wines in database: {processingResults.totalInDatabase}</p>
                    )}
                  </div>
                  
                  {processingResults.sampleWines && processingResults.sampleWines.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium">Sample wines processed:</p>
                      <ul className="mt-2 text-sm space-y-1">
                        {processingResults.sampleWines.slice(0, 5).map((wine: any, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>
                              {wine.producer ? `${wine.producer} ` : ""}
                              <strong>{wine.wine_name}</strong>
                              {wine.vintage ? ` ${wine.vintage}` : ""}
                              {wine.region ? ` (${wine.region})` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Submit and reset buttons */}
            <div className="flex items-center gap-4">
              <Button 
                type="submit"
                className="flex-1"
                disabled={isProcessing || !wineListText.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Process Wine List
                  </>
                )}
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isProcessing}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WineUploader;