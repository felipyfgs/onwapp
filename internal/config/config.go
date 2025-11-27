package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	Port        string
	LogLevel    string
	LogFormat   string
	APIKey      string
}

func Load() *Config {
	_ = godotenv.Load() // ignore error, .env file is optional

	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://zpwoot:zpwoot123@localhost:5432/zpwoot?sslmode=disable"),
		Port:        getEnv("PORT", "3000"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		LogFormat:   getEnv("LOG_FORMAT", "console"),
		APIKey:      getEnv("API_KEY", ""),
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

	validLogLevels := map[string]bool{"debug": true, "info": true, "warn": true, "error": true}
	if !validLogLevels[c.LogLevel] {
		errs = append(errs, "LOG_LEVEL must be one of: debug, info, warn, error")
	}

	validLogFormats := map[string]bool{"console": true, "json": true}
	if !validLogFormats[c.LogFormat] {
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
