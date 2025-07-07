import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChefHat, ChevronRight, BookOpen, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SmartRecipeDisplay } from './SmartRecipeDisplay';

interface Recipe {
  name: string;
  originalText: string;
  analysis: any;
}

interface RecipeListViewProps {
  recipes: Recipe[];
  culinaryTerms: any[];
}

export function RecipeListView({ recipes, culinaryTerms }: RecipeListViewProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  if (selectedRecipe) {
    // Show the selected recipe in original format with clickable terms
    return (
      <div className="space-y-4">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedRecipe(null)}
          className="mb-4"
        >
          <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
          Back to Recipe List
        </Button>

        {/* Recipe display in original format with smart selection */}
        <SmartRecipeDisplay 
          recipeText={selectedRecipe.originalText}
          culinaryTerms={culinaryTerms}
        />
      </div>
    );
  }

  // Show recipe list
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Recipe Collection ({recipes.length} recipes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {recipes.map((recipe, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChefHat className="w-5 h-5 text-primary" />
                        <div>
                          <h3 className="font-medium text-lg">{recipe.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {recipe.analysis?.ingredients?.length || 0} ingredients • 
                            {recipe.analysis?.instructions?.length || 0} steps
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    {/* Preview of ingredients or allergens */}
                    {recipe.analysis?.allergens && recipe.analysis.allergens.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {recipe.analysis.allergens.slice(0, 3).map((allergen: string, i: number) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {allergen}
                          </Badge>
                        ))}
                        {recipe.analysis.allergens.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{recipe.analysis.allergens.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          
          {recipes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No recipes found in the uploaded file.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}