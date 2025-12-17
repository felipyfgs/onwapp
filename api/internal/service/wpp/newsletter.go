package wpp

import (
	"context"
	"fmt"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
)

func (s *Service) CreateNewsletter(ctx context.Context, sessionId, name, description string) (*types.NewsletterMetadata, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	return client.CreateNewsletter(ctx, whatsmeow.CreateNewsletterParams{
		Name:        name,
		Description: description,
	})
}

func (s *Service) FollowNewsletter(ctx context.Context, sessionId, newsletterJID string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := types.ParseJID(newsletterJID)
	if err != nil {
		return fmt.Errorf("invalid newsletter JID: %w", err)
	}

	return client.FollowNewsletter(ctx, jid)
}

func (s *Service) UnfollowNewsletter(ctx context.Context, sessionId, newsletterJID string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := types.ParseJID(newsletterJID)
	if err != nil {
		return fmt.Errorf("invalid newsletter JID: %w", err)
	}

	return client.UnfollowNewsletter(ctx, jid)
}

func (s *Service) GetNewsletterInfo(ctx context.Context, sessionId, newsletterJID string) (*types.NewsletterMetadata, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	jid, err := types.ParseJID(newsletterJID)
	if err != nil {
		return nil, fmt.Errorf("invalid newsletter JID: %w", err)
	}

	return client.GetNewsletterInfo(ctx, jid)
}

func (s *Service) GetSubscribedNewsletters(ctx context.Context, sessionId string) ([]*types.NewsletterMetadata, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.GetSubscribedNewsletters(ctx)
}

func (s *Service) GetNewsletterMessages(ctx context.Context, sessionId, newsletterJID string, count int, before types.MessageServerID) ([]*types.NewsletterMessage, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	jid, err := types.ParseJID(newsletterJID)
	if err != nil {
		return nil, fmt.Errorf("invalid newsletter JID: %w", err)
	}

	return client.GetNewsletterMessages(ctx, jid, &whatsmeow.GetNewsletterMessagesParams{
		Count:  count,
		Before: before,
	})
}

func (s *Service) NewsletterSendReaction(ctx context.Context, sessionId, newsletterJID string, serverID types.MessageServerID, reaction string, messageID types.MessageID) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := types.ParseJID(newsletterJID)
	if err != nil {
		return fmt.Errorf("invalid newsletter JID: %w", err)
	}

	return client.NewsletterSendReaction(ctx, jid, serverID, reaction, messageID)
}

func (s *Service) NewsletterToggleMute(ctx context.Context, sessionId, newsletterJID string, mute bool) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := types.ParseJID(newsletterJID)
	if err != nil {
		return fmt.Errorf("invalid newsletter JID: %w", err)
	}

	return client.NewsletterToggleMute(ctx, jid, mute)
}

func (s *Service) NewsletterMarkViewed(ctx context.Context, sessionId, newsletterJID string, serverIDs []types.MessageServerID) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := types.ParseJID(newsletterJID)
	if err != nil {
		return fmt.Errorf("invalid newsletter JID: %w", err)
	}

	return client.NewsletterMarkViewed(ctx, jid, serverIDs)
}

func (s *Service) NewsletterSubscribeLiveUpdates(ctx context.Context, sessionId, newsletterJID string) (time.Duration, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return 0, err
	}

	jid, err := types.ParseJID(newsletterJID)
	if err != nil {
		return 0, fmt.Errorf("invalid newsletter JID: %w", err)
	}

	return client.NewsletterSubscribeLiveUpdates(ctx, jid)
}
