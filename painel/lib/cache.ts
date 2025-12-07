interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface SmartCacheOptions {
  persist?: string      // localStorage key for persistence
  defaultTtl: number    // default TTL in milliseconds
  staleThreshold?: number // percentage (0-1) of TTL when data is considered stale
}

export class SmartCache<T> {
  private memory = new Map<string, CacheEntry<T>>()
  private storageKey?: string
  private defaultTtl: number
  private staleThreshold: number

  constructor(options: SmartCacheOptions) {
    this.storageKey = options.persist
    this.defaultTtl = options.defaultTtl
    this.staleThreshold = options.staleThreshold ?? 0.75 // 75% of TTL by default
    
    // Load from localStorage on init (client-side only)
    if (typeof window !== 'undefined' && this.storageKey) {
      this.loadFromStorage()
    }
  }

  private loadFromStorage(): void {
    if (!this.storageKey) return
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const entries: [string, CacheEntry<T>][] = JSON.parse(stored)
        const now = Date.now()
        
        // Only load non-expired entries
        for (const [key, entry] of entries) {
          if (now - entry.timestamp < entry.ttl) {
            this.memory.set(key, entry)
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage(): void {
    if (!this.storageKey || typeof window === 'undefined') return
    
    try {
      const entries = Array.from(this.memory.entries())
      localStorage.setItem(this.storageKey, JSON.stringify(entries))
    } catch {
      // Ignore storage errors (quota exceeded, etc)
    }
  }

  get(key: string): T | undefined {
    const entry = this.memory.get(key)
    if (!entry) return undefined
    
    // Check if expired
    const now = Date.now()
    if (now - entry.timestamp >= entry.ttl) {
      this.memory.delete(key)
      this.saveToStorage()
      return undefined
    }
    
    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  isStale(key: string): boolean {
    const entry = this.memory.get(key)
    if (!entry) return true
    
    const now = Date.now()
    const age = now - entry.timestamp
    const staleAge = entry.ttl * this.staleThreshold
    
    return age >= staleAge
  }

  set(key: string, data: T, ttl?: number): void {
    this.memory.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl
    })
    this.saveToStorage()
  }

  invalidate(key: string): void {
    this.memory.delete(key)
    this.saveToStorage()
  }

  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    for (const key of this.memory.keys()) {
      if (regex.test(key)) {
        this.memory.delete(key)
      }
    }
    this.saveToStorage()
  }

  clear(): void {
    this.memory.clear()
    if (this.storageKey && typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
  }

  size(): number {
    return this.memory.size
  }
}

// Pre-configured caches for the application

// Avatar cache - 1 hour TTL, persisted to localStorage
export const avatarCache = new SmartCache<string | null>({
  persist: 'onwapp:avatars',
  defaultTtl: 60 * 60 * 1000 // 1 hour
})

// Group avatar cache - 30 min TTL (groups change more often)
export const groupAvatarCache = new SmartCache<string | null>({
  persist: 'onwapp:group-avatars',
  defaultTtl: 30 * 60 * 1000 // 30 minutes
})

// Contact name cache - 1 hour TTL, persisted
export const contactNameCache = new SmartCache<string>({
  persist: 'onwapp:contact-names',
  defaultTtl: 60 * 60 * 1000 // 1 hour
})

// Group name cache - 15 min TTL, memory only (changes more often)
export const groupNameCache = new SmartCache<string>({
  defaultTtl: 15 * 60 * 1000 // 15 minutes
})

// Profile cache - 15 min TTL, memory only
export const profileCache = new SmartCache<{ phone: string; avatar: string | null }>({
  defaultTtl: 15 * 60 * 1000 // 15 minutes
})

// Utility to clear all caches (useful for logout/session change)
export function clearAllCaches(): void {
  avatarCache.clear()
  groupAvatarCache.clear()
  contactNameCache.clear()
  groupNameCache.clear()
  profileCache.clear()
}
