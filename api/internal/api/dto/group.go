package dto

type CreateGroupReq struct {
	Name         string   `json:"name" binding:"required" example:"My Group"`
	Participants []string `json:"participants" binding:"required" example:"5511999999999,5511888888888"`
}

type JoinGroupReq struct {
	InviteLink string `json:"inviteLink" binding:"required" example:"https://chat.whatsapp.com/ABC123"`
}

type GroupParticipantsReq struct {
	Participants []string `json:"participants" binding:"required" example:"5511999999999,5511888888888"`
}

type GroupNameReq struct {
	Name string `json:"name" binding:"required" example:"New Group Name"`
}

type GroupTopicReq struct {
	Topic string `json:"topic" binding:"required" example:"Group description"`
}

type GroupPictureReq struct {
	Image string `json:"image" binding:"required" example:"base64_encoded_image"`
}

type GroupAnnounceReq struct {
	Announce bool `json:"announce" example:"true"`
}

type GroupLockedReq struct {
	Locked bool `json:"locked" example:"true"`
}

type GroupApprovalReq struct {
	ApprovalMode bool `json:"approvalMode" example:"true"`
}

type GroupMemberAddModeReq struct {
	Mode string `json:"mode" binding:"required" example:"admin_add"`
}

type GroupRequestActionReq struct {
	Participants []string `json:"participants" binding:"required"`
	Action       string   `json:"action" binding:"required" example:"approve"`
}

type SendGroupMessageReq struct {
	Text string `json:"text" binding:"required" example:"Hello Group!"`
}

type GroupData struct {
	JID  string `json:"jid" example:"123456789@g.us"`
	Name string `json:"name" example:"My Group"`
}

type GroupInfoData struct {
	JID          string            `json:"jid" example:"123456789@g.us"`
	Name         string            `json:"name" example:"My Group"`
	Topic        string            `json:"topic,omitempty" example:"Group description"`
	Owner        string            `json:"owner,omitempty" example:"5511999999999@s.whatsapp.net"`
	Created      int64             `json:"created,omitempty" example:"1699999999"`
	Participants []ParticipantData `json:"participants,omitempty"`
}

type ParticipantData struct {
	JID          string `json:"jid" example:"5511999999999@s.whatsapp.net"`
	IsAdmin      bool   `json:"isAdmin" example:"false"`
	IsSuperAdmin bool   `json:"isSuperAdmin" example:"false"`
}

type GroupInviteData struct {
	JID  string `json:"jid" example:"123456789@g.us"`
	Link string `json:"link" example:"https://chat.whatsapp.com/ABC123"`
}

type GroupActionData struct {
	JID     string `json:"jid,omitempty" example:"123456789@g.us"`
	Message string `json:"message,omitempty" example:"Participants added successfully"`
}

type GroupListItem struct {
	JID              string `json:"jid" example:"123456789@g.us"`
	Name             string `json:"name" example:"My Group"`
	Topic            string `json:"topic,omitempty" example:"Group description"`
	ParticipantCount int    `json:"participantCount" example:"10"`
	IsAnnounce       bool   `json:"isAnnounce" example:"false"`
	IsLocked         bool   `json:"isLocked" example:"false"`
	CreatedAt        int64  `json:"createdAt,omitempty" example:"1699999999"`
}

type GroupListResponse struct {
	Data []GroupListItem `json:"data"`
}
