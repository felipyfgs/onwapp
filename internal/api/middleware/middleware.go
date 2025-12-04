package middleware

import (
	"context"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// SessionKeyLookup is a function that looks up a session by its API key
type SessionKeyLookup func(ctx context.Context, apiKey string) (sessionName string, found bool)

// Auth creates a middleware that validates the Authorization header
// It supports both global key (full access) and session-specific keys (session-only access)
func Auth(globalKey string, sessionLookup SessionKeyLookup) gin.HandlerFunc {
	return func(c *gin.Context) {
		// If no global key configured, skip auth
		if globalKey == "" && sessionLookup == nil {
			c.Next()
			return
		}

		token := c.GetHeader("Authorization")
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "missing Authorization header",
			})
			return
		}

		// Check if it's the global key (full access)
		if globalKey != "" && token == globalKey {
			c.Set("auth_type", "global")
			c.Next()
			return
		}

		// Check if it's a session-specific key
		if sessionLookup != nil {
			if sessionName, found := sessionLookup(c.Request.Context(), token); found {
				c.Set("auth_type", "session")
				c.Set("auth_session", sessionName)
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"error": "invalid authorization token",
		})
	}
}

// SessionAuth creates a middleware that validates session access
// Must be used after Auth middleware on session-specific routes
func SessionAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authType, _ := c.Get("auth_type")

		// Global auth has full access
		if authType == "global" {
			c.Next()
			return
		}

		// Session auth - check if accessing the correct session
		if authType == "session" {
			authSession, _ := c.Get("auth_session")
			requestedSession := c.Param("session")

			if authSession == requestedSession {
				c.Next()
				return
			}

			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "access denied to this session",
			})
			return
		}

		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"error": "unauthorized",
		})
	}
}

func CORS(allowedOrigins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		allowed := false
		for _, o := range allowedOrigins {
			if o == "*" || o == origin {
				allowed = true
				break
			}
		}

		if allowed {
			if len(allowedOrigins) > 0 && allowedOrigins[0] == "*" {
				c.Header("Access-Control-Allow-Origin", "*")
			} else {
				c.Header("Access-Control-Allow-Origin", origin)
			}
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
			c.Header("Access-Control-Max-Age", "86400")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

type rateLimiter struct {
	visitors map[string]*visitor
	mu       sync.RWMutex
	rate     int
	window   time.Duration
}

type visitor struct {
	count    int
	lastSeen time.Time
}

func newRateLimiter(requestsPerMinute int) *rateLimiter {
	rl := &rateLimiter{
		visitors: make(map[string]*visitor),
		rate:     requestsPerMinute,
		window:   time.Minute,
	}

	go rl.cleanup()
	return rl
}

func (rl *rateLimiter) cleanup() {
	for {
		time.Sleep(time.Minute)
		rl.mu.Lock()
		for ip, v := range rl.visitors {
			if time.Since(v.lastSeen) > rl.window {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	if !exists {
		rl.visitors[ip] = &visitor{count: 1, lastSeen: time.Now()}
		return true
	}

	if time.Since(v.lastSeen) > rl.window {
		v.count = 1
		v.lastSeen = time.Now()
		return true
	}

	if v.count >= rl.rate {
		return false
	}

	v.count++
	v.lastSeen = time.Now()
	return true
}

func RateLimit(requestsPerMinute int) gin.HandlerFunc {
	if requestsPerMinute <= 0 {
		return func(c *gin.Context) { c.Next() }
	}

	limiter := newRateLimiter(requestsPerMinute)

	return func(c *gin.Context) {
		// Skip rate limiting for webhook endpoints (Chatwoot sends many requests during sync)
		if strings.HasPrefix(c.Request.URL.Path, "/chatwoot/webhook/") {
			c.Next()
			return
		}

		ip := c.ClientIP()

		if !limiter.allow(ip) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded, please try again later",
			})
			return
		}

		c.Next()
	}
}
