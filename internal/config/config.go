package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// LogLevel represents valid logging levels
type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
)

// IsValid checks if the LogLevel is valid
func (l LogLevel) IsValid() bool {
	switch l {
	case LogLevelDebug, LogLevelInfo, LogLevelWarn, LogLevelError:
		return true
	}
	return false
}

// String returns the string representation
func (l LogLevel) String() string {
	return string(l)
}

// LogFormat represents valid log output formats
type LogFormat string

const (
	LogFormatConsole LogFormat = "console"
	LogFormatJSON    LogFormat = "json"
)

// IsValid checks if the LogFormat is valid
func (f LogFormat) IsValid() bool {
	switch f {
	case LogFormatConsole, LogFormatJSON:
		return true
	}
	return false
}

// String returns the string representation
func (f LogFormat) String() string {
	return string(f)
}

type Config struct {
	DatabaseURL string
	Port        string
	LogLevel    LogLevel
	LogFormat   LogFormat
	APIKey      string
	ServerURL   string
}

func Load() *Config {
	_ = godotenv.Load() // ignore error, .env file is optional

	port := getEnv("PORT", "3000")
	serverURL := getEnv("SERVER_URL", "")
	if serverURL == "" {
		serverURL = fmt.Sprintf("http://localhost:%s", port)
	}

	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://zpwoot:zpwoot123@localhost:5432/zpwoot?sslmode=disable"),
		Port:        port,
		LogLevel:    LogLevel(getEnv("LOG_LEVEL", "info")),
		LogFormat:   LogFormat(getEnv("LOG_FORMAT", "console")),
		APIKey:      getEnv("API_KEY", ""),
		ServerURL:   serverURL,
	}
}

func (c *Config) Validate() error {
	var errs []string

	if c.DatabaseURL == "" {
		errs = append(errs, "DATABASE_URL is required")
	}

	if c.Port == "" {
		errs = append(errs, "PORT is required")
	}

	if !c.LogLevel.IsValid() {
		errs = append(errs, "LOG_LEVEL must be one of: debug, info, warn, error")
	}

	if !c.LogFormat.IsValid() {
		errs = append(errs, "LOG_FORMAT must be one of: console, json")
	}

	if len(errs) > 0 {
		return fmt.Errorf("config validation failed: %s", strings.Join(errs, "; "))
	}

	return nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
