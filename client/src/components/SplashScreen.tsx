import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Only show splash screen when in standalone mode (PWA installed)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone || 
                               document.referrer.includes('android-app://');
    
    if (!isInStandaloneMode) {
      setShow(false);
      return;
    }

    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    // Remember that the user has seen the splash screen
    localStorage.setItem('splash_screen_shown', 'true');

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-primary z-50 flex flex-col items-center justify-center text-white">
      <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-primary text-5xl font-bold mb-4">
        C
      </div>
      <h1 className="text-2xl font-bold mb-2">Convive</h1>
      <p className="text-white/80 text-sm">Curated Social Dining</p>
    </div>
  );
}