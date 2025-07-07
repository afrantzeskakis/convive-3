import { useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDevice(): {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
} {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    // Check for touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // Detect screen size and set device type
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setDeviceType('mobile');
      } else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // iPad detection (more specific)
    const isIPad = () => {
      const ua = navigator.userAgent;
      if (/iPad/i.test(ua)) {
        return true;
      }
      
      // iPad on iOS 13 detection
      if (
        /Macintosh/i.test(ua) && 
        navigator.maxTouchPoints && 
        navigator.maxTouchPoints > 2
      ) {
        return true;
      }
      
      return false;
    };

    // Set initial device type
    handleResize();
    
    // Force tablet mode for iPad
    if (isIPad()) {
      setDeviceType('tablet');
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isTouchDevice
  };
}

// Simplified hook just for mobile detection
export function useIsMobile(): boolean {
  const { isMobile } = useDevice();
  return isMobile;
}

// Simplified hook just for tablet detection
export function useIsTablet(): boolean {
  const { isTablet } = useDevice();
  return isTablet;
}

// Simplified hook just for desktop detection
export function useIsDesktop(): boolean {
  const { isDesktop } = useDevice();
  return isDesktop;
}