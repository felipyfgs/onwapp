package cache

import (
	"sync"
	"time"
)

// maxCacheSize is the maximum number of items in cache (auto-evicts oldest when exceeded)
const maxCacheSize = 10000

// Item represents a cached item with expiration
type Item struct {
	Value      interface{}
	Expiration time.Time
}

// IsExpired checks if the item has expired
func (i *Item) IsExpired() bool {
	return time.Now().After(i.Expiration)
}

// Cache is a simple in-memory cache with TTL and size limit
type Cache struct {
	items  map[string]*Item
	mu     sync.RWMutex
	ttl    time.Duration
	stopCh chan struct{}
}

// New creates a new cache with the specified TTL
func New(ttl time.Duration) *Cache {
	c := &Cache{
		items:  make(map[string]*Item),
		ttl:    ttl,
		stopCh: make(chan struct{}),
	}

	// Start cleanup goroutine
	go c.cleanup()

	return c
}

// Close stops the cleanup goroutine
func (c *Cache) Close() {
	close(c.stopCh)
}

// Get retrieves an item from cache
func (c *Cache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.items[key]
	if !exists || item.IsExpired() {
		return nil, false
	}

	return item.Value, true
}

// Set stores an item in cache with default TTL
func (c *Cache) Set(key string, value interface{}) {
	c.SetWithTTL(key, value, c.ttl)
}

// SetWithTTL stores an item with custom TTL
func (c *Cache) SetWithTTL(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = &Item{
		Value:      value,
		Expiration: time.Now().Add(ttl),
	}
}

// Delete removes an item from cache
func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

// DeletePrefix removes all items with matching prefix
func (c *Cache) DeletePrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.items {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			delete(c.items, key)
		}
	}
}

// Clear removes all items from cache
func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]*Item)
}

// cleanup periodically removes expired items
func (c *Cache) cleanup() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		c.mu.Lock()
		for key, item := range c.items {
			if item.IsExpired() {
				delete(c.items, key)
			}
		}
		c.mu.Unlock()
	}
}

// SessionCache provides session-scoped caching
type SessionCache struct {
	cache *Cache
}

// NewSessionCache creates a cache for session data (30s TTL)
func NewSessionCache() *SessionCache {
	return &SessionCache{
		cache: New(30 * time.Second),
	}
}

// GetGroups gets cached groups for a session
func (sc *SessionCache) GetGroups(sessionID string) (interface{}, bool) {
	return sc.cache.Get("groups:" + sessionID)
}

// SetGroups caches groups for a session
func (sc *SessionCache) SetGroups(sessionID string, groups interface{}) {
	sc.cache.Set("groups:"+sessionID, groups)
}

// InvalidateGroups removes groups cache for a session
func (sc *SessionCache) InvalidateGroups(sessionID string) {
	sc.cache.Delete("groups:" + sessionID)
}

// GetContacts gets cached contacts for a session
func (sc *SessionCache) GetContacts(sessionID string) (interface{}, bool) {
	return sc.cache.Get("contacts:" + sessionID)
}

// SetContacts caches contacts for a session
func (sc *SessionCache) SetContacts(sessionID string, contacts interface{}) {
	sc.cache.Set("contacts:"+sessionID, contacts)
}

// InvalidateContacts removes contacts cache for a session
func (sc *SessionCache) InvalidateContacts(sessionID string) {
	sc.cache.Delete("contacts:" + sessionID)
}

// InvalidateSession removes all cache for a session
func (sc *SessionCache) InvalidateSession(sessionID string) {
	sc.cache.DeletePrefix("groups:" + sessionID)
	sc.cache.DeletePrefix("contacts:" + sessionID)
}
