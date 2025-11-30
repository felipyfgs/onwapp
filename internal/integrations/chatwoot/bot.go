package chatwoot

import (
	"context"
	"fmt"
	"strings"

	"zpwoot/internal/logger"
	"zpwoot/internal/model"
	"zpwoot/internal/service"
)

// BotCommandHandler handles commands sent to the bot contact (123456)
type BotCommandHandler struct {
	service        *Service
	sessionService *service.SessionService
}

// NewBotCommandHandler creates a new bot command handler
func NewBotCommandHandler(svc *Service, sessionSvc *service.SessionService) *BotCommandHandler {
	return &BotCommandHandler{
		service:        svc,
		sessionService: sessionSvc,
	}
}

// HandleCommand processes commands sent to the bot contact (123456)
// Supports commands like: init, status, disconnect, clearcache (Evolution API pattern)
func (h *BotCommandHandler) HandleCommand(ctx context.Context, session *model.Session, cfg *Config, content string) {
	command := strings.TrimSpace(content)
	command = strings.TrimPrefix(command, "/")
	command = strings.ToLower(command)

	logger.Info().
		Str("session", session.Name).
		Str("command", command).
		Msg("Chatwoot: processing bot command")

	switch {
	case strings.HasPrefix(command, "init"), strings.HasPrefix(command, "iniciar"):
		h.handleInit(ctx, session, cfg, command)
	case command == "status":
		h.handleStatus(ctx, session, cfg)
	case command == "disconnect", command == "desconectar":
		h.handleDisconnect(ctx, session, cfg)
	case command == "clearcache":
		h.handleClearCache(ctx, session, cfg)
	case command == "help", command == "ajuda":
		h.handleHelp(ctx, cfg)
	default:
		h.handleUnknown(ctx, cfg, command)
	}
}

func (h *BotCommandHandler) handleInit(ctx context.Context, session *model.Session, cfg *Config, command string) {
	if session.Status == model.StatusConnected {
		_ = h.service.SendBotStatusMessage(ctx, cfg, "connected",
			fmt.Sprintf("✅ Inbox *%s* is already connected!", cfg.Inbox))
		return
	}

	_ = h.service.SendBotStatusMessage(ctx, cfg, "connecting",
		fmt.Sprintf("🔄 Connecting inbox *%s*...\n\nPlease wait for the QR code.", cfg.Inbox))

	number := ""
	if strings.Contains(command, ":") {
		parts := strings.SplitN(command, ":", 2)
		if len(parts) > 1 {
			number = strings.TrimSpace(parts[1])
		}
	}

	go func() {
		if _, err := h.sessionService.Connect(context.Background(), session.Name); err != nil {
			_ = h.service.SendBotStatusMessage(context.Background(), cfg, "disconnected",
				fmt.Sprintf("❌ Failed to connect: %s", err.Error()))
		}
	}()

	_ = number // number can be used for phone pairing if needed
}

func (h *BotCommandHandler) handleStatus(ctx context.Context, session *model.Session, cfg *Config) {
	var statusMsg string
	switch session.Status {
	case model.StatusConnected:
		phone := ""
		if session.Device != nil && session.Device.ID != nil {
			phone = session.Device.ID.User
		}
		statusMsg = fmt.Sprintf("🟢 *Status:* Connected\n\n📱 Phone: %s\n📥 Inbox: %s", phone, cfg.Inbox)
	case model.StatusConnecting:
		statusMsg = fmt.Sprintf("🟡 *Status:* Connecting\n\n📥 Inbox: %s", cfg.Inbox)
	case model.StatusDisconnected:
		statusMsg = fmt.Sprintf("🔴 *Status:* Disconnected\n\n📥 Inbox: %s\n\nType *init* to connect.", cfg.Inbox)
	default:
		statusMsg = fmt.Sprintf("⚪ *Status:* %s\n\n📥 Inbox: %s", session.Status, cfg.Inbox)
	}
	_ = h.service.SendBotStatusMessage(ctx, cfg, "", statusMsg)
}

func (h *BotCommandHandler) handleDisconnect(ctx context.Context, session *model.Session, cfg *Config) {
	_ = h.service.SendBotStatusMessage(ctx, cfg, "disconnected",
		fmt.Sprintf("🔌 Disconnecting inbox *%s*...", cfg.Inbox))

	go func() {
		if err := h.sessionService.Logout(context.Background(), session.Name); err != nil {
			logger.Warn().Err(err).Str("session", session.Name).Msg("Chatwoot: failed to logout")
		}
	}()
}

func (h *BotCommandHandler) handleClearCache(ctx context.Context, session *model.Session, cfg *Config) {
	h.service.contactManager.InvalidateCache(session.ID, "")
	_ = h.service.SendBotStatusMessage(ctx, cfg, "",
		fmt.Sprintf("🗑️ Cache cleared for inbox *%s*", cfg.Inbox))
}

func (h *BotCommandHandler) handleHelp(ctx context.Context, cfg *Config) {
	helpMsg := `📖 *Available Commands:*

• *init* - Connect to WhatsApp (generates QR code)
• *init:NUMBER* - Connect with phone pairing
• *status* - Show connection status
• *disconnect* - Disconnect from WhatsApp
• *clearcache* - Clear conversation cache
• *help* - Show this help message`
	_ = h.service.SendBotStatusMessage(ctx, cfg, "", helpMsg)
}

func (h *BotCommandHandler) handleUnknown(ctx context.Context, cfg *Config, command string) {
	_ = h.service.SendBotStatusMessage(ctx, cfg, "",
		fmt.Sprintf("❓ Unknown command: *%s*\n\nType *help* for available commands.", command))
}

// IsBotContact checks if the identifier is the bot contact
func IsBotContact(identifier string) bool {
	return identifier == "123456" || identifier == "+123456"
}
