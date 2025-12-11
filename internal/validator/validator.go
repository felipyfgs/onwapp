package validator

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"regexp"
	"strings"
	"time"
)

var (
	// phoneRegex validates phone numbers (international format)
	phoneRegex = regexp.MustCompile(`^\+?[1-9]\d{6,14}$`)

	// sessionNameRegex validates session names (alphanumeric, dash, underscore)
	sessionNameRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,64}$`)

	// Private/internal IP ranges to block (SSRF protection)
	privateIPBlocks []*net.IPNet
)

func init() {
	// Initialize private IP blocks
	privateCIDRs := []string{
		"127.0.0.0/8",
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
		"169.254.0.0/16",
		"::1/128",
		"fc00::/7",
		"fe80::/10",
		"0.0.0.0/8",
	}

	for _, cidr := range privateCIDRs {
		_, block, _ := net.ParseCIDR(cidr)
		if block != nil {
			privateIPBlocks = append(privateIPBlocks, block)
		}
	}
}

// ValidationError represents a validation failure
type ValidationError struct {
	Field   string
	Message string
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidatePhone validates a phone number
func ValidatePhone(phone string) error {
	cleaned := strings.ReplaceAll(phone, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ReplaceAll(cleaned, "(", "")
	cleaned = strings.ReplaceAll(cleaned, ")", "")

	if !phoneRegex.MatchString(cleaned) {
		return ValidationError{Field: "phone", Message: "invalid phone number format"}
	}
	return nil
}

// ValidateSessionName validates a session name
func ValidateSessionName(name string) error {
	if name == "" {
		return ValidationError{Field: "session", Message: "session name is required"}
	}
	if !sessionNameRegex.MatchString(name) {
		return ValidationError{Field: "session", Message: "session name must be alphanumeric, dash or underscore (1-64 chars)"}
	}
	return nil
}

// IsPrivateIP checks if an IP is in a private/internal range
func IsPrivateIP(ip net.IP) bool {
	if ip == nil {
		return true
	}

	// Check loopback
	if ip.IsLoopback() {
		return true
	}

	// Check private ranges
	for _, block := range privateIPBlocks {
		if block.Contains(ip) {
			return true
		}
	}

	return false
}

// ValidateURL validates a URL and checks for SSRF vulnerabilities
func ValidateURL(rawURL string) error {
	if rawURL == "" {
		return ValidationError{Field: "url", Message: "URL is required"}
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		return ValidationError{Field: "url", Message: "invalid URL format"}
	}

	// Only allow http and https
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return ValidationError{Field: "url", Message: "only http and https schemes are allowed"}
	}

	// Extract hostname
	hostname := parsed.Hostname()
	if hostname == "" {
		return ValidationError{Field: "url", Message: "URL must have a hostname"}
	}

	// Block localhost variations
	lowerHost := strings.ToLower(hostname)
	blockedHosts := []string{"localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"}
	for _, blocked := range blockedHosts {
		if lowerHost == blocked {
			return ValidationError{Field: "url", Message: "localhost URLs are not allowed"}
		}
	}

	// Resolve hostname and check IP
	ips, err := net.LookupIP(hostname)
	if err != nil {
		// If we can't resolve, allow the URL (might be temporary DNS issue)
		// This is intentional - we don't want to block valid URLs due to DNS hiccups
		return nil
	}

	for _, ip := range ips {
		if IsPrivateIP(ip) {
			return ValidationError{Field: "url", Message: "URLs pointing to private/internal IPs are not allowed"}
		}
	}

	return nil
}

// ValidateURLWithTimeout validates URL with DNS resolution timeout
func ValidateURLWithTimeout(rawURL string, timeout time.Duration) error {
	if rawURL == "" {
		return ValidationError{Field: "url", Message: "URL is required"}
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		return ValidationError{Field: "url", Message: "invalid URL format"}
	}

	// Only allow http and https
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return ValidationError{Field: "url", Message: "only http and https schemes are allowed"}
	}

	hostname := parsed.Hostname()
	if hostname == "" {
		return ValidationError{Field: "url", Message: "URL must have a hostname"}
	}

	// Block localhost variations
	lowerHost := strings.ToLower(hostname)
	blockedHosts := []string{"localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"}
	for _, blocked := range blockedHosts {
		if lowerHost == blocked {
			return ValidationError{Field: "url", Message: "localhost URLs are not allowed"}
		}
	}

	// Use custom resolver with timeout
	resolver := &net.Resolver{}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	ips, err := resolver.LookupIP(ctx, "ip", hostname)
	if err != nil {
		return nil
	}

	for _, ip := range ips {
		if IsPrivateIP(ip) {
			return ValidationError{Field: "url", Message: "URLs pointing to private/internal IPs are not allowed"}
		}
	}

	return nil
}

// ValidateWebhookURL validates a webhook URL
func ValidateWebhookURL(rawURL string) error {
	if err := ValidateURL(rawURL); err != nil {
		return err
	}

	parsed, _ := url.Parse(rawURL)

	// Webhooks should use HTTPS in production
	if parsed.Scheme != "https" {
		// Allow HTTP for localhost in development
		if !strings.Contains(parsed.Host, "localhost") {
			return ValidationError{Field: "url", Message: "webhook URLs should use HTTPS"}
		}
	}

	return nil
}

// SanitizeString removes potentially dangerous characters
func SanitizeString(s string) string {
	// Remove null bytes
	s = strings.ReplaceAll(s, "\x00", "")
	// Trim whitespace
	s = strings.TrimSpace(s)
	return s
}

// ValidateMessageContent validates message content
func ValidateMessageContent(content string, maxLength int) error {
	if content == "" {
		return ValidationError{Field: "content", Message: "content is required"}
	}
	if maxLength > 0 && len(content) > maxLength {
		return ValidationError{Field: "content", Message: fmt.Sprintf("content exceeds maximum length of %d", maxLength)}
	}
	return nil
}

// ValidateFileSize validates file size
func ValidateFileSize(size int64, maxSizeMB int64) error {
	maxBytes := maxSizeMB * 1024 * 1024
	if size > maxBytes {
		return ValidationError{Field: "file", Message: fmt.Sprintf("file size exceeds maximum of %dMB", maxSizeMB)}
	}
	return nil
}

// AllowedMimeTypes for media uploads
var AllowedMimeTypes = map[string][]string{
	"image":    {"image/jpeg", "image/png", "image/gif", "image/webp"},
	"video":    {"video/mp4", "video/webm", "video/quicktime"},
	"audio":    {"audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/aac"},
	"document": {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/octet-stream"},
	"sticker":  {"image/webp"},
}

// ValidateMimeType validates mime type for a given media type
func ValidateMimeType(mimeType, mediaType string) error {
	allowed, exists := AllowedMimeTypes[mediaType]
	if !exists {
		return nil
	}

	for _, a := range allowed {
		if strings.HasPrefix(mimeType, a) {
			return nil
		}
	}

	return ValidationError{
		Field:   "mimeType",
		Message: fmt.Sprintf("mime type %s is not allowed for %s", mimeType, mediaType),
	}
}
