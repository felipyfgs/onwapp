package service

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

type Cache[K comparable] struct {
	mu    sync.Mutex
	items map[K]time.Time
	ttl   time.Duration
}

func NewCache[K comparable](ttl time.Duration) *Cache[K] {
	return &Cache[K]{
		items: make(map[K]time.Time),
		ttl:   ttl,
	}
}

func (c *Cache[K]) TryAcquire(key K) bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.cleanupLocked()

	if _, exists := c.items[key]; exists {
		return false
	}
	c.items[key] = time.Now()
	return true
}

func (c *Cache[K]) Release(key K) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

func (c *Cache[K]) Mark(key K) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.cleanupLocked()
	c.items[key] = time.Now()
}

func (c *Cache[K]) Exists(key K) bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	t, exists := c.items[key]
	if !exists {
		return false
	}
	return time.Since(t) < c.ttl
}

func (c *Cache[K]) Clear(key K) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

func (c *Cache[K]) cleanupLocked() {
	now := time.Now()
	for k, t := range c.items {
		if now.Sub(t) > c.ttl {
			delete(c.items, k)
		}
	}
}

type PendingSentCache struct {
	cache *Cache[string]
}

func NewPendingSentCache() *PendingSentCache {
	return &PendingSentCache{
		cache: NewCache[string](2 * time.Minute),
	}
}

func (p *PendingSentCache) MarkPending(sessionID, chatJID string, cwMsgID int) {
	key := fmt.Sprintf("%s:%s:%d", sessionID, chatJID, cwMsgID)
	p.cache.Mark(key)
}

func (p *PendingSentCache) IsPendingByChat(sessionID, chatJID string) bool {
	p.cache.mu.Lock()
	defer p.cache.mu.Unlock()

	prefix := fmt.Sprintf("%s:%s:", sessionID, chatJID)
	now := time.Now()
	for k, t := range p.cache.items {
		if strings.HasPrefix(k, prefix) && now.Sub(t) < p.cache.ttl {
			return true
		}
	}
	return false
}

func (p *PendingSentCache) ClearPending(sessionID, chatJID string, cwMsgID int) {
	key := fmt.Sprintf("%s:%s:%d", sessionID, chatJID, cwMsgID)
	p.cache.Clear(key)
}

var (
	msgProcessingCache = NewCache[string](5 * time.Minute)

	pendingSentFromChatwoot = NewPendingSentCache()

	cwToWAProcessingCache = NewCache[string](2 * time.Minute)

	mediaHashCache = NewCache[string](2 * time.Minute)
)

func MarkPendingSentFromChatwoot(sessionID, chatJID string, cwMsgID int) {
	pendingSentFromChatwoot.MarkPending(sessionID, chatJID, cwMsgID)
}

func ClearPendingSentFromChatwoot(sessionID, chatJID string, cwMsgID int) {
	pendingSentFromChatwoot.ClearPending(sessionID, chatJID, cwMsgID)
}

func IsPendingSentFromChatwoot(sessionID, chatJID string) bool {
	return pendingSentFromChatwoot.IsPendingByChat(sessionID, chatJID)
}

func TryAcquireCWToWAProcessing(key string) bool {
	return cwToWAProcessingCache.TryAcquire(key)
}

func ReleaseCWToWAProcessing(key string) {
	cwToWAProcessingCache.Release(key)
}

func TryAcquireMsgProcessing(key string) bool {
	return msgProcessingCache.TryAcquire(key)
}

func ReleaseMsgProcessing(key string) {
	msgProcessingCache.Release(key)
}
