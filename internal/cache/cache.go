package cache

import (
	"sync"
	"time"
)

const maxCacheSize = 10000

type Item struct {
	Value      interface{}
	Expiration time.Time
}

func (i *Item) IsExpired() bool {
	return time.Now().After(i.Expiration)
}

type Cache struct {
	items  map[string]*Item
	mu     sync.RWMutex
	ttl    time.Duration
	stopCh chan struct{}
}

func New(ttl time.Duration) *Cache {
	c := &Cache{
		items:  make(map[string]*Item),
		ttl:    ttl,
		stopCh: make(chan struct{}),
	}

	go c.cleanup()

	return c
}

func (c *Cache) Close() {
	close(c.stopCh)
}

func (c *Cache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.items[key]
	if !exists || item.IsExpired() {
		return nil, false
	}

	return item.Value, true
}

func (c *Cache) Set(key string, value interface{}) {
	c.SetWithTTL(key, value, c.ttl)
}

func (c *Cache) SetWithTTL(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if len(c.items) >= maxCacheSize {
		c.evictOldest(maxCacheSize / 10)
	}

	c.items[key] = &Item{
		Value:      value,
		Expiration: time.Now().Add(ttl),
	}
}

func (c *Cache) evictOldest(n int) {
	count := 0
	now := time.Now()

	for key, item := range c.items {
		if count >= n {
			return
		}
		if now.After(item.Expiration) {
			delete(c.items, key)
			count++
		}
	}

	for key := range c.items {
		if count >= n {
			return
		}
		delete(c.items, key)
		count++
	}
}

func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

func (c *Cache) DeletePrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.items {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			delete(c.items, key)
		}
	}
}

func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]*Item)
}

func (c *Cache) cleanup() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.mu.Lock()
			now := time.Now()
			for key, item := range c.items {
				if now.After(item.Expiration) {
					delete(c.items, key)
				}
			}
			c.mu.Unlock()
		case <-c.stopCh:
			return
		}
	}
}

type SessionCache struct {
	cache *Cache
}

func NewSessionCache() *SessionCache {
	return &SessionCache{
		cache: New(30 * time.Second),
	}
}

func (sc *SessionCache) GetGroups(sessionID string) (interface{}, bool) {
	return sc.cache.Get("groups:" + sessionID)
}

func (sc *SessionCache) SetGroups(sessionID string, groups interface{}) {
	sc.cache.Set("groups:"+sessionID, groups)
}

func (sc *SessionCache) InvalidateGroups(sessionID string) {
	sc.cache.Delete("groups:" + sessionID)
}

func (sc *SessionCache) GetContacts(sessionID string) (interface{}, bool) {
	return sc.cache.Get("contacts:" + sessionID)
}

func (sc *SessionCache) SetContacts(sessionID string, contacts interface{}) {
	sc.cache.Set("contacts:"+sessionID, contacts)
}

func (sc *SessionCache) InvalidateContacts(sessionID string) {
	sc.cache.Delete("contacts:" + sessionID)
}

func (sc *SessionCache) InvalidateSession(sessionID string) {
	sc.cache.DeletePrefix("groups:" + sessionID)
	sc.cache.DeletePrefix("contacts:" + sessionID)
}
