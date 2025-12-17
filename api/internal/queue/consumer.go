package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/nats-io/nats.go/jetstream"

	"onwapp/internal/logger"
)

type MessageHandler func(ctx context.Context, msg *QueueMessage) error

type Consumer struct {
	client   *Client
	producer *Producer
	handlers map[MessageType]MessageHandler
	mu       sync.RWMutex
	cancel   context.CancelFunc
	wg       sync.WaitGroup
}

func NewConsumer(client *Client, producer *Producer) *Consumer {
	return &Consumer{
		client:   client,
		producer: producer,
		handlers: make(map[MessageType]MessageHandler),
	}
}

func (c *Consumer) RegisterHandler(msgType MessageType, handler MessageHandler) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.handlers[msgType] = handler
	logger.Nats().Debug().Str("type", string(msgType)).Msg("Registered queue handler")
}

func (c *Consumer) Start(ctx context.Context) error {
	ctx, cancel := context.WithCancel(ctx)
	c.cancel = cancel

	if err := c.startConsumer(ctx, StreamWAToCW, ConsumerWAToCW); err != nil {
		cancel()
		return fmt.Errorf("failed to start WA->CW consumer: %w", err)
	}

	if err := c.startConsumer(ctx, StreamCWToWA, ConsumerCWToWA); err != nil {
		cancel()
		return fmt.Errorf("failed to start CW->WA consumer: %w", err)
	}

	return nil
}

func (c *Consumer) Stop() {
	if c.cancel != nil {
		c.cancel()
	}
	c.wg.Wait()
	logger.Nats().Info().Msg("Queue consumers stopped")
}

func (c *Consumer) startConsumer(ctx context.Context, streamType, consumerName string) error {
	stream, err := c.client.JetStream().Stream(ctx, c.client.StreamName(streamType))
	if err != nil {
		return fmt.Errorf("failed to get stream %s: %w", streamType, err)
	}

	backoff := []time.Duration{
		5 * time.Second,
		15 * time.Second,
		30 * time.Second,
		60 * time.Second,
	}

	consumer, err := stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Name:          consumerName,
		Durable:       consumerName,
		AckPolicy:     jetstream.AckExplicitPolicy,
		AckWait:       c.client.Config().AckWait,
		MaxDeliver:    c.client.Config().MaxRetries,
		BackOff:       backoff,
		DeliverPolicy: jetstream.DeliverAllPolicy,
	})
	if err != nil {
		return fmt.Errorf("failed to create consumer %s: %w", consumerName, err)
	}

	c.wg.Add(1)
	go func() {
		defer c.wg.Done()
		c.consumeLoop(ctx, consumer, streamType, consumerName)
	}()

	logger.Nats().Info().
		Str("consumer", consumerName).
		Str("stream", c.client.StreamName(streamType)).
		Msg("Queue consumer started")

	return nil
}

func (c *Consumer) consumeLoop(ctx context.Context, consumer jetstream.Consumer, streamType, consumerName string) {
	for {
		select {
		case <-ctx.Done():
			logger.Nats().Debug().Str("consumer", consumerName).Msg("Consumer loop stopped")
			return
		default:
			msgs, err := consumer.Fetch(10, jetstream.FetchMaxWait(5*time.Second))
			if err != nil {
				if ctx.Err() != nil {
					return
				}
				continue
			}

			for msg := range msgs.Messages() {
				c.processMessage(ctx, msg, streamType)
			}

			if msgs.Error() != nil && ctx.Err() == nil {
				logger.Nats().Debug().Err(msgs.Error()).Str("consumer", consumerName).Msg("Fetch error")
			}
		}
	}
}

func (c *Consumer) processMessage(ctx context.Context, msg jetstream.Msg, streamType string) {
	var queueMsg QueueMessage
	if err := json.Unmarshal(msg.Data(), &queueMsg); err != nil {
		logger.Nats().Error().Err(err).Msg("Failed to unmarshal queue message")
		if nakErr := msg.Nak(); nakErr != nil {
			logger.Nats().Error().Err(nakErr).Msg("Failed to NAK message")
		}
		return
	}

	c.mu.RLock()
	handler, ok := c.handlers[queueMsg.Type]
	c.mu.RUnlock()

	if !ok {
		logger.Nats().Warn().
			Str("type", string(queueMsg.Type)).
			Str("msgId", queueMsg.ID).
			Msg("No handler registered for message type")
		if ackErr := msg.Ack(); ackErr != nil {
			logger.Nats().Error().Err(ackErr).Str("msgId", queueMsg.ID).Msg("Failed to ACK message")
		}
		return
	}

	meta, _ := msg.Metadata()

	if err := handler(ctx, &queueMsg); err != nil {
		logger.Nats().Warn().
			Err(err).
			Str("msgId", queueMsg.ID).
			Str("type", string(queueMsg.Type)).
			Str("sessionId", queueMsg.SessionID).
			Uint64("deliveryCount", meta.NumDelivered).
			Int("maxRetries", c.client.Config().MaxRetries).
			Msg("Failed to process queue message")

		if int(meta.NumDelivered) >= c.client.Config().MaxRetries {
			if dlqErr := c.producer.PublishToDLQ(ctx, msg.Subject(), &queueMsg, err.Error()); dlqErr != nil {
				logger.Nats().Error().Err(dlqErr).Str("msgId", queueMsg.ID).Msg("Failed to publish to DLQ")
			}
			if ackErr := msg.Ack(); ackErr != nil {
				logger.Nats().Error().Err(ackErr).Str("msgId", queueMsg.ID).Msg("Failed to ACK message after DLQ")
			}
			return
		}

		if nakErr := msg.NakWithDelay(c.client.Config().RetryDelay); nakErr != nil {
			logger.Nats().Error().Err(nakErr).Str("msgId", queueMsg.ID).Msg("Failed to NAK message with delay")
		}
		return
	}

	if ackErr := msg.Ack(); ackErr != nil {
		logger.Nats().Error().Err(ackErr).Str("msgId", queueMsg.ID).Msg("Failed to ACK message")
	}
	logger.Nats().Debug().
		Str("msgId", queueMsg.ID).
		Str("type", string(queueMsg.Type)).
		Str("sessionId", queueMsg.SessionID).
		Msg("Queue message processed successfully")
}
