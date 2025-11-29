package dto

// Message Request DTOs

// SendTextReq is the request to send a text message
type SendTextReq struct {
	Phone   string `json:"phone" binding:"required" example:"5511999999999"`
	Text    string `json:"text" binding:"required" example:"Hello World"`
	QuoteID string `json:"quoteId,omitempty" example:"ABCD1234"`
}

// SendImageReq is the request to send an image
type SendImageReq struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Image    string `json:"image" binding:"required" example:"base64_encoded_image"`
	Caption  string `json:"caption,omitempty" example:"Image caption"`
	MimeType string `json:"mimeType,omitempty" example:"image/jpeg"`
	QuoteID  string `json:"quoteId,omitempty" example:"ABCD1234"`
}

// SendAudioReq is the request to send an audio
type SendAudioReq struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Audio    string `json:"audio" binding:"required" example:"base64_encoded_audio"`
	PTT      bool   `json:"ptt,omitempty" example:"true"`
	MimeType string `json:"mimeType,omitempty" example:"audio/ogg; codecs=opus"`
	QuoteID  string `json:"quoteId,omitempty" example:"ABCD1234"`
}

// SendVideoReq is the request to send a video
type SendVideoReq struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Video    string `json:"video" binding:"required" example:"base64_encoded_video"`
	Caption  string `json:"caption,omitempty" example:"Video caption"`
	MimeType string `json:"mimeType,omitempty" example:"video/mp4"`
	QuoteID  string `json:"quoteId,omitempty" example:"ABCD1234"`
}

// SendDocumentReq is the request to send a document
type SendDocumentReq struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Document string `json:"document" binding:"required" example:"base64_encoded_document"`
	Filename string `json:"filename" binding:"required" example:"document.pdf"`
	MimeType string `json:"mimeType,omitempty" example:"application/pdf"`
	QuoteID  string `json:"quoteId,omitempty" example:"ABCD1234"`
}

// SendStickerReq is the request to send a sticker
type SendStickerReq struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Sticker  string `json:"sticker" binding:"required" example:"base64_encoded_sticker"`
	MimeType string `json:"mimeType,omitempty" example:"image/webp"`
}

// SendLocationReq is the request to send a location
type SendLocationReq struct {
	Phone     string  `json:"phone" binding:"required" example:"5511999999999"`
	Latitude  float64 `json:"latitude" binding:"required" example:"-23.5505"`
	Longitude float64 `json:"longitude" binding:"required" example:"-46.6333"`
	Name      string  `json:"name,omitempty" example:"Location Name"`
	Address   string  `json:"address,omitempty" example:"Street Address"`
}

// SendContactReq is the request to send a contact card
type SendContactReq struct {
	Phone        string `json:"phone" binding:"required" example:"5511999999999"`
	ContactName  string `json:"contactName" binding:"required" example:"John Doe"`
	ContactPhone string `json:"contactPhone" binding:"required" example:"5511888888888"`
}

// SendReactionReq is the request to send a reaction
type SendReactionReq struct {
	Phone string `json:"phone" binding:"required" example:"5511999999999"`
	MsgId string `json:"msgId" binding:"required" example:"ABCD1234"`
	Emoji string `json:"emoji" binding:"required" example:"👍"`
}

// SendPollReq is the request to send a poll
type SendPollReq struct {
	Phone           string   `json:"phone" binding:"required" example:"5511999999999"`
	Name            string   `json:"name" binding:"required" example:"What's your favorite color?"`
	Options         []string `json:"options" binding:"required" example:"Red,Blue,Green"`
	SelectableCount int      `json:"selectableCount,omitempty" example:"1"`
}

// SendPollVoteReq is the request to vote on a poll
type SendPollVoteReq struct {
	Phone           string   `json:"phone" binding:"required" example:"5511999999999"`
	PollMsgId       string   `json:"pollMsgId" binding:"required" example:"ABCD1234"`
	SelectedOptions []string `json:"selectedOptions" binding:"required" example:"Red"`
}

// Message Response Data DTOs

// MessageSentData represents a sent message response
type MessageSentData struct {
	MsgId     string `json:"msgId" example:"ABCD1234"`
	Timestamp int64  `json:"timestamp" example:"1699999999"`
}

// Type alias for message response
type MessageSentResponse = Response[MessageSentData]
