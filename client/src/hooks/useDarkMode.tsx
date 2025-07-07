import { useState, useEffect } from "react";

export type Theme = 'light' | 'dark' | 'restaurant';

interface UseDarkModeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isRestaurant: boolean;
}

export function useDarkMode(): UseDarkModeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('convive-theme');
      if (saved && ['light', 'dark', 'restaurant'].includes(saved)) {
        return saved as Theme;
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'restaurant');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Apply restaurant-specific CSS variables for low-light environments
    if (theme === 'restaurant') {
      root.style.setProperty('--background', '12 8% 8%'); // Very dark background
      root.style.setProperty('--foreground', '210 20% 90%'); // Light text
      root.style.setProperty('--card', '12 8% 12%'); // Dark cards
      root.style.setProperty('--card-foreground', '210 20% 90%');
      root.style.setProperty('--popover', '12 8% 12%');
      root.style.setProperty('--popover-foreground', '210 20% 90%');
      root.style.setProperty('--primary', '210 25% 35%'); // Muted primary
      root.style.setProperty('--primary-foreground', '210 20% 95%');
      root.style.setProperty('--secondary', '12 8% 18%'); // Dark secondary
      root.style.setProperty('--secondary-foreground', '210 20% 85%');
      root.style.setProperty('--muted', '12 8% 16%');
      root.style.setProperty('--muted-foreground', '210 10% 70%');
      root.style.setProperty('--accent', '12 8% 18%');
      root.style.setProperty('--accent-foreground', '210 20% 85%');
      root.style.setProperty('--border', '12 8% 20%');
      root.style.setProperty('--input', '12 8% 20%');
      root.style.setProperty('--ring', '210 25% 40%');
    } else {
      // Reset to default theme variables for light/dark
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--popover');
      root.style.removeProperty('--popover-foreground');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--secondary-foreground');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--border');
      root.style.removeProperty('--input');
      root.style.removeProperty('--ring');
    }
    
    // Save to localStorage
    localStorage.setItem('convive-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return {
    theme,
    setTheme,
    isDark: theme === 'dark' || theme === 'restaurant',
    isRestaurant: theme === 'restaurant'
  };
}