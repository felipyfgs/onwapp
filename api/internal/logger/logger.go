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
					l, color = "DEBUG", 90
				case "info":
					l, color = "INFO ", 36
				case "warn":
					l, color = "WARN ", 33
				case "error":
					l, color = "ERROR", 31
				case "fatal":
					l, color = "FATAL", 31
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

		requestID := c.GetHeader(RequestIDKey)
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set(RequestIDKey, requestID)
		c.Header(RequestIDKey, requestID)

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

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

func Module(name string) zerolog.Logger {
	return Log.With().Str("module", name).Logger()
}

func ModuleLevel(name string, level zerolog.Level) zerolog.Logger {
	return Log.With().Str("module", name).Logger().Level(level)
}

func Core() *zerolog.Logger     { l := Module("CORE"); return &l }
func DB() *zerolog.Logger       { l := Module("DB"); return &l }
func Storage() *zerolog.Logger  { l := Module("STORAGE"); return &l }
func Nats() *zerolog.Logger     { l := Module("NATS"); return &l }
func Session() *zerolog.Logger  { l := Module("SESSION"); return &l }
func WPP() *zerolog.Logger      { l := Module("WPP"); return &l }
func Chatwoot() *zerolog.Logger { l := Module("CHATWOOT"); return &l }
func API() *zerolog.Logger      { l := Module("API"); return &l }
func Queue() *zerolog.Logger    { l := Module("QUEUE"); return &l }
func Admin() *zerolog.Logger    { l := Module("ADMIN"); return &l }

func FilteredDBLogger() zerolog.Logger {
	return Log.With().Str("module", "DB").Logger().Hook(dbFilterHook{})
}

type dbFilterHook struct{}

func (h dbFilterHook) Run(e *zerolog.Event, level zerolog.Level, msg string) {
	if strings.Contains(msg, "duplicate") && strings.Contains(msg, "found in") {
		e.Discard()
	}
}

var sensitivePatterns = []string{
	"password",
	"apiKey",
	"api_key",
	"token",
	"secret",
	"authorization",
	"credential",
	"private_key",
	"access_key",
}

func SanitizeForLog(data map[string]interface{}) map[string]interface{} {
	sanitized := make(map[string]interface{}, len(data))
	for k, v := range data {
		lowerKey := strings.ToLower(k)
		isSensitive := false
		for _, pattern := range sensitivePatterns {
			if strings.Contains(lowerKey, pattern) {
				isSensitive = true
				break
			}
		}
		if isSensitive {
			sanitized[k] = "[REDACTED]"
		} else if nested, ok := v.(map[string]interface{}); ok {
			sanitized[k] = SanitizeForLog(nested)
		} else {
			sanitized[k] = v
		}
	}
	return sanitized
}

func SanitizeString(s string) string {
	if len(s) > 16 {
		return s[:4] + "***" + s[len(s)-4:]
	}
	return s
}

func RedactAuthHeader(header string) string {
	if header == "" {
		return ""
	}
	if len(header) <= 8 {
		return "[REDACTED]"
	}
	return header[:4] + "***"
}
