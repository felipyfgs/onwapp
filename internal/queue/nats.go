package queue

import (
	"context"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"

	"zpwoot/internal/logger"
)

// Client gerencia a conexão NATS e JetStream
type Client struct {
	nc           *nats.Conn
	js           jetstream.JetStream
	streamPrefix string
	config       *ClientConfig
}

// ClientConfig configuração do cliente NATS
type ClientConfig struct {
	URL          string
	StreamPrefix string
	MaxRetries   int
	RetryDelay   time.Duration
	AckWait      time.Duration
}

// NewClient cria um novo cliente NATS com JetStream
func NewClient(cfg *ClientConfig) (*Client, error) {
	opts := []nats.Option{
		nats.RetryOnFailedConnect(true),
		nats.MaxReconnects(-1),
		nats.ReconnectWait(2 * time.Second),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			if err != nil {
				logger.Warn().Err(err).Msg("NATS disconnected")
			}
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			logger.Info().Str("url", nc.ConnectedUrl()).Msg("NATS reconnected")
		}),
		nats.ClosedHandler(func(nc *nats.Conn) {
			logger.Info().Msg("NATS connection closed")
		}),
		nats.ErrorHandler(func(nc *nats.Conn, sub *nats.Subscription, err error) {
			logger.Error().Err(err).Msg("NATS error")
		}),
	}

	nc, err := nats.Connect(cfg.URL, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	js, err := jetstream.New(nc)
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("failed to create JetStream context: %w", err)
	}

	logger.Info().Str("url", nc.ConnectedUrl()).Msg("NATS connected with JetStream")

	return &Client{
		nc:           nc,
		js:           js,
		streamPrefix: cfg.StreamPrefix,
		config:       cfg,
	}, nil
}

// Close fecha a conexão NATS
func (c *Client) Close() {
	if c.nc != nil {
		if err := c.nc.Drain(); err != nil {
			logger.Warn().Err(err).Msg("Failed to drain NATS connection")
		}
		c.nc.Close()
		logger.Info().Msg("NATS connection closed")
	}
}

// IsConnected verifica se está conectado ao NATS
func (c *Client) IsConnected() bool {
	return c.nc != nil && c.nc.IsConnected()
}

// JetStream retorna o contexto JetStream
func (c *Client) JetStream() jetstream.JetStream {
	return c.js
}

// StreamName retorna o nome completo do stream com prefixo
func (c *Client) StreamName(name string) string {
	return fmt.Sprintf("%s_%s", c.streamPrefix, name)
}

// Subject retorna o subject completo com prefixo
func (c *Client) Subject(stream, suffix string) string {
	return fmt.Sprintf("%s.%s.%s", c.streamPrefix, stream, suffix)
}

// Config retorna a configuração do cliente
func (c *Client) Config() *ClientConfig {
	return c.config
}

// EnsureStreams cria os streams necessários
func (c *Client) EnsureStreams(ctx context.Context) error {
	streams := []jetstream.StreamConfig{
		{
			Name:        c.StreamName(StreamWAToCW),
			Description: "WhatsApp to Chatwoot messages",
			Subjects:    []string{c.Subject(StreamWAToCW, ">")},
			Retention:   jetstream.WorkQueuePolicy,
			MaxAge:      24 * time.Hour,
			Storage:     jetstream.FileStorage,
			Replicas:    1,
		},
		{
			Name:        c.StreamName(StreamCWToWA),
			Description: "Chatwoot to WhatsApp messages",
			Subjects:    []string{c.Subject(StreamCWToWA, ">")},
			Retention:   jetstream.WorkQueuePolicy,
			MaxAge:      24 * time.Hour,
			Storage:     jetstream.FileStorage,
			Replicas:    1,
		},
		{
			Name:        c.StreamName(StreamDLQ),
			Description: "Dead Letter Queue for failed messages",
			Subjects:    []string{c.Subject(StreamDLQ, ">")},
			Retention:   jetstream.LimitsPolicy,
			MaxAge:      7 * 24 * time.Hour,
			Storage:     jetstream.FileStorage,
		},
	}

	for _, cfg := range streams {
		_, err := c.js.CreateOrUpdateStream(ctx, cfg)
		if err != nil {
			return fmt.Errorf("failed to create stream %s: %w", cfg.Name, err)
		}
		logger.Info().Str("stream", cfg.Name).Msg("JetStream stream ready")
	}

	return nil
}
