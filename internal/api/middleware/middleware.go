package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// SessionKeyLookup is a function that looks up a session by its API key
type SessionKeyLookup func(ctx context.Context, apiKey string) (sessionName string, found bool)

// Auth creates a middleware that validates the Authorization header
// It supports both global key (full access) and session-specific keys (session-only access)
// Also accepts auth via query param for SSE connections (EventSource doesn't support headers)
func Auth(globalKey string, sessionLookup SessionKeyLookup) gin.HandlerFunc {
	return func(c *gin.Context) {
		// If no global key configured, skip auth
		if globalKey == "" && sessionLookup == nil {
			c.Next()
			return
		}

		// Try Authorization header first, then query param (for SSE)
		token := c.GetHeader("Authorization")
		if token == "" {
			token = c.Query("auth")
		}
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

// AuthCheck validates the authorization token and returns true if valid
func AuthCheck(c *gin.Context, globalKey string, sessionLookup SessionKeyLookup) bool {
	if globalKey == "" && sessionLookup == nil {
		return true
	}

	token := c.GetHeader("Authorization")
	if token == "" {
		token = c.Query("auth")
	}
	if token == "" {
		return false
	}

	if globalKey != "" && token == globalKey {
		c.Set("auth_type", "global")
		return true
	}

	if sessionLookup != nil {
		if sessionName, found := sessionLookup(c.Request.Context(), token); found {
			c.Set("auth_type", "session")
			c.Set("auth_session", sessionName)
			return true
		}
	}

	return false
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

		// Always set CORS headers for allowed origins
		if allowed || len(allowedOrigins) == 0 || (len(allowedOrigins) > 0 && allowedOrigins[0] == "*") {
			c.Header("Access-Control-Allow-Origin", "*")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, Cache-Control")
			c.Header("Access-Control-Max-Age", "86400")
			c.Header("Access-Control-Expose-Headers", "Content-Length, Content-Type")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
