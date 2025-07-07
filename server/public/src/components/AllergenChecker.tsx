import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { 
  Alert,
  AlertTitle,
  AlertDescription
} from './ui/alert';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';

// Interface for returned allergen data
interface AllergenData {
  success: boolean;
  ingredient?: string;
  allergens?: string[];
  dietaryRestrictions?: string[];
  hasAllergens: boolean;
  hasDietaryRestrictions?: boolean;
  allergenSummary?: { [key: string]: string[] };
  dietaryRestrictionSummary?: { [key: string]: string[] };
  detectedIngredients?: { name: string, allergens: string[], dietaryRestrictions?: string[] }[];
}

interface AllergenCheckerProps {
  restaurantId?: number;
}

export function AllergenChecker({ restaurantId }: AllergenCheckerProps) {
  const [ingredient, setIngredient] = useState('');
  const [recipe, setRecipe] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [allergenData, setAllergenData] = useState<AllergenData | null>(null);
  const { toast } = useToast();

  // Function to check allergens in a single ingredient
  const checkIngredient = async () => {
    if (!ingredient.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter an ingredient to check',
        variant: 'destructive'
      });
      return;
    }

    setIsChecking(true);
    setAllergenData(null);

    try {
      // Add restaurant ID to the request if it exists
      const restaurantParam = restaurantId ? `&restaurantId=${restaurantId}` : '';
      const response = await fetch(`/api/recipe-analyzer/check-allergens?ingredient=${encodeURIComponent(ingredient)}${restaurantParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to check allergens');
      }
      
      const data = await response.json();
      setAllergenData(data);
    } catch (error: any) {
      console.error('Error checking allergens:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check allergens. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Function to check allergens in a recipe
  const checkRecipe = async () => {
    if (!recipe.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter a recipe to check',
        variant: 'destructive'
      });
      return;
    }

    setIsChecking(true);
    setAllergenData(null);

    try {
      // Add restaurant ID to the request if it exists
      const restaurantParam = restaurantId ? `&restaurantId=${restaurantId}` : '';
      const response = await fetch(`/api/recipe-analyzer/check-allergens?recipe=${encodeURIComponent(recipe)}${restaurantParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to check allergens');
      }
      
      const data = await response.json();
      setAllergenData(data);
    } catch (error: any) {
      console.error('Error checking allergens:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check allergens. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allergen & Dietary Restriction Checker</CardTitle>
        <CardDescription>
          Check recipes or ingredients for the top 25 most common food allergens and 8 dietary restrictions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Check a Single Ingredient</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter ingredient (e.g., 'milk', 'almonds', 'eggs')"
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              className="flex-1"
            />
            <Button onClick={checkIngredient} disabled={isChecking || !ingredient}>
              {isChecking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Check
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Check a Recipe</h3>
          <textarea
            placeholder="Paste your recipe or list of ingredients here"
            value={recipe}
            onChange={(e) => setRecipe(e.target.value)}
            className="w-full min-h-[100px] p-2 border rounded-md text-sm"
          />
          <Button 
            onClick={checkRecipe} 
            disabled={isChecking || !recipe}
            className="w-full"
          >
            {isChecking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Analyze Recipe
          </Button>
        </div>

        {allergenData && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            
            <div className="flex flex-col gap-4">
              {/* Allergens Alert */}
              {allergenData.hasAllergens ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Allergens Detected</AlertTitle>
                  <AlertDescription>
                    This {allergenData.ingredient ? 'ingredient' : 'recipe'} contains potential allergens.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="default">
                  <AlertTitle>No Common Allergens Detected</AlertTitle>
                  <AlertDescription>
                    No common allergens were found in this {allergenData.ingredient ? 'ingredient' : 'recipe'}.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Dietary Restrictions Alert */}
              {allergenData.hasDietaryRestrictions ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Dietary Restrictions Apply</AlertTitle>
                  <AlertDescription>
                    This {allergenData.ingredient ? 'ingredient' : 'recipe'} is not suitable for some dietary preferences.
                  </AlertDescription>
                </Alert>
              ) : (
                allergenData.dietaryRestrictions && allergenData.dietaryRestrictions.length === 0 && (
                  <Alert variant="default">
                    <AlertTitle>No Dietary Restrictions Detected</AlertTitle>
                    <AlertDescription>
                      This {allergenData.ingredient ? 'ingredient' : 'recipe'} appears compatible with common dietary preferences.
                    </AlertDescription>
                  </Alert>
                )
              )}
            </div>

            {/* For a single ingredient - Allergens */}
            {allergenData.ingredient && allergenData.allergens && allergenData.allergens.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">{allergenData.ingredient} contains allergens:</h4>
                <div className="flex flex-wrap gap-2">
                  {allergenData.allergens.map((allergen, index) => (
                    <Badge key={index} variant="destructive">{allergen}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* For a single ingredient - Dietary Restrictions */}
            {allergenData.ingredient && allergenData.dietaryRestrictions && allergenData.dietaryRestrictions.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="font-medium">{allergenData.ingredient} is not suitable for:</h4>
                <div className="flex flex-wrap gap-2">
                  {allergenData.dietaryRestrictions.map((diet, index) => (
                    <Badge key={index} variant="outline">{diet}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* For a recipe - Allergens */}
            {allergenData.allergenSummary && (
              <div className="space-y-4 mt-4">
                <h4 className="font-medium">Allergens Found:</h4>
                {Object.entries(allergenData.allergenSummary).map(([allergen, ingredients]) => (
                  <div key={allergen} className="border p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <Badge variant="destructive" className="mb-2">{allergen}</Badge>
                      <span className="text-xs text-muted-foreground">Found in {ingredients.length} ingredient(s)</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Found in: </span>
                      {ingredients.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {/* For a recipe - Dietary Restrictions */}
            {allergenData.dietaryRestrictionSummary && Object.keys(allergenData.dietaryRestrictionSummary).length > 0 && (
              <div className="space-y-4 mt-4">
                <h4 className="font-medium">Dietary Restrictions:</h4>
                {Object.entries(allergenData.dietaryRestrictionSummary).map(([diet, ingredients]) => (
                  <div key={diet} className="border p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="mb-2">{diet}</Badge>
                      <span className="text-xs text-muted-foreground">Found in {ingredients.length} ingredient(s)</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Problematic ingredients for {diet}: </span>
                      {ingredients.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        This tool checks for the 25 most common food allergens and 8 dietary restrictions (vegetarian, vegan, gluten-free, keto, paleo, halal, kosher, low-FODMAP), but is not a substitute for professional nutrition or medical advice.
      </CardFooter>
    </Card>
  );
}