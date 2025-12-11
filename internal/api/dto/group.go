package dto

// Group Request DTOs

// CreateGroupReq is the request to create a group
type CreateGroupReq struct {
	Name         string   `json:"name" binding:"required" example:"My Group"`
	Participants []string `json:"participants" binding:"required" example:"5511999999999,5511888888888"`
}

// JoinGroupReq is the request to join a group via invite link
type JoinGroupReq struct {
	InviteLink string `json:"inviteLink" binding:"required" example:"https://chat.whatsapp.com/ABC123"`
}

// GroupParticipantsReq is the request to add/remove participants
type GroupParticipantsReq struct {
	Participants []string `json:"participants" binding:"required" example:"5511999999999,5511888888888"`
}

// GroupNameReq is the request to update group name
type GroupNameReq struct {
	Name string `json:"name" binding:"required" example:"New Group Name"`
}

// GroupTopicReq is the request to update group description/topic
type GroupTopicReq struct {
	Topic string `json:"topic" binding:"required" example:"Group description"`
}

// GroupPictureReq is the request to set group picture
type GroupPictureReq struct {
	Image string `json:"image" binding:"required" example:"base64_encoded_image"`
}

// GroupAnnounceReq is the request to set announce mode
type GroupAnnounceReq struct {
	Announce bool `json:"announce" example:"true"`
}

// GroupLockedReq is the request to set locked mode
type GroupLockedReq struct {
	Locked bool `json:"locked" example:"true"`
}

// GroupApprovalReq is the request to set approval mode
type GroupApprovalReq struct {
	ApprovalMode bool `json:"approvalMode" example:"true"`
}

// GroupMemberAddModeReq is the request to set member add mode
type GroupMemberAddModeReq struct {
	Mode string `json:"mode" binding:"required" example:"admin_add"`
}

// GroupRequestActionReq is the request to approve/reject join requests
type GroupRequestActionReq struct {
	Participants []string `json:"participants" binding:"required"`
	Action       string   `json:"action" binding:"required" example:"approve"`
}

// SendGroupMessageReq is the request to send a message to a group
type SendGroupMessageReq struct {
	Text string `json:"text" binding:"required" example:"Hello Group!"`
}

// Group Response Data DTOs

// GroupData represents basic group information
type GroupData struct {
	JID  string `json:"jid" example:"123456789@g.us"`
	Name string `json:"name" example:"My Group"`
}

// GroupInfoData represents detailed group information
type GroupInfoData struct {
	JID          string            `json:"jid" example:"123456789@g.us"`
	Name         string            `json:"name" example:"My Group"`
	Topic        string            `json:"topic,omitempty" example:"Group description"`
	Owner        string            `json:"owner,omitempty" example:"5511999999999@s.whatsapp.net"`
	Created      int64             `json:"created,omitempty" example:"1699999999"`
	Participants []ParticipantData `json:"participants,omitempty"`
}

// ParticipantData represents a group participant
type ParticipantData struct {
	JID          string `json:"jid" example:"5511999999999@s.whatsapp.net"`
	IsAdmin      bool   `json:"isAdmin" example:"false"`
	IsSuperAdmin bool   `json:"isSuperAdmin" example:"false"`
}

// GroupInviteData represents invite link information
type GroupInviteData struct {
	JID  string `json:"jid" example:"123456789@g.us"`
	Link string `json:"link" example:"https://chat.whatsapp.com/ABC123"`
}

// GroupActionData represents a group action result
type GroupActionData struct {
	JID     string `json:"jid,omitempty" example:"123456789@g.us"`
	Message string `json:"message,omitempty" example:"Participants added successfully"`
}

// NOTE: GroupResponse, GroupActionResponse are defined in response.go

// GroupListItem represents a group in the list response with proper JSON field names
type GroupListItem struct {
	JID              string `json:"jid" example:"123456789@g.us"`
	Name             string `json:"name" example:"My Group"`
	Topic            string `json:"topic,omitempty" example:"Group description"`
	ParticipantCount int    `json:"participantCount" example:"10"`
	IsAnnounce       bool   `json:"isAnnounce" example:"false"`
	IsLocked         bool   `json:"isLocked" example:"false"`
	CreatedAt        int64  `json:"createdAt,omitempty" example:"1699999999"`
}

// GroupListResponse is the response for listing joined groups
type GroupListResponse struct {
	Data []GroupListItem `json:"data"`
}
