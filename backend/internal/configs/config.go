package configs

import (
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	Port           string        `envconfig:"PORT" default:":8080"`
	Env            string        `envconfig:"ENV" default:"development"`
	DatabaseURL    string        `envconfig:"DATABASE_URL" required:"true"`
	JWTSecret      string        `envconfig:"JWT_SECRET" required:"true"`
	JWTRefreshSecret string      `envconfig:"JWT_REFRESH_SECRET" required:"true"`
	JWTExpiration  time.Duration `envconfig:"JWT_EXPIRATION" default:"15m"`
	JWTRefreshExpiration time.Duration `envconfig:"JWT_REFRESH_EXPIRATION" default:"168h"`
	NATSURL        string        `envconfig:"NATS_URL" default:"nats://localhost:4222"`
	StorageType    string        `envconfig:"STORAGE_TYPE" default:"local"`
	StoragePath    string        `envconfig:"STORAGE_PATH" default:"./uploads"`
}

func LoadConfig() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	var config Config
	if err := envconfig.Process("", &config); err != nil {
		return nil, err
	}

	// Create uploads directory if it doesn't exist
	if config.StorageType == "local" {
		if err := os.MkdirAll(config.StoragePath, 0755); err != nil {
			return nil, err
		}
	}

	return &config, nil
}
