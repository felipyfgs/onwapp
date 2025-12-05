package wpp

import (
	"context"
	"fmt"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
)

// GetOwnProfile gets the own profile
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

	// Get user info (status, picture)
	userJID := types.NewJID(client.Store.ID.User, types.DefaultUserServer)
	userInfo, err := client.GetUserInfo(ctx, []types.JID{userJID})
	if err == nil && userInfo != nil {
		if info, ok := userInfo[userJID]; ok {
			if info.Status != "" {
				result["status"] = info.Status
			}
		}
	}

	// Get profile picture URL
	pic, err := client.GetProfilePictureInfo(ctx, userJID, &whatsmeow.GetProfilePictureParams{})
	if err == nil && pic != nil {
		result["pictureUrl"] = pic.URL
	}

	return result, nil
}

// SetStatusMessage sets the status message
func (s *Service) SetStatusMessage(ctx context.Context, sessionId, status string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}
	return client.SetStatusMessage(ctx, status)
}

// SetPushName sets the display name
func (s *Service) SetPushName(ctx context.Context, sessionId, name string) error {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return err
	}
	session.Client.Store.PushName = name
	return nil
}

// SetProfilePicture sets the profile picture
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

// DeleteProfilePicture removes the profile picture
func (s *Service) DeleteProfilePicture(ctx context.Context, sessionId string) error {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return err
	}

	if session.Client.Store.ID == nil {
		return fmt.Errorf("session not authenticated")
	}

	_, err = session.Client.SetGroupPhoto(ctx, *session.Client.Store.ID, nil)
	return err
}

// GetPrivacySettings gets privacy settings
func (s *Service) GetPrivacySettings(ctx context.Context, sessionId string) (map[string]interface{}, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	settings := client.GetPrivacySettings(ctx)

	return map[string]interface{}{
		"groupAdd":     string(settings.GroupAdd),
		"lastSeen":     string(settings.LastSeen),
		"status":       string(settings.Status),
		"profile":      string(settings.Profile),
		"readReceipts": string(settings.ReadReceipts),
		"callAdd":      string(settings.CallAdd),
		"online":       string(settings.Online),
	}, nil
}

// SetPrivacySettings sets privacy settings
func (s *Service) SetPrivacySettings(ctx context.Context, sessionId string, settingName types.PrivacySettingType, value types.PrivacySetting) (types.PrivacySettings, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return types.PrivacySettings{}, err
	}
	return client.SetPrivacySetting(ctx, settingName, value)
}

// GetBlocklist gets blocklist
func (s *Service) GetBlocklist(ctx context.Context, sessionId string) (*types.Blocklist, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.GetBlocklist(ctx)
}

// UpdateBlocklist blocks or unblocks a contact
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

// GetStatusPrivacy gets status privacy settings
func (s *Service) GetStatusPrivacy(ctx context.Context, sessionId string) ([]types.StatusPrivacy, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.GetStatusPrivacy(ctx)
}

// PairPhone pairs using phone number
func (s *Service) PairPhone(ctx context.Context, sessionId, phone string) (string, error) {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return "", err
	}

	code, err := session.Client.PairPhone(ctx, phone, true, whatsmeow.PairClientChrome, "Chrome (Linux)")
	if err != nil {
		return "", fmt.Errorf("failed to pair phone: %w", err)
	}

	return code, nil
}

// RejectCall rejects a call
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
