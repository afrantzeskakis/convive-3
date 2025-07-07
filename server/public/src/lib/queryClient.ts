import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { addItem, getAllItems, removeItem, OFFLINE_STORES } from "./indexedDB";

interface OfflineRequest {
  id?: string;
  method: string;
  url: string;
  data?: unknown;
  timestamp: number;
}

// Offline request store name
const OFFLINE_REQUEST_STORE = 'offline-requests';

/**
 * Processes request errors and handles offline behavior
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Enhanced API request function with offline support
 * - Attempts online request first
 * - Falls back to storing request in IndexedDB for later sync
 * - Returns proper error for non-network related failures
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // If the error is a network error (offline), queue the request for later
    if (!navigator.onLine || (error instanceof TypeError && error.message.includes('network'))) {
      // Only queue certain types of requests - primarily POST/PATCH requests that can be safely retried
      // Don't queue DELETE requests as they might be dangerous to replay
      if (method === 'POST' || method === 'PATCH') {
        console.log('Storing request for offline sync:', { method, url });
        
        await addItem<OfflineRequest>(OFFLINE_REQUEST_STORE, {
          method,
          url,
          data,
          timestamp: Date.now()
        });
        
        // Register for sync when back online if supported
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready;
            // TypeScript doesn't recognize the sync property, but it exists in modern browsers
            // @ts-ignore
            if (registration.sync) {
              // @ts-ignore
              await registration.sync.register('sync-requests');
            }
          } catch (err) {
            console.warn('Background sync registration failed:', err);
          }
        }
        
        // Return a fake successful response for better UX
        const mockResponse = new Response(JSON.stringify({ 
          success: true, 
          offline: true,
          message: 'This request was saved for sync when back online' 
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        });
        
        return mockResponse;
      }
    }
    
    // Re-throw for other error types or if we can't handle this request type offline
    throw error;
  }
}

/**
 * Get any pending offline requests for synchronization
 */
export async function getOfflineRequests(): Promise<OfflineRequest[]> {
  try {
    return await getAllItems<OfflineRequest>(OFFLINE_REQUEST_STORE);
  } catch (error) {
    console.error('Failed to get offline requests:', error);
    return [];
  }
}

/**
 * Synchronize offline requests when online
 */
export async function syncOfflineRequests(): Promise<void> {
  if (!navigator.onLine) return;

  const offlineRequests = await getOfflineRequests();
  
  for (const request of offlineRequests) {
    try {
      await fetch(request.url, {
        method: request.method,
        headers: request.data ? { "Content-Type": "application/json" } : {},
        body: request.data ? JSON.stringify(request.data) : undefined,
        credentials: "include",
      });
      
      // Remove the request after successful sync
      if (request.id) {
        await removeItem(OFFLINE_REQUEST_STORE, request.id);
      }
    } catch (error) {
      console.error('Failed to sync offline request:', error);
      // We don't remove failed requests to retry them later
    }
  }
}

// Listen for online status changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online, syncing requests...');
    syncOfflineRequests();
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Enhanced Query Function with offline cache support
 */
export const getQueryFn = <T>({
  on401 = "throw" as UnauthorizedBehavior,
  offlineStoreKey = '',
} = {}): QueryFunction<T> => {
  return async ({ queryKey }) => {
    try {
      // First try to get from network
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (on401 === "returnNull" && res.status === 401) {
        return null as unknown as T;
      }

      await throwIfResNotOk(res);
      const data = await res.json() as T;
      
      // If we have a store key, cache the successful response
      if (offlineStoreKey && data) {
        try {
          await addItem(offlineStoreKey, data);
        } catch (e) {
          console.warn('Failed to cache data for offline use:', e);
        }
      }
      
      return data;
    } catch (error) {
      // If we're offline and have a store key, try to serve from cache
      if (!navigator.onLine && offlineStoreKey) {
        try {
          const cachedData = await getAllItems<T>(offlineStoreKey);
          if (cachedData && cachedData.length > 0) {
            console.log('Serving data from offline cache:', offlineStoreKey);
            return Array.isArray(cachedData) ? cachedData[0] : cachedData;
          }
        } catch (cacheError) {
          console.error('Failed to get cached data:', cacheError);
        }
      }
      
      // If we reach here, we couldn't serve from cache
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
