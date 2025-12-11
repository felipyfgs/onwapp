package queue

// Stream names
const (
	StreamWAToCW = "WA_TO_CW"
	StreamCWToWA = "CW_TO_WA"
	StreamDLQ    = "DLQ"
)

// Consumer names
const (
	ConsumerWAToCW = "wa-to-cw-processor"
	ConsumerCWToWA = "cw-to-wa-processor"
)
