import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronLeft, 
  Wine, 
  Coffee, 
  Users, 
  CheckCircle2,
  X,
  Lightbulb,
  Settings,
  Upload
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTutorialProps {
  userRole: 'super_admin' | 'admin' | 'restaurant_admin';
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTutorial({ userRole, onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const getStepsForRole = (role: string): OnboardingStep[] => {
    const commonSteps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to Convive',
        description: 'Your intelligent restaurant management platform',
        icon: <Settings className="h-6 w-6" />,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Convive combines AI-powered wine recommendations, culinary knowledge, 
              and recipe analysis to enhance your restaurant operations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Wine className="h-4 w-4 text-purple-600" />
                <span className="text-sm">AI Wine Sommelier</span>
              </div>
              <div className="flex items-center space-x-2">
                <Coffee className="h-4 w-4 text-brown-600" />
                <span className="text-sm">Culinary Knowledge Engine</span>
              </div>
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Recipe Analysis Tool</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm">Staff Training Mode</span>
              </div>
            </div>
          </div>
        )
      }
    ];

    if (role === 'super_admin' || role === 'admin') {
      return [
        ...commonSteps,
        {
          id: 'wine-database',
          title: 'Wine Database Management',
          description: 'Upload and manage restaurant wine lists',
          icon: <Wine className="h-6 w-6" />,
          content: (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload wine lists in text format to build your restaurant's wine database. 
                The system will automatically verify wines through the Vivino API and 
                generate professional descriptions.
              </p>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Key Features:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Automatic wine verification and enrichment</li>
                  <li>• Professional tasting notes generation</li>
                  <li>• Restaurant-specific wine associations</li>
                  <li>• Monthly sync for offline operation</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: 'recipe-analysis',
          title: 'Recipe Analysis System',
          description: 'Analyze recipes for allergens and nutritional content',
          icon: <Upload className="h-6 w-6" />,
          content: (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload recipe text files to get comprehensive analysis including 
                allergen identification, nutritional information, and culinary term definitions.
              </p>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Analysis Includes:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Traffic light allergen system (Red/Yellow/Green)</li>
                  <li>• Nutritional breakdown with USDA data</li>
                  <li>• Culinary term identification and definitions</li>
                  <li>• Restaurant-specific content customization</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: 'culinary-knowledge',
          title: 'Culinary Knowledge Engine',
          description: 'Restaurant-specific culinary education and training',
          icon: <Coffee className="h-6 w-6" />,
          content: (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Access comprehensive culinary knowledge tailored to your restaurant's 
                cuisine style. Features include term relationships, seasonal adaptations, 
                and staff training content.
              </p>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Advanced Features:</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Cross-term relationship mapping</li>
                  <li>• Seasonal content relevance</li>
                  <li>• Multi-term combination explanations</li>
                  <li>• Interactive carousel interface</li>
                </ul>
              </div>
            </div>
          )
        }
      ];
    }

    return [
      ...commonSteps,
      {
        id: 'wine-recommendations',
        title: 'AI Wine Sommelier',
        description: 'Provide intelligent wine recommendations to guests',
        icon: <Wine className="h-6 w-6" />,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use natural language descriptions from guests to get AI-powered wine 
              recommendations with detailed professional descriptors and match reasoning.
            </p>
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-900 mb-2">Guest Experience:</h4>
              <ul className="text-sm text-indigo-800 space-y-1">
                <li>• Natural language wine preferences</li>
                <li>• Detailed match scoring (up to 95%)</li>
                <li>• Professional wine descriptors</li>
                <li>• Works completely offline</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'staff-training',
        title: 'Staff Training Mode',
        description: 'Access educational content for team development',
        icon: <Users className="h-6 w-6" />,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide your staff with role-specific training content, culinary knowledge, 
              and wine education tailored to your restaurant's offerings.
            </p>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-2">Training Content:</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Role-specific content (server, sommelier, chef)</li>
                <li>• Wine knowledge and pairing guidance</li>
                <li>• Culinary technique explanations</li>
                <li>• Interactive learning modules</li>
              </ul>
            </div>
          </div>
        )
      }
    ];
  };

  const steps = getStepsForRole(userRole);

  const nextStep = () => {
    const prevArray = Array.from(completedSteps);
    setCompletedSteps(new Set([...prevArray, steps[currentStep].id]));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {steps[currentStep].icon}
              <div>
                <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {steps[currentStep].content}

          {steps[currentStep].action && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Try it now:</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={steps[currentStep].action!.onClick}
                  className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {steps[currentStep].action!.label}
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>

        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
                Skip tutorial
              </Button>
              <Button onClick={nextStep} className="flex items-center space-x-2">
                <span>{currentStep === steps.length - 1 ? 'Complete' : 'Next'}</span>
                {currentStep === steps.length - 1 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}