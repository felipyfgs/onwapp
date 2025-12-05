package logger

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"onwapp/internal/config"
	"onwapp/internal/version"
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
			TimeFormat:    "2006-01-02 15:04:05",
			FieldsExclude: []string{"raw", "v", "module", "sublogger"},
			PartsOrder:    []string{"time", "level", "message"},
		}
		writer.FormatLevel = func(i interface{}) string {
			var l string
			var color int
			if ll, ok := i.(string); ok {
				switch ll {
				case "debug":
					l, color = "DEBUG", 33 // yellow
				case "info":
					l, color = "INFO ", 32 // green
				case "warn":
					l, color = "WARN ", 33 // yellow
				case "error":
					l, color = "ERROR", 31 // red
				case "fatal":
					l, color = "FATAL", 31 // red
				default:
					l, color = "???  ", 0
				}
			}
			return fmt.Sprintf("\x1b[%dm%s\x1b[0m \x1b[90m[v%s]\x1b[0m", color, l, version.Short())
		}
		writer.FormatPrepare = func(evt map[string]interface{}) error {
			module, _ := evt["module"].(string)
			sublogger, _ := evt["sublogger"].(string)
			if module != "" || sublogger != "" {
				tag := module
				if sublogger != "" {
					if tag != "" {
						tag = tag + "/" + sublogger
					} else {
						tag = sublogger
					}
				}
				if msg, ok := evt["message"].(string); ok {
					evt["message"] = fmt.Sprintf("\x1b[36m[%s]\x1b[0m %s", tag, msg)
				}
			}
			return nil
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

	Log = zerolog.New(output).With().Timestamp().Str("v", version.Short()).Logger()
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

// Module returns a logger with module context
func Module(name string) zerolog.Logger {
	return Log.With().Str("module", name).Logger()
}

// ModuleLevel returns a logger with module context and specific level (filters verbose logs)
func ModuleLevel(name string, level zerolog.Level) zerolog.Logger {
	return Log.With().Str("module", name).Logger().Level(level)
}

// Pre-configured module loggers
func Core() *zerolog.Logger     { l := Module("CORE"); return &l }
func DB() *zerolog.Logger       { l := Module("DB"); return &l }
func Storage() *zerolog.Logger  { l := Module("STORAGE"); return &l }
func Nats() *zerolog.Logger     { l := Module("NATS"); return &l }
func Session() *zerolog.Logger  { l := Module("SESSION"); return &l }
func WPP() *zerolog.Logger      { l := Module("WPP"); return &l }
func Chatwoot() *zerolog.Logger { l := Module("CHATWOOT"); return &l }
func API() *zerolog.Logger      { l := Module("API"); return &l }
func Queue() *zerolog.Logger    { l := Module("QUEUE"); return &l }
