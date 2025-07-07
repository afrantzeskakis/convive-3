import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDarkMode, type Theme } from "../hooks/useDarkMode";
import { useHapticFeedback } from "../hooks/useHapticFeedback";
import { Sun, Moon, Utensils } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme, isDark, isRestaurant } = useDarkMode();
  const { triggerHaptic } = useHapticFeedback();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    triggerHaptic('light');
  };

  const themes = [
    {
      value: 'light' as Theme,
      label: 'Light',
      icon: <Sun className="h-4 w-4" />,
      description: 'Standard bright interface'
    },
    {
      value: 'dark' as Theme,
      label: 'Dark',
      icon: <Moon className="h-4 w-4" />,
      description: 'Dark interface for low light'
    },
    {
      value: 'restaurant' as Theme,
      label: 'Restaurant',
      icon: <Utensils className="h-4 w-4" />,
      description: 'Optimized for restaurant lighting'
    }
  ];

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Interface Theme</h3>
            <Badge variant="outline" className="text-xs">
              {isRestaurant ? 'Restaurant Mode' : isDark ? 'Dark Mode' : 'Light Mode'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {themes.map((themeOption) => (
              <Button
                key={themeOption.value}
                variant={theme === themeOption.value ? "default" : "outline"}
                onClick={() => handleThemeChange(themeOption.value)}
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center space-x-3 w-full">
                  {themeOption.icon}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{themeOption.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {themeOption.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          {isRestaurant && (
            <div className="text-xs text-muted-foreground p-2 bg-orange-50 rounded border border-orange-200">
              Restaurant mode optimizes the interface for low-light environments with 
              reduced brightness and enhanced contrast for better visibility during service.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}