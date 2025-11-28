package dto

// Session requests

// Message requests

type SendTextRequest struct {
	Phone string `json:"phone" binding:"required" example:"5511999999999"`
	Text  string `json:"text" binding:"required" example:"Hello World"`
}

type SendImageRequest struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Image    string `json:"image" binding:"required" example:"base64_encoded_image"`
	Caption  string `json:"caption" example:"Image caption"`
	MimeType string `json:"mimetype" example:"image/jpeg"`
}

type SendAudioRequest struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Audio    string `json:"audio" binding:"required" example:"base64_encoded_audio"`
	PTT      bool   `json:"ptt" example:"true"`
	MimeType string `json:"mimetype" example:"audio/ogg; codecs=opus"`
}

type SendVideoRequest struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Video    string `json:"video" binding:"required" example:"base64_encoded_video"`
	Caption  string `json:"caption" example:"Video caption"`
	MimeType string `json:"mimetype" example:"video/mp4"`
}

type SendDocumentRequest struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Document string `json:"document" binding:"required" example:"base64_encoded_document"`
	Filename string `json:"filename" binding:"required" example:"document.pdf"`
	MimeType string `json:"mimetype" example:"application/pdf"`
}

type SendStickerRequest struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Sticker  string `json:"sticker" binding:"required" example:"base64_encoded_sticker"`
	MimeType string `json:"mimetype" example:"image/webp"`
}

type SendLocationRequest struct {
	Phone     string  `json:"phone" binding:"required" example:"5511999999999"`
	Latitude  float64 `json:"latitude" binding:"required" example:"-23.5505"`
	Longitude float64 `json:"longitude" binding:"required" example:"-46.6333"`
	Name      string  `json:"name" example:"Location Name"`
	Address   string  `json:"address" example:"Street Address"`
}

type SendContactRequest struct {
	Phone        string `json:"phone" binding:"required" example:"5511999999999"`
	ContactName  string `json:"contactName" binding:"required" example:"John Doe"`
	ContactPhone string `json:"contactPhone" binding:"required" example:"5511888888888"`
}

type SendReactionRequest struct {
	Phone     string `json:"phone" binding:"required" example:"5511999999999"`
	MessageID string `json:"messageId" binding:"required" example:"ABCD1234"`
	Emoji     string `json:"emoji" binding:"required" example:"👍"`
}

// Webhook requests

type SetWebhookRequest struct {
	URL     string   `json:"url" example:"https://example.com/webhook"`
	Events  []string `json:"events" example:"message.received,session.connected"`
	Enabled bool     `json:"enabled" example:"true"`
	Secret  string   `json:"secret" example:"my-secret-key"`
}

// Contact requests

type CheckPhoneRequest struct {
	Phones []string `json:"phones" binding:"required" example:"5511999999999,5511888888888"`
}

type ContactInfoRequest struct {
	Phones []string `json:"phones" binding:"required"`
}

type SetPresenceRequest struct {
	Available bool `json:"available" example:"true"`
}

type ChatPresenceRequest struct {
	Phone string `json:"phone" binding:"required" example:"5511999999999"`
	State string `json:"state" binding:"required" example:"composing"`
	Media string `json:"media" example:""`
}

type MarkReadRequest struct {
	Phone      string   `json:"phone" binding:"required" example:"5511999999999"`
	MessageIDs []string `json:"messageIds" binding:"required"`
}

// Group requests

type CreateGroupRequest struct {
	Name         string   `json:"name" binding:"required" example:"My Group"`
	Participants []string `json:"participants" binding:"required"`
}

type UpdateGroupNameRequest struct {
	GroupID string `json:"groupId" binding:"required"`
	Name    string `json:"name" binding:"required"`
}

type UpdateGroupTopicRequest struct {
	GroupID string `json:"groupId" binding:"required"`
	Topic   string `json:"topic" binding:"required"`
}

type GroupParticipantsRequest struct {
	GroupID      string   `json:"groupId" binding:"required"`
	Participants []string `json:"participants" binding:"required"`
}

type JoinGroupRequest struct {
	InviteLink string `json:"inviteLink" binding:"required"`
}

type SendGroupMessageRequest struct {
	GroupID string `json:"groupId" binding:"required" example:"123456789@g.us"`
	Text    string `json:"text" binding:"required" example:"Hello Group!"`
}

type GroupUpdateRequest struct {
	GroupID string `json:"groupId" binding:"required" example:"123456789@g.us"`
	Value   string `json:"value" binding:"required" example:"New Name"`
}

// Chat requests

type ArchiveChatRequest struct {
	Phone   string `json:"phone" binding:"required" example:"5511999999999"`
	Archive bool   `json:"archive" example:"true"`
}

type DeleteMessageRequest struct {
	Phone     string `json:"phone" binding:"required" example:"5511999999999"`
	MessageID string `json:"messageId" binding:"required" example:"ABCD1234"`
	ForMe     bool   `json:"forMe" example:"false"`
}

type EditMessageRequest struct {
	Phone     string `json:"phone" binding:"required" example:"5511999999999"`
	MessageID string `json:"messageId" binding:"required" example:"ABCD1234"`
	NewText   string `json:"newText" binding:"required" example:"Edited message"`
}

// Profile requests

type SetStatusRequest struct {
	Status string `json:"status" binding:"required" example:"Hey there! I'm using ZPWoot"`
}

type SetPushNameRequest struct {
	Name string `json:"name" binding:"required" example:"John Doe"`
}

type SetProfilePictureRequest struct {
	Image string `json:"image" binding:"required" example:"base64_encoded_image"`
}

type SetPrivacyRequest struct {
	Setting string `json:"setting" binding:"required" example:"last_seen"` // last_seen, online, profile, status, read_receipts, group_add, call_add
	Value   string `json:"value" binding:"required" example:"contacts"`    // all, contacts, contact_blacklist, match_last_seen, known, none
}

// Poll requests

type SendPollRequest struct {
	Phone          string   `json:"phone" binding:"required" example:"5511999999999"`
	Name           string   `json:"name" binding:"required" example:"What's your favorite color?"`
	Options        []string `json:"options" binding:"required" example:"Red,Blue,Green"`
	SelectableCount int      `json:"selectableCount" example:"1"`
}

type SendPollVoteRequest struct {
	Phone          string   `json:"phone" binding:"required" example:"5511999999999"`
	PollMessageID  string   `json:"pollMessageId" binding:"required" example:"ABCD1234"`
	SelectedOptions []string `json:"selectedOptions" binding:"required" example:"Red"`
}

// Blocklist requests

type BlocklistRequest struct {
	Phone  string `json:"phone" binding:"required" example:"5511999999999"`
	Action string `json:"action" binding:"required" example:"block"` // block or unblock
}

// Disappearing messages requests

type DisappearingRequest struct {
	Phone   string `json:"phone" binding:"required" example:"5511999999999"`
	Timer   string `json:"timer" binding:"required" example:"24h"` // 24h, 7d, 90d, or off
}

type DefaultDisappearingRequest struct {
	Timer string `json:"timer" binding:"required" example:"24h"` // 24h, 7d, 90d, or off
}

// Group settings requests

type GroupAnnounceRequest struct {
	GroupID  string `json:"groupId" binding:"required" example:"123456789@g.us"`
	Announce bool   `json:"announce" example:"true"`
}

type GroupLockedRequest struct {
	GroupID string `json:"groupId" binding:"required" example:"123456789@g.us"`
	Locked  bool   `json:"locked" example:"true"`
}

type GroupPictureRequest struct {
	GroupID string `json:"groupId" binding:"required" example:"123456789@g.us"`
	Image   string `json:"image" binding:"required" example:"base64_encoded_image"`
}

type GroupApprovalRequest struct {
	GroupID      string `json:"groupId" binding:"required" example:"123456789@g.us"`
	ApprovalMode bool   `json:"approvalMode" example:"true"`
}

type GroupMemberAddModeRequest struct {
	GroupID string `json:"groupId" binding:"required" example:"123456789@g.us"`
	Mode    string `json:"mode" binding:"required" example:"admin_add"` // admin_add or all_member_add
}

type GroupRequestActionRequest struct {
	GroupID      string   `json:"groupId" binding:"required" example:"123456789@g.us"`
	Participants []string `json:"participants" binding:"required"`
	Action       string   `json:"action" binding:"required" example:"approve"` // approve or reject
}

type GroupRequestActionBodyRequest struct {
	Participants []string `json:"participants" binding:"required"`
	Action       string   `json:"action" binding:"required" example:"approve"` // approve or reject
}

type GroupInfoFromLinkRequest struct {
	InviteLink string `json:"inviteLink" binding:"required" example:"https://chat.whatsapp.com/ABC123"`
}

// Newsletter requests

type CreateNewsletterRequest struct {
	Name        string `json:"name" binding:"required" example:"My Channel"`
	Description string `json:"description" example:"Channel description"`
	Picture     string `json:"picture" example:"base64_encoded_image"`
}

type NewsletterActionRequest struct {
	NewsletterJID string `json:"newsletterJid" binding:"required" example:"123456789@newsletter"`
}

type NewsletterReactionRequest struct {
	NewsletterJID string `json:"newsletterJid" binding:"required" example:"123456789@newsletter"`
	ServerID      int    `json:"serverId" binding:"required" example:"123"`
	Reaction      string `json:"reaction" binding:"required" example:"👍"`
	MessageID     string `json:"messageId" example:"ABCD1234"`
}

type NewsletterMuteRequest struct {
	NewsletterJID string `json:"newsletterJid" binding:"required" example:"123456789@newsletter"`
	Mute          bool   `json:"mute" example:"true"`
}

// Contact subscribe request

type SubscribePresenceRequest struct {
	Phone string `json:"phone" binding:"required" example:"5511999999999"`
}

// Call request

type RejectCallRequest struct {
	CallFrom string `json:"callFrom" binding:"required" example:"5511999999999"`
	CallID   string `json:"callId" binding:"required" example:"CALL123"`
}

// Pair phone request

type PairPhoneRequest struct {
	Phone string `json:"phone" binding:"required" example:"5511999999999"`
}

// Status/Story request

type SendStatusRequest struct {
	Text       string `json:"text" example:"My status update"`
	Image      string `json:"image" example:"base64_encoded_image"`
	Video      string `json:"video" example:"base64_encoded_video"`
	Caption    string `json:"caption" example:"Status caption"`
	MimeType   string `json:"mimetype" example:"image/jpeg"`
}

// Community requests

type LinkGroupRequest struct {
	ParentGroupID string `json:"parentGroupId" binding:"required" example:"123456789@g.us"`
	ChildGroupID  string `json:"childGroupId" binding:"required" example:"987654321@g.us"`
}
