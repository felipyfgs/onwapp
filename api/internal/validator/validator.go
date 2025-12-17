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
	phoneRegex = regexp.MustCompile(`^\+?[1-9]\d{6,14}$`)

	sessionNameRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,64}$`)

	privateIPBlocks []*net.IPNet
)

func init() {
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

type ValidationError struct {
	Field   string
	Message string
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

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

func ValidateSessionName(name string) error {
	if name == "" {
		return ValidationError{Field: "session", Message: "session name is required"}
	}
	if !sessionNameRegex.MatchString(name) {
		return ValidationError{Field: "session", Message: "session name must be alphanumeric, dash or underscore (1-64 chars)"}
	}
	return nil
}

func IsPrivateIP(ip net.IP) bool {
	if ip == nil {
		return true
	}

	if ip.IsLoopback() {
		return true
	}

	for _, block := range privateIPBlocks {
		if block.Contains(ip) {
			return true
		}
	}

	return false
}

func ValidateURL(rawURL string) error {
	if rawURL == "" {
		return ValidationError{Field: "url", Message: "URL is required"}
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		return ValidationError{Field: "url", Message: "invalid URL format"}
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return ValidationError{Field: "url", Message: "only http and https schemes are allowed"}
	}

	hostname := parsed.Hostname()
	if hostname == "" {
		return ValidationError{Field: "url", Message: "URL must have a hostname"}
	}

	lowerHost := strings.ToLower(hostname)
	blockedHosts := []string{"localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"}
	for _, blocked := range blockedHosts {
		if lowerHost == blocked {
			return ValidationError{Field: "url", Message: "localhost URLs are not allowed"}
		}
	}

	ips, err := net.LookupIP(hostname)
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

func ValidateURLWithTimeout(rawURL string, timeout time.Duration) error {
	if rawURL == "" {
		return ValidationError{Field: "url", Message: "URL is required"}
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		return ValidationError{Field: "url", Message: "invalid URL format"}
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return ValidationError{Field: "url", Message: "only http and https schemes are allowed"}
	}

	hostname := parsed.Hostname()
	if hostname == "" {
		return ValidationError{Field: "url", Message: "URL must have a hostname"}
	}

	lowerHost := strings.ToLower(hostname)
	blockedHosts := []string{"localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"}
	for _, blocked := range blockedHosts {
		if lowerHost == blocked {
			return ValidationError{Field: "url", Message: "localhost URLs are not allowed"}
		}
	}

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

func ValidateWebhookURL(rawURL string) error {
	if err := ValidateURL(rawURL); err != nil {
		return err
	}

	parsed, _ := url.Parse(rawURL)

	if parsed.Scheme != "https" {
		if !strings.Contains(parsed.Host, "localhost") {
			return ValidationError{Field: "url", Message: "webhook URLs should use HTTPS"}
		}
	}

	return nil
}

func SanitizeString(s string) string {
	s = strings.ReplaceAll(s, "\x00", "")
	s = strings.TrimSpace(s)
	return s
}

func ValidateMessageContent(content string, maxLength int) error {
	if content == "" {
		return ValidationError{Field: "content", Message: "content is required"}
	}
	if maxLength > 0 && len(content) > maxLength {
		return ValidationError{Field: "content", Message: fmt.Sprintf("content exceeds maximum length of %d", maxLength)}
	}
	return nil
}

func ValidateFileSize(size int64, maxSizeMB int64) error {
	maxBytes := maxSizeMB * 1024 * 1024
	if size > maxBytes {
		return ValidationError{Field: "file", Message: fmt.Sprintf("file size exceeds maximum of %dMB", maxSizeMB)}
	}
	return nil
}

var AllowedMimeTypes = map[string][]string{
	"image":    {"image/jpeg", "image/png", "image/gif", "image/webp"},
	"video":    {"video/mp4", "video/webm", "video/quicktime"},
	"audio":    {"audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/aac"},
	"document": {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/octet-stream"},
	"sticker":  {"image/webp"},
}

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
