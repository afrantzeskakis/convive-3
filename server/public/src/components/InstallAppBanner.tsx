import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function InstallAppBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if user is on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Check if already in standalone mode (app is installed)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone || 
                               document.referrer.includes('android-app://');
    
    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandaloneMode);
    
    // Only show banner if on iOS and not already installed
    // Also check if user has dismissed it before
    const bannerDismissed = localStorage.getItem('pwa_banner_dismissed');
    setShowBanner(isIOSDevice && !isInStandaloneMode && bannerDismissed !== 'true');
  }, []);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-[70px] inset-x-0 z-50 p-4 md:hidden">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 mx-auto max-w-md">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg mr-3">
              C
            </div>
            <div>
              <h3 className="font-medium">Install Convive App</h3>
              <p className="text-sm text-gray-600">Add to home screen for the best experience</p>
            </div>
          </div>
          <button onClick={dismissBanner} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        {isIOS && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">To install:</p>
            <ol className="text-sm text-gray-600 list-decimal pl-5">
              <li>Tap the Share icon<span className="inline-block ml-1 transform rotate-90">⤴</span></li>
              <li>Scroll and tap <b>Add to Home Screen</b></li>
              <li>Tap <b>Add</b> in the top right</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}