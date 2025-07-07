import { useEffect, useState } from 'react';
import { useMobile } from '@/hooks/use-mobile';

export default function PwaStatus() {
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'checking' | 'supported' | 'not-supported' | 'registered' | 'failed'>('checking');
  const [manifestStatus, setManifestStatus] = useState<'checking' | 'found' | 'not-found'>('checking');
  const { isStandalone, isIOS, isAndroid, isMobile } = useMobile();

  useEffect(() => {
    // Check service worker support
    if ('serviceWorker' in navigator) {
      // Check if service worker is already registered
      navigator.serviceWorker.getRegistration()
        .then((registration) => {
          if (registration) {
            setServiceWorkerStatus('registered');
          } else {
            setServiceWorkerStatus('supported');
          }
        })
        .catch(() => {
          setServiceWorkerStatus('failed');
        });
    } else {
      setServiceWorkerStatus('not-supported');
    }

    // Check manifest
    fetch('/manifest.json')
      .then(response => {
        if (response.ok) {
          setManifestStatus('found');
        } else {
          setManifestStatus('not-found');
        }
      })
      .catch(() => {
        setManifestStatus('not-found');
      });
  }, []);

  return (
    <div className="p-4 mt-4 rounded-lg border border-gray-200 bg-gray-50 text-sm">
      <h3 className="text-lg font-semibold mb-2">PWA Status</h3>
      <ul className="space-y-2">
        <li>
          <span className="font-medium">Service Worker: </span>
          {serviceWorkerStatus === 'checking' && 'Checking...'}
          {serviceWorkerStatus === 'supported' && <span className="text-yellow-600">Supported but not registered</span>}
          {serviceWorkerStatus === 'not-supported' && <span className="text-red-600">Not supported in this browser</span>}
          {serviceWorkerStatus === 'registered' && <span className="text-green-600">Registered ✓</span>}
          {serviceWorkerStatus === 'failed' && <span className="text-red-600">Failed to check registration</span>}
        </li>
        <li>
          <span className="font-medium">Manifest: </span>
          {manifestStatus === 'checking' && 'Checking...'}
          {manifestStatus === 'found' && <span className="text-green-600">Found ✓</span>}
          {manifestStatus === 'not-found' && <span className="text-red-600">Not found</span>}
        </li>
        <li>
          <span className="font-medium">Running as installed app: </span>
          {isStandalone ? <span className="text-green-600">Yes ✓</span> : <span className="text-gray-600">No</span>}
        </li>
        <li>
          <span className="font-medium">Platform: </span>
          {isIOS && 'iOS'}
          {isAndroid && 'Android'}
          {!isIOS && !isAndroid && 'Other'}
          {isMobile ? ' (Mobile)' : ' (Desktop)'}
        </li>
      </ul>
    </div>
  );
}