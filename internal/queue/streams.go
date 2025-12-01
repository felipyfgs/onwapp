package queue

// Stream names
const (
	StreamWAToCW = "WA_TO_CW" // WhatsApp -> Chatwoot
	StreamCWToWA = "CW_TO_WA" // Chatwoot -> WhatsApp
	StreamDLQ    = "DLQ"      // Dead Letter Queue
)

// Consumer names
const (
	ConsumerWAToCW = "wa-to-cw-processor"
	ConsumerCWToWA = "cw-to-wa-processor"
)
