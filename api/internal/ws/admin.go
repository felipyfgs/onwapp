package ws

import (
	"onwapp/internal/queue"
)

func New(queueClient *queue.Client) *Publisher {
	return NewPublisher(queueClient)
}
