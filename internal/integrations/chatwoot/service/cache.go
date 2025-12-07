package service

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

// Cache is a generic thread-safe cache with TTL-based cleanup.
// It provides acquire/release semantics for processing locks and
// mark/check/clear semantics for pending operations.
type Cache[K comparable] struct {
	mu    sync.Mutex
	items map[K]time.Time
	ttl   time.Duration
}

// NewCache creates a new cache with the specified TTL for entries.
func NewCache[K comparable](ttl time.Duration) *Cache[K] {
	return &Cache[K]{
		items: make(map[K]time.Time),
		ttl:   ttl,
	}
}

// TryAcquire attempts to acquire a lock for the given key.
// Returns true if acquired, false if the key is already held.
// Automatically cleans up expired entries.
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

// Release removes the lock for the given key.
func (c *Cache[K]) Release(key K) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

// Mark adds or updates an entry in the cache.
// Automatically cleans up expired entries.
func (c *Cache[K]) Mark(key K) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.cleanupLocked()
	c.items[key] = time.Now()
}

// Exists checks if a key exists and is not expired.
func (c *Cache[K]) Exists(key K) bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	t, exists := c.items[key]
	if !exists {
		return false
	}
	return time.Since(t) < c.ttl
}

// Clear removes a specific key from the cache.
func (c *Cache[K]) Clear(key K) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.items, key)
}

// cleanupLocked removes expired entries. Must be called with lock held.
func (c *Cache[K]) cleanupLocked() {
	now := time.Now()
	for k, t := range c.items {
		if now.Sub(t) > c.ttl {
			delete(c.items, k)
		}
	}
}

// PendingSentCache manages messages being sent from Chatwoot to WhatsApp.
// It prevents the event handler from reprocessing messages we just sent.
type PendingSentCache struct {
	cache *Cache[string]
}

// NewPendingSentCache creates a new pending sent cache with 2-minute TTL.
func NewPendingSentCache() *PendingSentCache {
	return &PendingSentCache{
		cache: NewCache[string](2 * time.Minute),
	}
}

// MarkPending marks a message as being sent from Chatwoot.
func (p *PendingSentCache) MarkPending(sessionID, chatJID string, cwMsgID int) {
	key := fmt.Sprintf("%s:%s:%d", sessionID, chatJID, cwMsgID)
	p.cache.Mark(key)
}

// IsPendingByChat checks if there's any pending message for this session/chat.
// Used when we don't have cwMsgId (from WhatsApp event).
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

// ClearPending removes a pending message marker.
func (p *PendingSentCache) ClearPending(sessionID, chatJID string, cwMsgID int) {
	key := fmt.Sprintf("%s:%s:%d", sessionID, chatJID, cwMsgID)
	p.cache.Clear(key)
}

// Global cache instances with appropriate TTLs.
// These are package-level to maintain compatibility with existing code.
var (
	// msgProcessingCache prevents duplicate message processing (5 minute TTL)
	// Extended from 30s to handle large video uploads that may take longer
	msgProcessingCache = NewCache[string](5 * time.Minute)

	// pendingSentFromChatwoot tracks messages being sent from Chatwoot to WhatsApp (2 minute TTL)
	pendingSentFromChatwoot = NewPendingSentCache()

	// cwToWAProcessingCache prevents duplicate CW->WA message processing (2 minute TTL)
	// Used when NATS redelivers messages due to slow ACK (e.g., sending multiple large files)
	cwToWAProcessingCache = NewCache[string](2 * time.Minute)

	// mediaHashCache prevents duplicate media processing for the same file
	// Key: sessionId:chatJid:sha256hash, used to detect LID vs phone number duplicates
	mediaHashCache = NewCache[string](2 * time.Minute)
)

// MarkPendingSentFromChatwoot marks a message as being sent from Chatwoot webhook.
// Call this BEFORE sending to WhatsApp to prevent duplicate processing.
func MarkPendingSentFromChatwoot(sessionID, chatJID string, cwMsgID int) {
	pendingSentFromChatwoot.MarkPending(sessionID, chatJID, cwMsgID)
}

// ClearPendingSentFromChatwoot removes the pending marker after message is saved.
func ClearPendingSentFromChatwoot(sessionID, chatJID string, cwMsgID int) {
	pendingSentFromChatwoot.ClearPending(sessionID, chatJID, cwMsgID)
}

// IsPendingSentFromChatwoot checks if there's a pending send for this chat.
func IsPendingSentFromChatwoot(sessionID, chatJID string) bool {
	return pendingSentFromChatwoot.IsPendingByChat(sessionID, chatJID)
}

// TryAcquireCWToWAProcessing attempts to acquire processing lock for a CW->WA message.
func TryAcquireCWToWAProcessing(key string) bool {
	return cwToWAProcessingCache.TryAcquire(key)
}

// ReleaseCWToWAProcessing releases the processing lock.
func ReleaseCWToWAProcessing(key string) {
	cwToWAProcessingCache.Release(key)
}

// TryAcquireMsgProcessing attempts to acquire processing lock for a message.
func TryAcquireMsgProcessing(key string) bool {
	return msgProcessingCache.TryAcquire(key)
}

// ReleaseMsgProcessing releases the message processing lock.
func ReleaseMsgProcessing(key string) {
	msgProcessingCache.Release(key)
}
