package wpp

import (
	"context"
	"fmt"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
)

// ParticipantAction represents the type of group participant action
type ParticipantAction int

const (
	ActionAdd ParticipantAction = iota
	ActionRemove
	ActionPromote
	ActionDemote
)

// updateParticipants is a generic helper for participant operations
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
		jid, err := parseJID(phone)
		if err != nil {
			return nil, fmt.Errorf("invalid phone %s: %w", phone, err)
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

// AddParticipants adds participants to a group
func (s *Service) AddParticipants(ctx context.Context, sessionId, groupID string, phones []string) ([]types.GroupParticipant, error) {
	return s.updateParticipants(ctx, sessionId, groupID, phones, ActionAdd)
}

// RemoveParticipants removes participants from a group
func (s *Service) RemoveParticipants(ctx context.Context, sessionId, groupID string, phones []string) ([]types.GroupParticipant, error) {
	return s.updateParticipants(ctx, sessionId, groupID, phones, ActionRemove)
}

// PromoteParticipants promotes participants to admin
func (s *Service) PromoteParticipants(ctx context.Context, sessionId, groupID string, phones []string) ([]types.GroupParticipant, error) {
	return s.updateParticipants(ctx, sessionId, groupID, phones, ActionPromote)
}

// DemoteParticipants demotes admins to regular participants
func (s *Service) DemoteParticipants(ctx context.Context, sessionId, groupID string, phones []string) ([]types.GroupParticipant, error) {
	return s.updateParticipants(ctx, sessionId, groupID, phones, ActionDemote)
}

// CreateGroup creates a new group
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

// GetGroupInfo retrieves group information
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

// GetJoinedGroups lists all joined groups
func (s *Service) GetJoinedGroups(ctx context.Context, sessionId string) ([]*types.GroupInfo, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.GetJoinedGroups(ctx)
}

// LeaveGroup leaves a group
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

// SetGroupName updates group name
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

// SetGroupTopic updates group description
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

// GetInviteLink gets group invite link
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

// JoinWithLink joins a group via invite link
func (s *Service) JoinWithLink(ctx context.Context, sessionId, link string) (types.JID, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return types.JID{}, err
	}
	return client.JoinGroupWithLink(ctx, link)
}

// SetGroupAnnounce sets if only admins can send messages
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

// SetGroupLocked sets if only admins can edit group info
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

// SetGroupPhoto sets group photo
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

// DeleteGroupPhoto removes group photo
func (s *Service) DeleteGroupPhoto(ctx context.Context, sessionId, groupID string) error {
	_, err := s.SetGroupPhoto(ctx, sessionId, groupID, nil)
	return err
}

// GetGroupPicture gets group profile picture
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

// GetGroupInfoFromInvite gets group info from invite without joining
func (s *Service) GetGroupInfoFromInvite(ctx context.Context, sessionId string, jid types.JID, inviter types.JID, code string, expiration int64) (*types.GroupInfo, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.GetGroupInfoFromInvite(ctx, jid, inviter, code, expiration)
}

// GetGroupInfoFromLink gets group info from invite link
func (s *Service) GetGroupInfoFromLink(ctx context.Context, sessionId, code string) (*types.GroupInfo, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}
	return client.GetGroupInfoFromLink(ctx, code)
}

// SetJoinApprovalMode sets join approval mode
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

// SetMemberAddMode sets who can add members
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

// GetJoinRequests gets pending join requests
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

// UpdateJoinRequests approves or rejects join requests
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

// LinkGroup links a group to a community
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

// UnlinkGroup unlinks a group from a community
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

// GetSubGroups gets sub-groups of a community
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
