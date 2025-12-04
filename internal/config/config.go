package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

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
	DatabaseURL  string
	Port         string
	LogLevel     LogLevel
	LogFormat    LogFormat
	GlobalAPIKey string // Global API key for admin access to all sessions
	ServerURL    string

	// MinIO configuration
	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	MinioBucket    string
	MinioUseSSL    bool
	MinioPublicURL string // Optional: public URL for media files (defaults to endpoint)

	// Debug options
	DebugHistorySync bool // Save history sync JSON dumps to files

	// NATS Configuration
	NatsURL          string
	NatsEnabled      bool
	NatsStreamPrefix string
	NatsMaxRetries   int
	NatsRetryDelay   time.Duration
	NatsAckWait      time.Duration
}

func Load() *Config {
	_ = godotenv.Load() // ignore error, .env file is optional

	port := getEnv("PORT", "3000")
	serverURL := getEnv("SERVER_URL", "")
	if serverURL == "" {
		serverURL = fmt.Sprintf("http://localhost:%s", port)
	}

	return &Config{
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://zpwoot:zpwoot123@localhost:5432/zpwoot?sslmode=disable"),
		Port:         port,
		LogLevel:     LogLevel(getEnv("LOG_LEVEL", "info")),
		LogFormat:    LogFormat(getEnv("LOG_FORMAT", "console")),
		GlobalAPIKey: getEnv("GLOBAL_API_KEY", ""),
		ServerURL:    serverURL,

		MinioEndpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey: getEnv("MINIO_ACCESS_KEY", "zpwoot"),
		MinioSecretKey: getEnv("MINIO_SECRET_KEY", "zpwoot123"),
		MinioBucket:    getEnv("MINIO_BUCKET", "zpwoot-media"),
		MinioUseSSL:    getEnv("MINIO_USE_SSL", "false") == "true",
		MinioPublicURL: getEnv("MINIO_PUBLIC_URL", ""),

		DebugHistorySync: getEnv("DEBUG_HISTORY_SYNC", "false") == "true",

		NatsURL:          getEnv("NATS_URL", "nats://localhost:4222"),
		NatsEnabled:      getEnv("NATS_ENABLED", "false") == "true",
		NatsStreamPrefix: getEnv("NATS_STREAM_PREFIX", "ZPWOOT"),
		NatsMaxRetries:   getEnvInt("NATS_MAX_RETRIES", 5),
		NatsRetryDelay:   getEnvDuration("NATS_RETRY_DELAY", 5*time.Second),
		NatsAckWait:      getEnvDuration("NATS_ACK_WAIT", 30*time.Second),
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

func getEnvInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return fallback
}
