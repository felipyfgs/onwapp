package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders adds essential security headers to all responses
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip for WebSocket connections
		if strings.HasSuffix(c.Request.URL.Path, "/ws") {
			c.Next()
			return
		}

		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")

		// XSS protection (legacy but still useful)
		c.Header("X-XSS-Protection", "1; mode=block")

		// Referrer policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Permissions policy (restrict browser features)
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		// Cache control for sensitive endpoints
		if isProtectedEndpoint(c.Request.URL.Path) {
			c.Header("Cache-Control", "no-store, no-cache, must-revalidate, private")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
		}

		c.Next()
	}
}

// StrictTransportSecurity adds HSTS header (only use with HTTPS)
func StrictTransportSecurity(maxAge int) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}
		c.Next()
	}
}

// ContentSecurityPolicy adds CSP header
func ContentSecurityPolicy(policy string) gin.HandlerFunc {
	if policy == "" {
		policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
	}
	return func(c *gin.Context) {
		c.Header("Content-Security-Policy", policy)
		c.Next()
	}
}

func isProtectedEndpoint(path string) bool {
	protectedPrefixes := []string{
		"/sessions",
		"/webhook",
		"/chatwoot",
		"/profile",
		"/settings",
	}
	for _, prefix := range protectedPrefixes {
		if len(path) >= len(prefix) && path[:len(prefix)] == prefix {
			return true
		}
	}
	return false
}
