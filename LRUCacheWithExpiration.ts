    import { getLogger } from './logger'; 

    type CacheEntry = {
        key: string;
        url: string;
        lastAccessed: number; // Timestamp when the entry was last accessed
    };
    
  class Mutex {
    private queue: Array<() => void> = [];
    private locked: boolean = false;
  
    // Locks the mutex until released
    async lock(): Promise<void> {
      if (this.locked) {
        await new Promise<void>((resolve) => this.queue.push(resolve));
      }
      this.locked = true;
    }
  
    // Releases the lock and runs the next function in the queue
    release(): void {
      if (!this.locked) {
        throw new Error("Mutex is not locked");
      }
  
      this.locked = false;
  
      if (this.queue.length > 0) {
        const nextResolve = this.queue.shift();
        if (nextResolve) nextResolve();
      }
    }
  }
  
  class LRUCacheWithExpiration {
    private cache: Map<string, CacheEntry>;
    private maxSize: number;
    private expirationTime: number; // Time in milliseconds (e.g., 2 minutes)
    private mutex: Mutex;
    private cleanupInterval: NodeJS.Timeout; // Store the interval reference
    private logger = getLogger('CACHE');

    constructor(maxSize: number, expirationTime: number = 2 * 60 * 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.expirationTime = expirationTime;
        this.mutex = new Mutex();

        // Automatically clean expired entries every 5 minutes
        // this.cleanupInterval = setInterval(() => this.clearExpired(), 5 * 60 * 1000);

        // Automatically write to the logs all cache entries every 1 minute
        setInterval(async () => {
            // add lock to prevent 
            await this.mutex.lock();
            try {
                this.cache.forEach((entry, key) => {
                    this.logger.trace(`Key: ${key}, URL: ${entry.url}, Last Accessed: ${entry.lastAccessed}`);
                });
            }
            finally {
                this.mutex.release();
            }
        }, 60 * 1000);
    }
  
    // Method to get an item from the cache (thread-safe)
    async get(key: string): Promise<string | null> {
      await this.mutex.lock(); // Ensure thread-safety for this operation
  
      try {
        const currentTime = Date.now();
        const cacheEntry = this.cache.get(key);
  
        if (cacheEntry) {
          // Check if the cache entry is expired
          if (currentTime - cacheEntry.lastAccessed > this.expirationTime) {
            this.cache.delete(key); // Evict the expired item
            return null;
          }
  
          // Update the last accessed time
          cacheEntry.lastAccessed = currentTime;
  
          // Move the accessed item to the front to mark it as recently used
          this.cache.delete(key); // Remove from map
          this.cache.set(key, cacheEntry); // Add to the end
  
          return cacheEntry.url;
        }
  
        return null;
      } finally {
        this.mutex.release(); // Release the lock
      }
    }
  
    // Method to set an item in the cache (thread-safe)
    async set(key: string, url: string): Promise<void> {
      await this.mutex.lock(); // Ensure thread-safety for this operation
  
      try {
        const currentTime = Date.now();
  
        // If the cache is full, evict the least recently used (LRU) item
        if (this.cache.size >= this.maxSize) {
          const leastRecentlyUsedKey = this.cache.keys().next().value; // Get the first key (LRU)
          this.cache.delete(leastRecentlyUsedKey); // Evict the LRU item
        }
  
        // Add the new entry to the cache
        this.cache.set(key, { key, url, lastAccessed: currentTime });
      } finally {
        this.mutex.release(); // Release the lock
      }
    }
  
    // Optional: Method to clear expired items periodically (thread-safe)
    async clearExpired(): Promise<void> {
      await this.mutex.lock(); // Ensure thread-safety for this operation
  
      try {
        const currentTime = Date.now();
  
        this.cache.forEach((entry, key) => {
          if (currentTime - entry.lastAccessed > this.expirationTime) {
            this.cache.delete(key); // Evict expired item
          }
        });
      } finally {
        this.mutex.release(); // Release the lock
      }
    }
  
    // Optional: Method to get the current cache size
    size(): number {
      return this.cache.size;
    }

    stopAutoCleanup(): void {
        clearInterval(this.cleanupInterval);
    }

  }

  export { LRUCacheWithExpiration };