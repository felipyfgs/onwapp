package nats

import (
	"encoding/json"
	"fmt"

	"github.com/nats-io/nats.go"
	"github.com/rs/zerolog"
)

type NATSClient struct {
	conn    *nats.Conn
	js      nats.JetStreamContext
	logger  *zerolog.Logger
}

type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func NewNATSClient(url string, logger *zerolog.Logger) (*NATSClient, error) {
	// Connect to NATS server
	conn, err := nats.Connect(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	// Create JetStream context
	js, err := conn.JetStream()
	if err != nil {
		return nil, fmt.Errorf("failed to create JetStream context: %w", err)
	}

	return &NATSClient{
		conn:   conn,
		js:     js,
		logger: logger,
	}, nil
}

func (n *NATSClient) Publish(subject string, eventType string, payload interface{}) error {
	event := Event{
		Type:    eventType,
		Payload: payload,
	}

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Publish message
	_, err = n.js.Publish(subject, data)
	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	n.logger.Info().Str("subject", subject).Str("event_type", eventType).Msg("Event published")
	return nil
}

func (n *NATSClient) Subscribe(subject string, handler func(*Event)) error {
	// Subscribe to subject
	_, err := n.js.Subscribe(subject, func(msg *nats.Msg) {
		var event Event
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			n.logger.Error().Err(err).Msg("Failed to unmarshal event")
			return
		}

		handler(&event)
	}, nats.Durable("onwapp-subscriber"))

	return err
}

func (n *NATSClient) Close() {
	n.conn.Close()
}
