package wpp

import (
	"context"
	"fmt"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
)

func (s *Service) GetOwnProfile(ctx context.Context, sessionId string) (map[string]interface{}, error) {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return nil, err
	}

	client := session.Client
	if client.Store.ID == nil {
		return nil, fmt.Errorf("session not authenticated")
	}

	result := map[string]interface{}{
		"jid":      client.Store.ID.String(),
		"pushName": client.Store.PushName,
	}

	userJID := types.NewJID(client.Store.ID.User, types.DefaultUserServer)
	userInfo, err := client.GetUserInfo(ctx, []types.JID{userJID})
	if err == nil && userInfo != nil {
		if info, ok := userInfo[userJID]; ok {
			if info.Status != "" {
				result["status"] = info.Status
			}
		}
	}

	pic, err := client.GetProfilePictureInfo(ctx, userJID, &whatsmeow.GetProfilePictureParams{})
	if err == nil && pic != nil {
		result["pictureUrl"] = pic.URL
	}

	return result, nil
}

func (s *Service) SetStatusMessage(ctx context.Context, sessionId, status string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}
	return client.SetStatusMessage(ctx, status)
}

func (s *Service) SetPushName(ctx context.Context, sessionId, name string) error {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return err
	}
	session.Client.Store.PushName = name
	return nil
}

func (s *Service) SetProfilePicture(ctx context.Context, sessionId string, data []byte) (string, error) {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return "", err
	}

	if session.Client.Store.ID == nil {
		return "", fmt.Errorf("session not authenticated")
	}

	pictureID, err := session.Client.SetGroupPhoto(ctx, *session.Client.Store.ID, data)
	if err != nil {
		return "", fmt.Errorf("failed to set profile picture: %w", err)
	}

	return pictureID, nil
}

func (s *Service) DeleteProfilePicture(ctx context.Context, sessionId string) error {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return err
	}

	if session.Client.Store.ID == nil {
		return fmt.Errorf("session not authenticated")
	}

	_, err = session.Client.SetGroupPhoto(ctx, *session.Client.Store.ID, nil)
	if err != nil {
		return fmt.Errorf("failed to delete profile picture: %w", err)
	}
	return nil
}

func (s *Service) GetBlocklist(ctx context.Context, sessionId string) (*types.Blocklist, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.GetBlocklist(ctx)
}

func (s *Service) UpdateBlocklist(ctx context.Context, sessionId, phone string, block bool) (*types.Blocklist, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return nil, fmt.Errorf("invalid phone: %w", err)
	}

	var action events.BlocklistChangeAction
	if block {
		action = events.BlocklistChangeActionBlock
	} else {
		action = events.BlocklistChangeActionUnblock
	}

	return client.UpdateBlocklist(ctx, jid, action)
}

func (s *Service) GetStatusPrivacy(ctx context.Context, sessionId string) ([]types.StatusPrivacy, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.GetStatusPrivacy(ctx)
}

func (s *Service) PairPhone(ctx context.Context, sessionId, phone string) (string, error) {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return "", err
	}

	// Verificar se a sessão já tem credenciais
	if session.Client.Store.ID != nil {
		return "", fmt.Errorf("session already authenticated, logout first to pair a new device")
	}

	// Se o cliente não estiver conectado, precisa conectar primeiro
	if !session.Client.IsConnected() {
		// Obter canal QR (necessário mesmo para pairing code)
		_, err := session.Client.GetQRChannel(ctx)
		if err != nil {
			return "", fmt.Errorf("failed to prepare session for pairing: %w", err)
		}

		// Conectar o cliente
		if err := session.Client.Connect(); err != nil {
			return "", fmt.Errorf("failed to connect client: %w", err)
		}
	}

	// Agora que está conectado, gerar o código de pairing
	code, err := session.Client.PairPhone(ctx, phone, true, whatsmeow.PairClientChrome, "Chrome (Linux)")
	if err != nil {
		return "", fmt.Errorf("failed to pair phone: %w", err)
	}

	return code, nil
}

func (s *Service) RejectCall(ctx context.Context, sessionId, callFrom, callID string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseJID(callFrom)
	if err != nil {
		return fmt.Errorf("invalid phone: %w", err)
	}

	return client.RejectCall(ctx, jid, callID)
}

func (s *Service) GetPrivacySettingsAsStrings(ctx context.Context, sessionId string) (map[string]string, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	settings := client.GetPrivacySettings(ctx)

	return map[string]string{
		"groupAdd":     string(settings.GroupAdd),
		"lastSeen":     string(settings.LastSeen),
		"status":       string(settings.Status),
		"profilePhoto": string(settings.Profile),
		"readReceipts": string(settings.ReadReceipts),
		"callAdd":      string(settings.CallAdd),
		"online":       string(settings.Online),
	}, nil
}

func (s *Service) SetPrivacySettingByName(ctx context.Context, sessionId, settingName, value string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	settingType := types.PrivacySettingType(settingName)
	settingValue := types.PrivacySetting(value)

	_, err = client.SetPrivacySetting(ctx, settingType, settingValue)
	return err
}

func (s *Service) SetDefaultDisappearingTimerByName(ctx context.Context, sessionId, timer string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	duration, err := parseDisappearingTimer(timer)
	if err != nil {
		return err
	}

	return client.SetDefaultDisappearingTimer(ctx, duration)
}

func parseDisappearingTimer(timer string) (time.Duration, error) {
	switch timer {
	case "off", "":
		return 0, nil
	case "24h":
		return 24 * time.Hour, nil
	case "7d":
		return 7 * 24 * time.Hour, nil
	case "90d":
		return 90 * 24 * time.Hour, nil
	default:
		return 0, fmt.Errorf("invalid timer value: %s (must be off, 24h, 7d, or 90d)", timer)
	}
}
