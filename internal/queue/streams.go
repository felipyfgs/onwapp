package queue

const (
	StreamWAToCW = "WA_TO_CW"
	StreamCWToWA = "CW_TO_WA"
	StreamDLQ    = "DLQ"
)

const (
	ConsumerWAToCW = "wa-to-cw-processor"
	ConsumerCWToWA = "cw-to-wa-processor"
)
