package nats

const (
	// WhatsApp events
	EventWhatsAppConnected    = "whatsapp.connected"
	EventWhatsAppDisconnected = "whatsapp.disconnected"
	EventWhatsAppQRCode       = "whatsapp.qrcode"
	
	// Message events
	EventMessageReceived = "message.received"
	EventMessageSent     = "message.sent"
	EventMessageRead     = "message.read"
	
	// Ticket events
	EventTicketCreated     = "ticket.created"
	EventTicketUpdated     = "ticket.updated"
	EventTicketAssigned    = "ticket.assigned"
	EventTicketStatusChanged = "ticket.status_changed"
	
	// User events
	EventUserOnline  = "user.online"
	EventUserOffline = "user.offline"
)
