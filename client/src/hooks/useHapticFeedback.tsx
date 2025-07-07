import { useCallback } from "react";

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface UseHapticFeedbackReturn {
  triggerHaptic: (type: HapticType) => void;
  isSupported: boolean;
}

export function useHapticFeedback(): UseHapticFeedbackReturn {
  const isSupported = typeof window !== 'undefined' && 
    'navigator' in window && 
    'vibrate' in navigator;

  const triggerHaptic = useCallback((type: HapticType) => {
    if (!isSupported) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      warning: [20, 100, 20],
      error: [50, 100, 50, 100, 50]
    };

    const pattern = patterns[type];
    if (pattern && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [isSupported]);

  return {
    triggerHaptic,
    isSupported
  };
}