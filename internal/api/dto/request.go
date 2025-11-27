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

type CreateWebhookRequest struct {
	URL    string   `json:"url" binding:"required" example:"https://example.com/webhook"`
	Events []string `json:"events" example:"message.received,session.connected"`
	Secret string   `json:"secret" example:"my-secret-key"`
}

type UpdateWebhookRequest struct {
	URL     string   `json:"url" binding:"required" example:"https://example.com/webhook"`
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

type SetTypingRequest struct {
	Phone string `json:"phone" binding:"required" example:"5511999999999"`
	State string `json:"state" example:"composing"`
	Media string `json:"media" example:"text"`
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
	Text string `json:"text" binding:"required"`
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
	Text      string `json:"text" binding:"required" example:"Edited message"`
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
	LastSeen     string `json:"lastSeen" example:"contacts"`
	Profile      string `json:"profile" example:"all"`
	Status       string `json:"status" example:"contacts"`
	ReadReceipts bool   `json:"readReceipts" example:"true"`
}
