package queue

import (
	"context"

	"onwapp/internal/config"
	"onwapp/internal/logger"
)

// Service gerencia a fila de mensagens
type Service struct {
	client   *Client
	producer *Producer
	consumer *Consumer
	enabled  bool
}

// NewService cria um novo serviço de fila
func NewService(cfg *config.Config) (*Service, error) {
	if !cfg.NatsEnabled {
		logger.Nats().Info().Msg("Queue service disabled (NATS_ENABLED=false)")
		return &Service{enabled: false}, nil
	}

	clientCfg := &ClientConfig{
		URL:          cfg.NatsURL,
		StreamPrefix: cfg.NatsStreamPrefix,
		MaxRetries:   cfg.NatsMaxRetries,
		RetryDelay:   cfg.NatsRetryDelay,
		AckWait:      cfg.NatsAckWait,
	}

	client, err := NewClient(clientCfg)
	if err != nil {
		return nil, err
	}

	producer := NewProducer(client)
	consumer := NewConsumer(client, producer)

	return &Service{
		client:   client,
		producer: producer,
		consumer: consumer,
		enabled:  true,
	}, nil
}

// Initialize inicializa os streams do JetStream
func (s *Service) Initialize(ctx context.Context) error {
	if !s.enabled {
		return nil
	}
	return s.client.EnsureStreams(ctx)
}

// Start inicia os consumers
func (s *Service) Start(ctx context.Context) error {
	if !s.enabled {
		return nil
	}
	return s.consumer.Start(ctx)
}

// Stop para os consumers e fecha a conexão
func (s *Service) Stop() {
	if !s.enabled {
		return
	}
	if s.consumer != nil {
		s.consumer.Stop()
	}
}

// Close fecha a conexão NATS
func (s *Service) Close() {
	if !s.enabled {
		return
	}
	s.Stop()
	if s.client != nil {
		s.client.Close()
	}
}

// IsEnabled verifica se o serviço está habilitado
func (s *Service) IsEnabled() bool {
	return s.enabled
}

// Producer retorna o producer
func (s *Service) Producer() *Producer {
	return s.producer
}

// Consumer retorna o consumer
func (s *Service) Consumer() *Consumer {
	return s.consumer
}

// Client retorna o cliente NATS
func (s *Service) Client() *Client {
	return s.client
}

// RegisterHandler registra um handler para um tipo de mensagem
func (s *Service) RegisterHandler(msgType MessageType, handler MessageHandler) {
	if !s.enabled || s.consumer == nil {
		return
	}
	s.consumer.RegisterHandler(msgType, handler)
}
