package validator

import (
	"net"
	"testing"
)

func TestIsPrivateIP(t *testing.T) {
	tests := []struct {
		name     string
		ip       string
		expected bool
	}{
		{"localhost IPv4", "127.0.0.1", true},
		{"localhost IPv6", "::1", true},
		{"private 10.x", "10.0.0.1", true},
		{"private 172.x", "172.16.0.1", true},
		{"private 192.x", "192.168.1.1", true},
		{"public IP", "8.8.8.8", false},
		{"public IP 2", "1.1.1.1", false},
		{"link local", "169.254.1.1", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ip := net.ParseIP(tt.ip)
			result := IsPrivateIP(ip)
			if result != tt.expected {
				t.Errorf("IsPrivateIP(%s) = %v, want %v", tt.ip, result, tt.expected)
			}
		})
	}
}

func TestValidateURL(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		wantErr bool
	}{
		{"valid https", "https://example.com/path", false},
		{"valid http", "http://example.com", false},
		{"localhost blocked", "http://localhost:8080", true},
		{"127.0.0.1 blocked", "http://127.0.0.1", true},
		{"empty url", "", true},
		{"ftp blocked", "ftp://example.com", true},
		{"file blocked", "file:///etc/passwd", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateURL(tt.url)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateURL(%s) error = %v, wantErr %v", tt.url, err, tt.wantErr)
			}
		})
	}
}

func TestValidatePhone(t *testing.T) {
	tests := []struct {
		name    string
		phone   string
		wantErr bool
	}{
		{"valid international", "+5511999999999", false},
		{"valid without plus", "5511999999999", false},
		{"valid with spaces", "+55 11 99999 9999", false},
		{"too short", "12345", true},
		{"invalid chars", "abc123", true},
		{"empty", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePhone(tt.phone)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePhone(%s) error = %v, wantErr %v", tt.phone, err, tt.wantErr)
			}
		})
	}
}

func TestValidateSessionName(t *testing.T) {
	tests := []struct {
		name    string
		session string
		wantErr bool
	}{
		{"valid alphanumeric", "session1", false},
		{"valid with dash", "my-session", false},
		{"valid with underscore", "my_session", false},
		{"empty", "", true},
		{"too long", "a123456789012345678901234567890123456789012345678901234567890123456", true},
		{"special chars", "session@123", true},
		{"spaces", "my session", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateSessionName(tt.session)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateSessionName(%s) error = %v, wantErr %v", tt.session, err, tt.wantErr)
			}
		})
	}
}

func TestValidateMimeType(t *testing.T) {
	tests := []struct {
		name      string
		mimeType  string
		mediaType string
		wantErr   bool
	}{
		{"valid jpeg", "image/jpeg", "image", false},
		{"valid png", "image/png", "image", false},
		{"valid mp4", "video/mp4", "video", false},
		{"invalid image type", "application/pdf", "image", true},
		{"valid document", "application/pdf", "document", false},
		{"valid audio", "audio/mpeg", "audio", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateMimeType(tt.mimeType, tt.mediaType)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateMimeType(%s, %s) error = %v, wantErr %v", tt.mimeType, tt.mediaType, err, tt.wantErr)
			}
		})
	}
}

func TestSanitizeString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"with null byte", "hello\x00world", "helloworld"},
		{"with whitespace", "  hello  ", "hello"},
		{"normal string", "hello", "hello"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeString(tt.input)
			if result != tt.expected {
				t.Errorf("SanitizeString(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}
