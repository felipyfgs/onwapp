package dto

type SendTextReq struct {
	Phone   string `json:"phone" binding:"required" example:"5511999999999"`
	Text    string `json:"text" binding:"required" example:"Hello World"`
	QuoteID string `json:"quoteId,omitempty" example:"ABCD1234"`
}

type SendImageReq struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Image    string `json:"image" binding:"required" example:"base64_encoded_image"`
	Caption  string `json:"caption,omitempty" example:"Image caption"`
	MimeType string `json:"mimeType,omitempty" example:"image/jpeg"`
	QuoteID  string `json:"quoteId,omitempty" example:"ABCD1234"`
}

type SendAudioReq struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Audio    string `json:"audio" binding:"required" example:"base64_encoded_audio"`
	PTT      bool   `json:"ptt,omitempty" example:"true"`
	MimeType string `json:"mimeType,omitempty" example:"audio/ogg; codecs=opus"`
	QuoteID  string `json:"quoteId,omitempty" example:"ABCD1234"`
}

type SendVideoReq struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Video    string `json:"video" binding:"required" example:"base64_encoded_video"`
	Caption  string `json:"caption,omitempty" example:"Video caption"`
	MimeType string `json:"mimeType,omitempty" example:"video/mp4"`
	QuoteID  string `json:"quoteId,omitempty" example:"ABCD1234"`
}

type SendDocumentReq struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Document string `json:"document" binding:"required" example:"base64_encoded_document"`
	Filename string `json:"filename" binding:"required" example:"document.pdf"`
	MimeType string `json:"mimeType,omitempty" example:"application/pdf"`
	QuoteID  string `json:"quoteId,omitempty" example:"ABCD1234"`
}

type SendStickerReq struct {
	Phone    string `json:"phone" binding:"required" example:"5511999999999"`
	Sticker  string `json:"sticker" binding:"required" example:"base64_encoded_sticker"`
	MimeType string `json:"mimeType,omitempty" example:"image/webp"`
}

type SendLocationReq struct {
	Phone     string  `json:"phone" binding:"required" example:"5511999999999"`
	Latitude  float64 `json:"latitude" binding:"required" example:"-23.5505"`
	Longitude float64 `json:"longitude" binding:"required" example:"-46.6333"`
	Name      string  `json:"name,omitempty" example:"Location Name"`
	Address   string  `json:"address,omitempty" example:"Street Address"`
}

type SendContactReq struct {
	Phone        string `json:"phone" binding:"required" example:"5511999999999"`
	ContactName  string `json:"contactName" binding:"required" example:"John Doe"`
	ContactPhone string `json:"contactPhone" binding:"required" example:"5511888888888"`
}

type SendReactionReq struct {
	Phone string `json:"phone" binding:"required" example:"5511999999999"`
	MsgId string `json:"msgId" binding:"required" example:"ABCD1234"`
	Emoji string `json:"emoji" binding:"required" example:"👍"`
}

type SendPollReq struct {
	Phone           string   `json:"phone" binding:"required" example:"5511999999999"`
	Name            string   `json:"name" binding:"required" example:"What's your favorite color?"`
	Options         []string `json:"options" binding:"required" example:"Red,Blue,Green"`
	SelectableCount int      `json:"selectableCount,omitempty" example:"1"`
}

type SendPollVoteReq struct {
	Phone           string   `json:"phone" binding:"required" example:"5511999999999"`
	PollMsgId       string   `json:"pollMsgId" binding:"required" example:"ABCD1234"`
	SelectedOptions []string `json:"selectedOptions" binding:"required" example:"Red"`
}

type MessageSentData struct {
	MsgId     string `json:"msgId" example:"ABCD1234"`
	Timestamp int64  `json:"timestamp" example:"1699999999"`
}

type MessageSentResponse = Response[MessageSentData]
