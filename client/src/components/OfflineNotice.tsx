import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine);

    // Event listeners for online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-yellow-500 text-white p-2">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff size={18} />
        <p className="text-sm font-medium">You're offline. Some features may be limited.</p>
      </div>
    </div>
  );
}