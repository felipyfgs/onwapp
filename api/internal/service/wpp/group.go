package wpp

import (
	"context"
	"fmt"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
)

type ParticipantAction int

const (
	ActionAdd ParticipantAction = iota
	ActionRemove
	ActionPromote
	ActionDemote
)

func (s *Service) updateParticipants(ctx context.Context, sessionId, groupID string, phones []string, action ParticipantAction) ([]types.GroupParticipant, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	groupJID, err := parseGroupJID(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}

	jids := make([]types.JID, len(phones))
	for i, phone := range phones {
		jid, parseErr := parseJID(phone)
		if parseErr != nil {
			return nil, fmt.Errorf("invalid phone %s: %w", phone, parseErr)
		}
		jids[i] = jid
	}

	actionMap := map[ParticipantAction]whatsmeow.ParticipantChange{
		ActionAdd:     whatsmeow.ParticipantChangeAdd,
		ActionRemove:  whatsmeow.ParticipantChangeRemove,
		ActionPromote: whatsmeow.ParticipantChangePromote,
		ActionDemote:  whatsmeow.ParticipantChangeDemote,
	}

	changes, err := client.UpdateGroupParticipants(ctx, groupJID, jids, actionMap[action])
	if err != nil {
		return nil, err
	}

	result := make([]types.GroupParticipant, len(changes))
	for i, c := range changes {
		result[i] = types.GroupParticipant{JID: c.JID}
	}
	return result, nil
}

func (s *Service) AddParticipants(ctx context.Context, sessionId, groupID string, phones []string) ([]types.GroupParticipant, error) {
	return s.updateParticipants(ctx, sessionId, groupID, phones, ActionAdd)
}

func (s *Service) RemoveParticipants(ctx context.Context, sessionId, groupID string, phones []string) ([]types.GroupParticipant, error) {
	return s.updateParticipants(ctx, sessionId, groupID, phones, ActionRemove)
}

func (s *Service) PromoteParticipants(ctx context.Context, sessionId, groupID string, phones []string) ([]types.GroupParticipant, error) {
	return s.updateParticipants(ctx, sessionId, groupID, phones, ActionPromote)
}

func (s *Service) DemoteParticipants(ctx context.Context, sessionId, groupID string, phones []string) ([]types.GroupParticipant, error) {
	return s.updateParticipants(ctx, sessionId, groupID, phones, ActionDemote)
}

func (s *Service) CreateGroup(ctx context.Context, sessionId, name string, phones []string) (*types.GroupInfo, error) {
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

	return client.CreateGroup(ctx, whatsmeow.ReqCreateGroup{Name: name, Participants: jids})
}

func (s *Service) GetGroupInfo(ctx context.Context, sessionId, groupID string) (*types.GroupInfo, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}
	return client.GetGroupInfo(ctx, jid)
}

func (s *Service) GetJoinedGroups(ctx context.Context, sessionId string) ([]*types.GroupInfo, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.GetJoinedGroups(ctx)
}

func (s *Service) LeaveGroup(ctx context.Context, sessionId, groupID string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return fmt.Errorf("invalid group ID: %w", err)
	}
	return client.LeaveGroup(ctx, jid)
}

func (s *Service) SetGroupName(ctx context.Context, sessionId, groupID, name string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return fmt.Errorf("invalid group ID: %w", err)
	}
	return client.SetGroupName(ctx, jid, name)
}

func (s *Service) SetGroupTopic(ctx context.Context, sessionId, groupID, topic string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return fmt.Errorf("invalid group ID: %w", err)
	}
	return client.SetGroupTopic(ctx, jid, "", "", topic)
}

func (s *Service) GetInviteLink(ctx context.Context, sessionId, groupID string, reset bool) (string, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return "", err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return "", fmt.Errorf("invalid group ID: %w", err)
	}
	return client.GetGroupInviteLink(ctx, jid, reset)
}

func (s *Service) JoinWithLink(ctx context.Context, sessionId, link string) (types.JID, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return types.JID{}, err
	}
	return client.JoinGroupWithLink(ctx, link)
}

func (s *Service) SetGroupAnnounce(ctx context.Context, sessionId, groupID string, announce bool) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return fmt.Errorf("invalid group ID: %w", err)
	}
	return client.SetGroupAnnounce(ctx, jid, announce)
}

func (s *Service) SetGroupLocked(ctx context.Context, sessionId, groupID string, locked bool) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return fmt.Errorf("invalid group ID: %w", err)
	}
	return client.SetGroupLocked(ctx, jid, locked)
}

func (s *Service) SetGroupPhoto(ctx context.Context, sessionId, groupID string, data []byte) (string, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return "", err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return "", fmt.Errorf("invalid group ID: %w", err)
	}
	return client.SetGroupPhoto(ctx, jid, data)
}

func (s *Service) DeleteGroupPhoto(ctx context.Context, sessionId, groupID string) error {
	_, err := s.SetGroupPhoto(ctx, sessionId, groupID, nil)
	return err
}

func (s *Service) GetGroupPicture(ctx context.Context, sessionId, groupJID string) (*types.ProfilePictureInfo, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	jid, err := parseGroupJID(groupJID)
	if err != nil {
		return nil, fmt.Errorf("invalid group JID: %w", err)
	}
	return client.GetProfilePictureInfo(ctx, jid, &whatsmeow.GetProfilePictureParams{})
}

func (s *Service) GetGroupInfoFromLink(ctx context.Context, sessionId, code string) (*types.GroupInfo, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.GetGroupInfoFromLink(ctx, code)
}

func (s *Service) SetJoinApprovalMode(ctx context.Context, sessionId, groupID string, mode bool) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return fmt.Errorf("invalid group ID: %w", err)
	}
	return client.SetGroupJoinApprovalMode(ctx, jid, mode)
}

func (s *Service) SetMemberAddMode(ctx context.Context, sessionId, groupID string, mode types.GroupMemberAddMode) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return fmt.Errorf("invalid group ID: %w", err)
	}
	return client.SetGroupMemberAddMode(ctx, jid, mode)
}

func (s *Service) GetJoinRequests(ctx context.Context, sessionId, groupID string) ([]types.GroupParticipantRequest, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}
	return client.GetGroupRequestParticipants(ctx, jid)
}

func (s *Service) UpdateJoinRequests(ctx context.Context, sessionId, groupID string, phones []string, action whatsmeow.ParticipantRequestChange) ([]types.GroupParticipant, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	groupJID, err := parseGroupJID(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}

	jids := make([]types.JID, len(phones))
	for i, phone := range phones {
		jid, err := parseJID(phone)
		if err != nil {
			return nil, fmt.Errorf("invalid phone %s: %w", phone, err)
		}
		jids[i] = jid
	}

	return client.UpdateGroupRequestParticipants(ctx, groupJID, jids, action)
}

func (s *Service) LinkGroup(ctx context.Context, sessionId, parentID, childID string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	parentJID, err := parseGroupJID(parentID)
	if err != nil {
		return fmt.Errorf("invalid parent group ID: %w", err)
	}

	childJID, err := parseGroupJID(childID)
	if err != nil {
		return fmt.Errorf("invalid child group ID: %w", err)
	}

	return client.LinkGroup(ctx, parentJID, childJID)
}

func (s *Service) UnlinkGroup(ctx context.Context, sessionId, parentID, childID string) error {
	client, err := s.getClient(sessionId)
	if err != nil {
		return err
	}

	parentJID, err := parseGroupJID(parentID)
	if err != nil {
		return fmt.Errorf("invalid parent group ID: %w", err)
	}

	childJID, err := parseGroupJID(childID)
	if err != nil {
		return fmt.Errorf("invalid child group ID: %w", err)
	}

	return client.UnlinkGroup(ctx, parentJID, childJID)
}

func (s *Service) GetSubGroups(ctx context.Context, sessionId, communityID string) ([]*types.GroupLinkTarget, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	jid, err := parseGroupJID(communityID)
	if err != nil {
		return nil, fmt.Errorf("invalid community ID: %w", err)
	}
	return client.GetSubGroups(ctx, jid)
}
