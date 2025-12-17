package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type RateLimiterConfig struct {
	RequestsPerSecond float64
	Burst             int
	CleanupInterval   time.Duration
	TTL               time.Duration
}

func DefaultRateLimiterConfig() RateLimiterConfig {
	return RateLimiterConfig{
		RequestsPerSecond: 200,
		Burst:             500,
		CleanupInterval:   5 * time.Minute,
		TTL:               10 * time.Minute,
	}
}

type client struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type RateLimiter struct {
	clients map[string]*client
	mu      sync.RWMutex
	config  RateLimiterConfig
}

func NewRateLimiter(config RateLimiterConfig) *RateLimiter {
	rl := &RateLimiter{
		clients: make(map[string]*client),
		config:  config,
	}

	go rl.cleanupLoop()
	return rl
}

func (rl *RateLimiter) getClient(key string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	if c, exists := rl.clients[key]; exists {
		c.lastSeen = time.Now()
		return c.limiter
	}

	limiter := rate.NewLimiter(rate.Limit(rl.config.RequestsPerSecond), rl.config.Burst)
	rl.clients[key] = &client{
		limiter:  limiter,
		lastSeen: time.Now(),
	}
	return limiter
}

func (rl *RateLimiter) cleanupLoop() {
	ticker := time.NewTicker(rl.config.CleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		rl.cleanup()
	}
}

func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	threshold := time.Now().Add(-rl.config.TTL)
	for key, c := range rl.clients {
		if c.lastSeen.Before(threshold) {
			delete(rl.clients, key)
		}
	}
}

func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := getClientKey(c)
		limiter := rl.getClient(key)

		if !limiter.Allow() {
			c.Header("Retry-After", "1")
			c.Header("X-RateLimit-Limit", "10")
			c.Header("X-RateLimit-Remaining", "0")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "rate limit exceeded",
				"message": "Too many requests. Please try again later.",
			})
			return
		}

		c.Next()
	}
}

func getClientKey(c *gin.Context) string {
	if auth := c.GetHeader("Authorization"); auth != "" {
		if len(auth) > 16 {
			return "auth:" + auth[:16]
		}
		return "auth:" + auth
	}

	return "ip:" + c.ClientIP()
}

func RateLimit(requestsPerSecond float64, burst int) gin.HandlerFunc {
	config := DefaultRateLimiterConfig()
	config.RequestsPerSecond = requestsPerSecond
	config.Burst = burst

	rl := NewRateLimiter(config)
	return rl.Middleware()
}

func StrictRateLimit() gin.HandlerFunc {
	config := RateLimiterConfig{
		RequestsPerSecond: 1,
		Burst:             5,
		CleanupInterval:   5 * time.Minute,
		TTL:               10 * time.Minute,
	}
	rl := NewRateLimiter(config)
	return rl.Middleware()
}
