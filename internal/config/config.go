package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	Port        string
	LogLevel    string
	LogFormat   string
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://zpwoot:zpwoot123@localhost:5432/zpwoot?sslmode=disable"),
		Port:        getEnv("PORT", "3000"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		LogFormat:   getEnv("LOG_FORMAT", "console"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
