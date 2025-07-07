import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Loader2, Wine } from "lucide-react";
import { useToast } from "../hooks/use-toast";

interface Wine {
  name: string;
  vintage?: string;
  restaurant_price?: string;
  producer?: string;
  region?: string;
  country?: string;
}

interface WineSampleUploaderProps {
  onWinesExtracted: (wines: Wine[]) => void;
}

export function WineSampleUploader({ onWinesExtracted }: WineSampleUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sampleSize, setSampleSize] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wineText, setWineText] = useState<string>("");
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSampleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setSampleSize(value);
    }
  };
  
  const extractSampleFromFile = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a wine list file first",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Read the file
      const text = await readFileAsText(file);
      
      // Split by lines and filter out empty lines
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      // If we have fewer lines than the sample size, use all of them
      const actualSampleSize = Math.min(sampleSize, lines.length);
      
      // Take a sample from different parts of the file
      let sampleLines: string[] = [];
      
      if (lines.length <= actualSampleSize) {
        // Use all lines if there are fewer than the sample size
        sampleLines = lines;
      } else {
        // Take from the beginning, middle, and end
        const beginCount = Math.floor(actualSampleSize / 3);
        const middleCount = Math.floor(actualSampleSize / 3);
        const endCount = actualSampleSize - beginCount - middleCount;
        
        // Beginning
        sampleLines = sampleLines.concat(lines.slice(0, beginCount));
        
        // Middle
        const middleStart = Math.floor(lines.length / 2) - Math.floor(middleCount / 2);
        sampleLines = sampleLines.concat(lines.slice(middleStart, middleStart + middleCount));
        
        // End
        sampleLines = sampleLines.concat(lines.slice(lines.length - endCount));
      }
      
      // Join the sample lines
      const sampleText = sampleLines.join('\n');
      
      // Set the wine text
      setWineText(sampleText);
      
      toast({
        title: "Sample Extracted",
        description: `Extracted ${sampleLines.length} lines from your wine list`
      });
      
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        title: "Error Reading File",
        description: "Failed to read the wine list file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const parseWineData = () => {
    if (!wineText.trim()) {
      toast({
        title: "No Wine Data",
        description: "Please extract a sample from a file or enter wine data manually",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simple wine list parsing - this is a very basic implementation
    // In a real app, you would want more sophisticated parsing
    try {
      const lines = wineText.split('\n').filter(line => line.trim().length > 0);
      const wines: Wine[] = [];
      
      lines.forEach(line => {
        // Try to extract vintage (4 digits that could be a year)
        const vintageMatch = line.match(/\b(19|20)\d{2}\b/);
        const vintage = vintageMatch ? vintageMatch[0] : undefined;
        
        // Try to extract price ($ or € followed by digits and optional decimals)
        const priceMatch = line.match(/[\$€]\s*\d+(\.\d{2})?/);
        const price = priceMatch ? priceMatch[0] : undefined;
        
        // The rest is likely the wine name
        // Remove the vintage and price if found
        let name = line;
        if (vintage) name = name.replace(vintage, '');
        if (price) name = name.replace(price, '');
        
        // Clean up the name
        name = name.replace(/\s+/g, ' ').trim();
        
        // Only add if we have a name
        if (name) {
          wines.push({
            name,
            vintage,
            restaurant_price: price
          });
        }
      });
      
      // Call the callback with the extracted wines
      onWinesExtracted(wines);
      
      toast({
        title: "Wine Data Extracted",
        description: `Found ${wines.length} wines in the sample`
      });
      
    } catch (error) {
      console.error("Error parsing wine data:", error);
      toast({
        title: "Error Parsing Wine Data",
        description: "Failed to parse the wine data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Utility function to read a file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error("Failed to read file as text"));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wine className="h-5 w-5" />
          Wine List Sampler
        </CardTitle>
        <CardDescription>
          Extract a manageable sample from your wine list
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wine-file">Upload Wine List</Label>
          <Input
            id="wine-file"
            type="file"
            accept=".txt,.csv,.pdf"
            onChange={handleFileChange}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sample-size">Sample Size</Label>
          <Input
            id="sample-size"
            type="number"
            min="1"
            value={sampleSize}
            onChange={handleSampleSizeChange}
          />
          <p className="text-sm text-muted-foreground">
            Number of wine entries to extract (sampled from beginning, middle, and end)
          </p>
        </div>
        
        <Button 
          onClick={extractSampleFromFile}
          disabled={!file || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Extract Sample"
          )}
        </Button>
        
        <div className="space-y-2">
          <Label htmlFor="wine-text">Wine List Sample</Label>
          <Textarea
            id="wine-text"
            value={wineText}
            onChange={(e) => setWineText(e.target.value)}
            rows={10}
            placeholder="Wine list sample will appear here..."
            className="font-mono text-sm"
          />
          <p className="text-sm text-muted-foreground">
            You can also manually edit this text if needed
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={parseWineData} 
          disabled={!wineText.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing...
            </>
          ) : (
            "Parse Wine Data"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}