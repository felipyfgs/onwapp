package middleware

import (
	"github.com/gin-gonic/gin"
)

func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")

		c.Header("X-Frame-Options", "DENY")

		c.Header("X-XSS-Protection", "1; mode=block")

		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		if isProtectedEndpoint(c.Request.URL.Path) {
			c.Header("Cache-Control", "no-store, no-cache, must-revalidate, private")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
		}

		c.Next()
	}
}

func StrictTransportSecurity(maxAge int) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}
		c.Next()
	}
}

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
