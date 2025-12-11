package wpp

import (
	"context"
	"fmt"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
)

func (s *Service) CheckPhoneRegistered(ctx context.Context, sessionId string, phones []string) ([]types.IsOnWhatsAppResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.IsOnWhatsApp(ctx, phones)
}

func (s *Service) GetProfilePicture(ctx context.Context, sessionId, phone string) (*types.ProfilePictureInfo, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return nil, fmt.Errorf("invalid phone: %w", err)
	}

	return client.GetProfilePictureInfo(ctx, jid, &whatsmeow.GetProfilePictureParams{})
}

func (s *Service) GetUserInfo(ctx context.Context, sessionId string, phones []string) (map[types.JID]types.UserInfo, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	jids := make([]types.JID, len(phones))
	for i, phone := range phones {
		jid, err := parseJID(phone)
		if err != nil {
			return nil, fmt.Errorf("invalid phone %s: %w", phone, err)
		}
		jids[i] = jid
	}

	return client.GetUserInfo(ctx, jids)
}

func (s *Service) GetContacts(ctx context.Context, sessionId string) (map[string]interface{}, error) {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return nil, err
	}

	contacts, err := session.Client.Store.Contacts.GetAllContacts(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get contacts: %w", err)
	}

	result := make(map[string]interface{})
	for jid, contact := range contacts {
		result[jid.String()] = map[string]interface{}{
			"pushName":     contact.PushName,
			"businessName": contact.BusinessName,
			"fullName":     contact.FullName,
			"firstName":    contact.FirstName,
		}
	}

	return result, nil
}

func (s *Service) GetContactLID(ctx context.Context, sessionId, phone string) (string, error) {
	session, err := s.sessions.Get(sessionId)
	if err != nil {
		return "", err
	}

	if !session.Client.IsConnected() {
		return "", fmt.Errorf("session %s is not connected", sessionId)
	}

	jid, err := parseJID(phone)
	if err != nil {
		return "", fmt.Errorf("invalid phone: %w", err)
	}

	if session.Client.Store.ID != nil {
		ownJID := *session.Client.Store.ID
		if jid.User == ownJID.User && ownJID.RawAgent > 0 {
			return ownJID.String(), nil
		}
	}

	return "", nil
}

func (s *Service) SubscribePresence(ctx context.Context, sessionId, phone string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone: %w", err)
	}

	return client.SubscribePresence(ctx, jid)
}

func (s *Service) GetContactQRLink(ctx context.Context, sessionId string, revoke bool) (string, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return "", err
	}
	return client.GetContactQRLink(ctx, revoke)
}

func (s *Service) GetBusinessProfile(ctx context.Context, sessionId, phone string) (*types.BusinessProfile, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return nil, fmt.Errorf("invalid phone: %w", err)
	}

	return client.GetBusinessProfile(ctx, jid)
}
