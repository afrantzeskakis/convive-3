import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, Upload, FileText } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function SimpleWineUpload() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  
  // Hardcoded restaurant list for demo purposes
  const restaurants = [
    { id: "1", name: "Bella Italia Restaurant" },
    { id: "2", name: "Golden Dragon" },
    { id: "3", name: "La Maison Bistro" }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a wine list file to upload",
        variant: "destructive"
      });
      return;
    }

    if (!restaurantId) {
      toast({
        title: "No restaurant selected",
        description: "Please select a restaurant",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('wineFile', file);
      formData.append('restaurantId', restaurantId);
      
      // Make the actual API call to our endpoint
      const response = await fetch('/api/simple-wine/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze wine list');
      }
      
      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Analysis Complete",
        description: "Wine list has been successfully analyzed",
      });
    } catch (error) {
      console.error("Error uploading wine list:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload and analyze wine list",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Wine List Analysis</h1>
      <p className="text-muted-foreground mb-6">
        This tool helps you analyze wine lists for restaurants. Upload a wine list file and get detailed information about the wines.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Wine List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="restaurant">Select Restaurant</Label>
              <Select value={restaurantId} onValueChange={setRestaurantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="wine-file">Wine List File</Label>
              <Input
                id="wine-file"
                type="file"
                accept=".txt,.csv,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleUpload}
              disabled={isUploading || !file || !restaurantId}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze Wine List
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Analyzing wine list...</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="pb-4 border-b">
                  <h3 className="font-semibold text-lg">File Information</h3>
                  <p><span className="font-medium">Restaurant:</span> {result.restaurant}</p>
                  <p><span className="font-medium">File Name:</span> {result.fileName}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Identified Wines</h3>
                  <div className="space-y-2">
                    {result.wines.map((wine: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md">
                        <p className="font-medium">{wine.name}</p>
                        <div className="flex justify-between text-sm">
                          <span>{wine.region}</span>
                          <span className="font-semibold">{wine.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Upload a wine list to see analysis results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}