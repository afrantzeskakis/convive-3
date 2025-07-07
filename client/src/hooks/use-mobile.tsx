import { useEffect, useState } from 'react';

interface MobileState {
  isMobile: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

export function useMobile(): MobileState {
  const [state, setState] = useState<MobileState>({
    isMobile: false,
    isStandalone: false,
    isIOS: false,
    isAndroid: false
  });

  useEffect(() => {
    const checkDevice = () => {
      // Check if device is mobile based on screen width
      const isMobileDevice = window.innerWidth < 768;
      
      // Check if it's in standalone mode (PWA installed)
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                (window.navigator as any).standalone || 
                                document.referrer.includes('android-app://');
      
      // Check platform
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isAndroidDevice = /Android/.test(navigator.userAgent);
      
      setState({
        isMobile: isMobileDevice,
        isStandalone: isInStandaloneMode,
        isIOS: isIOSDevice,
        isAndroid: isAndroidDevice
      });
    };

    // Check initially
    checkDevice();

    // Update on resize
    window.addEventListener('resize', checkDevice);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return state;
}