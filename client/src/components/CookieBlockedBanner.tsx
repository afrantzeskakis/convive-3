import { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CookieBlockedBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const checkEnvironment = () => {
      try {
        setIsInIframe(window.self !== window.top);
      } catch (e) {
        setIsInIframe(true);
      }

      let cookiesBlocked = false;
      try {
        localStorage.setItem('cookie_test', 'test');
        localStorage.removeItem('cookie_test');
      } catch (e) {
        cookiesBlocked = true;
      }

      if (cookiesBlocked || isInIframe) {
        setShowBanner(true);
      }
    };

    checkEnvironment();
  }, [isInIframe]);

  const openInNewTab = () => {
    const url = window.location.href;
    window.open(url, '_blank');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 p-3">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-medium">Preview Mode:</span> Cookies are restricted. For full functionality, open in a new tab.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={openInNewTab}
            className="bg-white hover:bg-amber-100 border-amber-300 text-amber-800"
            data-testid="button-open-new-tab"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open in New Tab
          </Button>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-amber-600 hover:text-amber-800 p-1"
            data-testid="button-dismiss-cookie-banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
