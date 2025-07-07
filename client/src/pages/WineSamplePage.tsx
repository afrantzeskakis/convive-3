import React, { useState } from 'react';
import { WineSampleUploader } from '@/components/WineSampleUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wine, Info, Share } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

interface Wine {
  name: string;
  vintage?: string;
  restaurant_price?: string;
  producer?: string;
  region?: string;
  country?: string;
}

export default function WineSamplePage() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const { toast } = useToast();
  
  const handleWinesExtracted = (extractedWines: Wine[]) => {
    setWines(extractedWines);
  };
  
  const copyToClipboard = () => {
    if (wines.length === 0) {
      toast({
        title: "No Wines to Copy",
        description: "Please extract wines first",
        variant: "destructive"
      });
      return;
    }
    
    const text = wines.map(wine => {
      const parts = [];
      if (wine.name) parts.push(wine.name);
      if (wine.vintage) parts.push(`(${wine.vintage})`);
      if (wine.restaurant_price) parts.push(wine.restaurant_price);
      return parts.join(' ');
    }).join('\n');
    
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copied to Clipboard",
          description: `${wines.length} wines copied to clipboard`
        });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Copy Failed",
          description: "Failed to copy wines to clipboard",
          variant: "destructive"
        });
      });
  };
  
  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
        <Wine className="h-8 w-8" />
        Wine List Sample Processor
      </h1>
      <p className="text-muted-foreground mb-8">
        Process wine lists of any size by extracting a representative sample
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <WineSampleUploader onWinesExtracted={handleWinesExtracted} />
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-xl">Extracted Wines</CardTitle>
                <CardDescription>
                  {wines.length} wines extracted from sample
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyToClipboard}
                disabled={wines.length === 0}
              >
                <Share className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {wines.length > 0 ? (
                <ScrollArea className="h-[500px] pr-4">
                  <Accordion type="multiple" className="w-full">
                    {wines.map((wine, index) => (
                      <AccordionItem key={index} value={`wine-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="text-left flex-1">
                            <div className="font-medium">{wine.name}</div>
                            <div className="text-sm text-muted-foreground flex gap-2">
                              {wine.vintage && <span>{wine.vintage}</span>}
                              {wine.restaurant_price && <span>{wine.restaurant_price}</span>}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-3 gap-1">
                              <span className="font-medium">Name:</span>
                              <span className="col-span-2">{wine.name}</span>
                              
                              {wine.vintage && (
                                <>
                                  <span className="font-medium">Vintage:</span>
                                  <span className="col-span-2">{wine.vintage}</span>
                                </>
                              )}
                              
                              {wine.restaurant_price && (
                                <>
                                  <span className="font-medium">Price:</span>
                                  <span className="col-span-2">{wine.restaurant_price}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No wines extracted yet. Use the Wine List Sampler to extract wines.
                </div>
              )}
            </CardContent>
          </Card>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowHelp(!showHelp)}
          >
            <Info className="mr-2 h-4 w-4" />
            {showHelp ? "Hide Help" : "Show Help"}
          </Button>
          
          {showHelp && (
            <Card>
              <CardHeader>
                <CardTitle>Help & Information</CardTitle>
                <CardDescription>How to use the Wine List Sampler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium mb-1">Why use this tool?</h3>
                  <p>
                    When working with very large wine lists (thousands of entries), AI services 
                    often hit rate limits or token limits. This tool helps extract a representative 
                    sample that's small enough to process but still gives you useful results.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">How it works:</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Upload your wine list file (TXT, CSV, or PDF)</li>
                    <li>Choose how many wines to sample (default: 20)</li>
                    <li>Click "Extract Sample" to get a balanced sample from the beginning, middle, and end</li>
                    <li>Review and edit the sample text if needed</li>
                    <li>Click "Parse Wine Data" to extract structured wine information</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Tips:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>The parser works best with simple line-by-line wine lists</li>
                    <li>If you have a complex format, you may need to edit the extracted sample</li>
                    <li>Use the "Copy to Clipboard" button to use extracted wines elsewhere</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}