package logger

import (
	"bytes"
	"encoding/json"
	"io"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"onwapp/internal/config"
)

// Format aliases for convenience
const (
	Console = config.LogFormatConsole
	JSON    = config.LogFormatJSON
)

const RequestIDKey = "X-Request-ID"

var Log zerolog.Logger

func Init(level, format string) {
	zerolog.TimeFieldFormat = time.RFC3339

	lvl, err := zerolog.ParseLevel(level)
	if err != nil {
		lvl = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(lvl)

	var output io.Writer = os.Stdout
	if format == "console" || format == string(Console) {
		writer := zerolog.ConsoleWriter{
			Out:           os.Stdout,
			TimeFormat:    "15:04:05",
			FieldsExclude: []string{"raw"},
		}
		writer.FormatExtra = func(evt map[string]interface{}, buf *bytes.Buffer) error {
			if raw, ok := evt["raw"]; ok {
				b, err := json.MarshalIndent(raw, "", "  ")
				if err == nil {
					buf.WriteString("\n\033[90m")
					buf.Write(b)
					buf.WriteString("\033[0m")
				}
			}
			return nil
		}
		output = writer
	}

	Log = zerolog.New(output).With().Timestamp().Logger()
	log.Logger = Log

	gin.SetMode(gin.ReleaseMode)
	gin.DefaultWriter = io.Discard
	gin.DefaultErrorWriter = io.Discard
}

func GinMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		// Generate or use existing request ID
		requestID := c.GetHeader(RequestIDKey)
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set(RequestIDKey, requestID)
		c.Header(RequestIDKey, requestID)

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		// Use DEBUG for high-frequency webhook routes
		isWebhook := strings.HasPrefix(path, "/chatwoot/webhook/")

		event := Log.Info()
		if isWebhook && status < 400 {
			event = Log.Debug()
		} else if status >= 400 && status < 500 {
			event = Log.Warn()
		} else if status >= 500 {
			event = Log.Error()
		}

		if query != "" {
			path = path + "?" + query
		}

		event.
			Str("requestId", requestID).
			Str("method", c.Request.Method).
			Str("path", path).
			Int("status", status).
			Dur("latency", latency).
			Str("ip", c.ClientIP()).
			Msg("request")
	}
}

func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader(RequestIDKey)
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set(RequestIDKey, requestID)
		c.Header(RequestIDKey, requestID)
		c.Next()
	}
}

func GetRequestID(c *gin.Context) string {
	if id, exists := c.Get(RequestIDKey); exists {
		return id.(string)
	}
	return ""
}

func Debug() *zerolog.Event {
	return Log.Debug()
}

func Info() *zerolog.Event {
	return Log.Info()
}

func Warn() *zerolog.Event {
	return Log.Warn()
}

func Error() *zerolog.Event {
	return Log.Error()
}

func Fatal() *zerolog.Event {
	return Log.Fatal()
}
