/**
 * IndexedDB Service for Convive PWA
 * 
 * This service provides a simple interface for storing and retrieving data from IndexedDB,
 * which is essential for offline functionality in PWAs.
 */

const DB_NAME = 'convive-db';
const DB_VERSION = 1;
const STORES = {
  MESSAGES: 'offline-messages',
  USER_DATA: 'user-data',
  RESTAURANT_DATA: 'restaurant-data',
  MEETUP_DATA: 'meetup-data'
};

/**
 * Opens a connection to the IndexedDB database
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messagesStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id', autoIncrement: true });
        messagesStore.createIndex('meetupId', 'meetupId', { unique: false });
        messagesStore.createIndex('status', 'status', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.RESTAURANT_DATA)) {
        const restaurantStore = db.createObjectStore(STORES.RESTAURANT_DATA, { keyPath: 'id' });
        restaurantStore.createIndex('isFeatured', 'isFeatured', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.MEETUP_DATA)) {
        const meetupStore = db.createObjectStore(STORES.MEETUP_DATA, { keyPath: 'id' });
        meetupStore.createIndex('status', 'status', { unique: false });
        meetupStore.createIndex('date', 'date', { unique: false });
      }
    };
  });
}

/**
 * Adds an item to the specified store
 */
export async function addItem<T>(storeName: string, item: T): Promise<number | string> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);
    
    request.onsuccess = () => {
      // Cast the result to handle TypeScript's strict type checking with IDBValidKey
      const resultId = typeof request.result === 'number' || typeof request.result === 'string' 
        ? request.result 
        : String(request.result);
      resolve(resultId);
    };
    
    request.onerror = () => {
      console.error(`Error adding item to ${storeName}:`, request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Updates an item in the specified store
 */
export async function updateItem<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      console.error(`Error updating item in ${storeName}:`, request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets an item from the specified store by its ID
 */
export async function getItem<T>(storeName: string, id: number | string): Promise<T | undefined> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    // Use a compatible keypath - TypeScript is being strict about IDBValidKey
    const request = store.get(typeof id === 'number' ? id : String(id));
    
    request.onsuccess = () => {
      resolve(request.result as T);
    };
    
    request.onerror = () => {
      console.error(`Error getting item from ${storeName}:`, request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets all items from the specified store
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result as T[]);
    };
    
    request.onerror = () => {
      console.error(`Error getting all items from ${storeName}:`, request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Gets items from a store by a specific index
 */
export async function getItemsByIndex<T>(
  storeName: string, 
  indexName: string, 
  value: any
): Promise<T[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    
    request.onsuccess = () => {
      resolve(request.result as T[]);
    };
    
    request.onerror = () => {
      console.error(`Error getting items by index from ${storeName}:`, request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Removes an item from the specified store by its ID
 */
export async function removeItem(storeName: string, id: number | string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      console.error(`Error removing item from ${storeName}:`, request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Clear all data from a specific store
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      console.error(`Error clearing store ${storeName}:`, request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Export store names as constants for use throughout the app
export const OFFLINE_STORES = STORES;