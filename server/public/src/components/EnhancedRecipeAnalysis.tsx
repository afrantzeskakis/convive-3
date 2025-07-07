import React, { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { CulinaryTermCarousel } from "./CulinaryTermCarousel";
import { useHapticFeedback } from "../../hooks/useHapticFeedback";
import { useDarkMode } from "../../hooks/useDarkMode";
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Loader2,
  Coffee,
  Users,
  Clock,
  Utensils,
  Activity,
  ChevronDown,
  ChevronUp,
  Eye,
  BookOpen
} from "lucide-react";

interface RecipeAnalysisResult {
  allergens: {
    severity: 'red' | 'yellow' | 'green';
    allergen: string;
    description: string;
  }[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  culinaryTerms: {
    term: string;
    definition: string;
    importance: 'high' | 'medium' | 'low';
    category: string;
  }[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  prepTime: string;
  servings: number;
}

interface EnhancedRecipeAnalysisProps {
  restaurantId: number;
  onAnalysisComplete?: (result: RecipeAnalysisResult) => void;
}

export function EnhancedRecipeAnalysis({ restaurantId, onAnalysisComplete }: EnhancedRecipeAnalysisProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RecipeAnalysisResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    allergens: true,
    nutrition: false,
    culinary: false
  });
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [showTermCarousel, setShowTermCarousel] = useState(false);

  const { triggerHaptic } = useHapticFeedback();
  const { isRestaurant, isDark } = useDarkMode();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/plain') {
      setFile(selectedFile);
      triggerHaptic('light');
    } else {
      triggerHaptic('error');
    }
  }, [triggerHaptic]);

  const analyzeRecipe = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    triggerHaptic('medium');

    try {
      const formData = new FormData();
      formData.append('recipeFile', file);
      formData.append('restaurantId', restaurantId.toString());

      const response = await fetch('/api/ai/upload-recipe', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Enhanced analysis with culinary knowledge integration
        const enhancedResult: RecipeAnalysisResult = {
          allergens: data.allergens || [],
          nutrition: data.nutrition || {},
          culinaryTerms: data.culinaryTerms || [],
          complexity: data.complexity || 'intermediate',
          prepTime: data.prepTime || 'Unknown',
          servings: data.servings || 4
        };

        setResult(enhancedResult);
        onAnalysisComplete?.(enhancedResult);
        triggerHaptic('success');
      } else {
        triggerHaptic('error');
      }
    } catch (error) {
      console.error('Recipe analysis failed:', error);
      triggerHaptic('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    triggerHaptic('light');
  };

  const openTermCarousel = (term: string) => {
    setSelectedTerm(term);
    setShowTermCarousel(true);
    triggerHaptic('medium');
  };

  const getAllergenColor = (severity: string) => {
    switch (severity) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`space-y-6 ${isRestaurant ? 'restaurant-mode' : ''}`}>
      {/* File Upload Section */}
      <Card className={isDark ? 'border-gray-700' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Recipe Analysis</span>
          </CardTitle>
          <CardDescription>
            Upload a recipe text file for comprehensive analysis including allergens, 
            nutrition, and culinary knowledge integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <div className="space-y-2">
              <label htmlFor="recipe-file" className="cursor-pointer">
                <span className="text-sm text-muted-foreground">
                  Choose a text file or drag and drop
                </span>
                <input
                  id="recipe-file"
                  type="file"
                  accept=".txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {file && (
                <p className="text-sm font-medium text-green-600">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          <Button 
            onClick={analyzeRecipe} 
            disabled={!file || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Recipe...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Analyze Recipe
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {result && (
        <div className="space-y-4">
          {/* Quick Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Recipe Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.complexity}</div>
                  <div className="text-sm text-muted-foreground">Complexity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.prepTime}</div>
                  <div className="text-sm text-muted-foreground">Prep Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{result.servings}</div>
                  <div className="text-sm text-muted-foreground">Servings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{result.culinaryTerms.length}</div>
                  <div className="text-sm text-muted-foreground">Terms Found</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="allergens" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="allergens" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Allergens</span>
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Nutrition</span>
              </TabsTrigger>
              <TabsTrigger value="culinary" className="flex items-center space-x-2">
                <Coffee className="h-4 w-4" />
                <span>Culinary Knowledge</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="allergens" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Allergen Analysis</CardTitle>
                  <CardDescription>Traffic light system for allergen identification</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.allergens.map((allergen, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${getAllergenColor(allergen.severity)}`} />
                        <div className="flex-1">
                          <div className="font-medium">{allergen.allergen}</div>
                          <div className="text-sm text-muted-foreground">{allergen.description}</div>
                        </div>
                        <Badge variant={allergen.severity === 'red' ? 'destructive' : 
                                     allergen.severity === 'yellow' ? 'default' : 'secondary'}>
                          {allergen.severity.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nutrition" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Nutritional Information</CardTitle>
                  <CardDescription>Per serving nutritional breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{result.nutrition.calories}</div>
                      <div className="text-sm text-muted-foreground">Calories</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{result.nutrition.protein}g</div>
                      <div className="text-sm text-muted-foreground">Protein</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{result.nutrition.carbs}g</div>
                      <div className="text-sm text-muted-foreground">Carbs</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{result.nutrition.fat}g</div>
                      <div className="text-sm text-muted-foreground">Fat</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{result.nutrition.fiber}g</div>
                      <div className="text-sm text-muted-foreground">Fiber</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="culinary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Culinary Knowledge Integration</CardTitle>
                  <CardDescription>Restaurant-specific culinary term analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.culinaryTerms.map((term, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{term.term}</span>
                            <Badge variant={term.importance === 'high' ? 'default' : 
                                          term.importance === 'medium' ? 'secondary' : 'outline'}>
                              {term.importance}
                            </Badge>
                            <Badge variant="outline">{term.category}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {term.definition.length > 100 ? 
                              `${term.definition.substring(0, 100)}...` : 
                              term.definition}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTermCarousel(term.term)}
                          className="ml-2"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Culinary Term Detail Modal */}
      {showTermCarousel && selectedTerm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Coffee className="h-5 w-5" />
                  <span>{selectedTerm}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowTermCarousel(false);
                    setSelectedTerm(null);
                    triggerHaptic('light');
                  }}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Restaurant-specific culinary knowledge and training content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Detailed culinary knowledge for "{selectedTerm}" including relationships, 
                    seasonal context, and staff training content will be loaded here.
                  </AlertDescription>
                </Alert>
                <div className="text-center py-8">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Load Full Knowledge Base</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}