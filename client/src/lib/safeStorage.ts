const memoryStorage: Map<string, string> = new Map();

let isLocalStorageAvailable: boolean | null = null;

function checkLocalStorageAvailability(): boolean {
  if (isLocalStorageAvailable !== null) {
    return isLocalStorageAvailable;
  }
  
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    isLocalStorageAvailable = true;
    return true;
  } catch (e) {
    isLocalStorageAvailable = false;
    console.warn('localStorage is not available, falling back to in-memory storage');
    return false;
  }
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (checkLocalStorageAvailability()) {
        return localStorage.getItem(key);
      }
      return memoryStorage.get(key) ?? null;
    } catch (e) {
      console.warn(`Failed to get item "${key}" from storage:`, e);
      return memoryStorage.get(key) ?? null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      if (checkLocalStorageAvailability()) {
        localStorage.setItem(key, value);
      } else {
        memoryStorage.set(key, value);
      }
    } catch (e) {
      console.warn(`Failed to set item "${key}" in storage:`, e);
      memoryStorage.set(key, value);
    }
  },

  removeItem(key: string): void {
    try {
      if (checkLocalStorageAvailability()) {
        localStorage.removeItem(key);
      }
      memoryStorage.delete(key);
    } catch (e) {
      console.warn(`Failed to remove item "${key}" from storage:`, e);
      memoryStorage.delete(key);
    }
  },

  clear(): void {
    try {
      if (checkLocalStorageAvailability()) {
        localStorage.clear();
      }
      memoryStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
      memoryStorage.clear();
    }
  },

  key(index: number): string | null {
    try {
      if (checkLocalStorageAvailability()) {
        return localStorage.key(index);
      }
      const keys = Array.from(memoryStorage.keys());
      return keys[index] ?? null;
    } catch (e) {
      console.warn(`Failed to get key at index ${index}:`, e);
      const keys = Array.from(memoryStorage.keys());
      return keys[index] ?? null;
    }
  },

  get length(): number {
    try {
      if (checkLocalStorageAvailability()) {
        return localStorage.length;
      }
      return memoryStorage.size;
    } catch (e) {
      return memoryStorage.size;
    }
  }
};

export default safeStorage;
