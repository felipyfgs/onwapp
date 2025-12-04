package wpp

import (
	"context"
	"fmt"
	"os"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"google.golang.org/protobuf/proto"
)

// MediaParams holds parameters for sending media messages
type MediaParams struct {
	Data      []byte
	MimeType  string
	Caption   string
	FileName  string
	MediaType whatsmeow.MediaType
	Quoted    *QuotedMessage
	PTT       bool
}

// sendMedia is a generic helper for uploading and sending media
func (s *Service) sendMedia(ctx context.Context, sessionId, phone string, p MediaParams, build func(*whatsmeow.UploadResponse, *waE2E.ContextInfo) *waE2E.Message) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	uploaded, err := client.Upload(ctx, p.Data, p.MediaType)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("upload failed: %w", err)
	}

	msg := build(&uploaded, buildQuoteContext(p.Quoted))

	resp, err := client.SendMessage(ctx, jid, msg)
	if err != nil {
		return resp, err
	}

	s.emitSentEvent(sessionId, resp, jid, msg)
	return resp, nil
}

// =============================================================================
// TEXT MESSAGES
// =============================================================================

// SendText sends a text message
func (s *Service) SendText(ctx context.Context, sessionId, phone, text string) (whatsmeow.SendResponse, error) {
	return s.SendTextQuoted(ctx, sessionId, phone, text, nil)
}

// SendTextQuoted sends a text message with optional quote
func (s *Service) SendTextQuoted(ctx context.Context, sessionId, phone, text string, quoted *QuotedMessage) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	var msg *waE2E.Message
	if quoted != nil {
		msg = &waE2E.Message{
			ExtendedTextMessage: &waE2E.ExtendedTextMessage{
				Text:        proto.String(text),
				ContextInfo: buildQuoteContext(quoted),
			},
		}
	} else {
		msg = &waE2E.Message{Conversation: proto.String(text)}
	}

	resp, err := client.SendMessage(ctx, jid, msg)
	if err != nil {
		return resp, err
	}

	s.emitSentEvent(sessionId, resp, jid, msg)
	return resp, nil
}

// =============================================================================
// MEDIA MESSAGES
// =============================================================================

// SendImage sends an image message
func (s *Service) SendImage(ctx context.Context, sessionId, phone string, data []byte, caption, mimeType string, quoted *QuotedMessage) (whatsmeow.SendResponse, error) {
	p := MediaParams{Data: data, MimeType: mimeType, Caption: caption, MediaType: whatsmeow.MediaImage, Quoted: quoted}

	resp, err := s.sendMedia(ctx, sessionId, phone, p, func(u *whatsmeow.UploadResponse, ci *waE2E.ContextInfo) *waE2E.Message {
		return &waE2E.Message{
			ImageMessage: &waE2E.ImageMessage{
				URL:           proto.String(u.URL),
				DirectPath:    proto.String(u.DirectPath),
				MediaKey:      u.MediaKey,
				Mimetype:      proto.String(p.MimeType),
				FileEncSHA256: u.FileEncSHA256,
				FileSHA256:    u.FileSHA256,
				FileLength:    proto.Uint64(uint64(len(p.Data))),
				Caption:       proto.String(p.Caption),
				ContextInfo:   ci,
			},
		}
	})

	return resp, err
}

// SendDocument sends a document message
func (s *Service) SendDocument(ctx context.Context, sessionId, phone string, data []byte, filename, mimeType string, quoted *QuotedMessage) (whatsmeow.SendResponse, error) {
	p := MediaParams{Data: data, MimeType: mimeType, FileName: filename, MediaType: whatsmeow.MediaDocument, Quoted: quoted}

	return s.sendMedia(ctx, sessionId, phone, p, func(u *whatsmeow.UploadResponse, ci *waE2E.ContextInfo) *waE2E.Message {
		return &waE2E.Message{
			DocumentMessage: &waE2E.DocumentMessage{
				URL:           proto.String(u.URL),
				DirectPath:    proto.String(u.DirectPath),
				MediaKey:      u.MediaKey,
				Mimetype:      proto.String(p.MimeType),
				FileEncSHA256: u.FileEncSHA256,
				FileSHA256:    u.FileSHA256,
				FileLength:    proto.Uint64(uint64(len(p.Data))),
				FileName:      proto.String(p.FileName),
				ContextInfo:   ci,
			},
		}
	})
}

// SendAudio sends an audio message
func (s *Service) SendAudio(ctx context.Context, sessionId, phone string, data []byte, mimeType string, ptt bool, quoted *QuotedMessage) (whatsmeow.SendResponse, error) {
	p := MediaParams{Data: data, MimeType: mimeType, MediaType: whatsmeow.MediaAudio, Quoted: quoted, PTT: ptt}

	return s.sendMedia(ctx, sessionId, phone, p, func(u *whatsmeow.UploadResponse, ci *waE2E.ContextInfo) *waE2E.Message {
		return &waE2E.Message{
			AudioMessage: &waE2E.AudioMessage{
				URL:           proto.String(u.URL),
				DirectPath:    proto.String(u.DirectPath),
				MediaKey:      u.MediaKey,
				Mimetype:      proto.String(p.MimeType),
				FileEncSHA256: u.FileEncSHA256,
				FileSHA256:    u.FileSHA256,
				FileLength:    proto.Uint64(uint64(len(p.Data))),
				PTT:           proto.Bool(p.PTT),
				ContextInfo:   ci,
			},
		}
	})
}

// SendVideo sends a video message
func (s *Service) SendVideo(ctx context.Context, sessionId, phone string, data []byte, caption, mimeType string, quoted *QuotedMessage) (whatsmeow.SendResponse, error) {
	p := MediaParams{Data: data, MimeType: mimeType, Caption: caption, MediaType: whatsmeow.MediaVideo, Quoted: quoted}

	return s.sendMedia(ctx, sessionId, phone, p, func(u *whatsmeow.UploadResponse, ci *waE2E.ContextInfo) *waE2E.Message {
		return &waE2E.Message{
			VideoMessage: &waE2E.VideoMessage{
				URL:           proto.String(u.URL),
				DirectPath:    proto.String(u.DirectPath),
				MediaKey:      u.MediaKey,
				Mimetype:      proto.String(p.MimeType),
				FileEncSHA256: u.FileEncSHA256,
				FileSHA256:    u.FileSHA256,
				FileLength:    proto.Uint64(uint64(len(p.Data))),
				Caption:       proto.String(p.Caption),
				ContextInfo:   ci,
			},
		}
	})
}

// SendSticker sends a sticker message
func (s *Service) SendSticker(ctx context.Context, sessionId, phone string, data []byte, mimeType string) (whatsmeow.SendResponse, error) {
	p := MediaParams{Data: data, MimeType: mimeType, MediaType: whatsmeow.MediaImage}

	return s.sendMedia(ctx, sessionId, phone, p, func(u *whatsmeow.UploadResponse, ci *waE2E.ContextInfo) *waE2E.Message {
		return &waE2E.Message{
			StickerMessage: &waE2E.StickerMessage{
				URL:           proto.String(u.URL),
				DirectPath:    proto.String(u.DirectPath),
				MediaKey:      u.MediaKey,
				Mimetype:      proto.String(p.MimeType),
				FileEncSHA256: u.FileEncSHA256,
				FileSHA256:    u.FileSHA256,
				FileLength:    proto.Uint64(uint64(len(p.Data))),
			},
		}
	})
}

// SendImageFromFile sends image from file path
func (s *Service) SendImageFromFile(ctx context.Context, sessionId, phone, path, caption string) (whatsmeow.SendResponse, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("read file: %w", err)
	}
	return s.SendImage(ctx, sessionId, phone, data, caption, "image/jpeg", nil)
}

// SendDocumentFromFile sends document from file path
func (s *Service) SendDocumentFromFile(ctx context.Context, sessionId, phone, path, filename, mimeType string) (whatsmeow.SendResponse, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("read file: %w", err)
	}
	return s.SendDocument(ctx, sessionId, phone, data, filename, mimeType, nil)
}

// SendAudioFromFile sends audio from file path
func (s *Service) SendAudioFromFile(ctx context.Context, sessionId, phone, path string, ptt bool) (whatsmeow.SendResponse, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("read file: %w", err)
	}
	return s.SendAudio(ctx, sessionId, phone, data, "audio/ogg; codecs=opus", ptt, nil)
}

// SendVideoFromFile sends video from file path
func (s *Service) SendVideoFromFile(ctx context.Context, sessionId, phone, path, caption string) (whatsmeow.SendResponse, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("read file: %w", err)
	}
	return s.SendVideo(ctx, sessionId, phone, data, caption, "video/mp4", nil)
}

// =============================================================================
// SPECIAL MESSAGES
// =============================================================================

// SendLocation sends a location message
func (s *Service) SendLocation(ctx context.Context, sessionId, phone string, lat, lng float64, name, address string) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	msg := &waE2E.Message{
		LocationMessage: &waE2E.LocationMessage{
			DegreesLatitude:  proto.Float64(lat),
			DegreesLongitude: proto.Float64(lng),
			Name:             proto.String(name),
			Address:          proto.String(address),
		},
	}

	resp, err := client.SendMessage(ctx, jid, msg)
	if err != nil {
		return resp, err
	}

	s.emitSentEvent(sessionId, resp, jid, msg)
	return resp, nil
}

// SendContact sends a contact card
func (s *Service) SendContact(ctx context.Context, sessionId, phone, contactName, contactPhone string) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	vcard := fmt.Sprintf("BEGIN:VCARD\nVERSION:3.0\nFN:%s\nTEL;type=CELL;type=VOICE;waid=%s:+%s\nEND:VCARD",
		contactName, contactPhone, contactPhone)

	msg := &waE2E.Message{
		ContactMessage: &waE2E.ContactMessage{
			DisplayName: proto.String(contactName),
			Vcard:       proto.String(vcard),
		},
	}

	resp, err := client.SendMessage(ctx, jid, msg)
	if err != nil {
		return resp, err
	}

	s.emitSentEvent(sessionId, resp, jid, msg)
	return resp, nil
}

// SendReaction sends a reaction to a message
func (s *Service) SendReaction(ctx context.Context, sessionId, phone, messageID, emoji string) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	return client.SendMessage(ctx, jid, client.BuildReaction(jid, jid, messageID, emoji))
}

// =============================================================================
// INTERACTIVE MESSAGES
// =============================================================================

// SendButtons sends a message with buttons (max 3)
func (s *Service) SendButtons(ctx context.Context, sessionId, phone string, params whatsmeow.ButtonsMessageParams) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	return client.SendButtonsMessage(ctx, jid, params)
}

// SendList sends a message with a list
func (s *Service) SendList(ctx context.Context, sessionId, phone string, params whatsmeow.ListMessageParams) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	return client.SendListMessage(ctx, jid, params)
}

// SendNativeFlow sends an interactive message with native flow buttons
func (s *Service) SendNativeFlow(ctx context.Context, sessionId, phone string, params whatsmeow.NativeFlowMessageParams) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	return client.SendNativeFlowMessage(ctx, jid, params)
}

// SendTemplate sends a message with template buttons
func (s *Service) SendTemplate(ctx context.Context, sessionId, phone string, params whatsmeow.TemplateMessageParams) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	return client.SendTemplateMessage(ctx, jid, params)
}

// SendCarousel sends a carousel message with multiple cards
func (s *Service) SendCarousel(ctx context.Context, sessionId, phone string, params whatsmeow.CarouselMessageParams) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	return client.SendCarouselMessage(ctx, jid, params)
}

// =============================================================================
// POLL MESSAGES
// =============================================================================

// SendPoll sends a poll
func (s *Service) SendPoll(ctx context.Context, sessionId, phone, name string, options []string, selectableCount int) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	if selectableCount <= 0 {
		selectableCount = 1
	}

	msg := client.BuildPollCreation(name, options, selectableCount)
	resp, err := client.SendMessage(ctx, jid, msg)
	if err != nil {
		return resp, err
	}

	s.emitSentEvent(sessionId, resp, jid, msg)
	return resp, nil
}

// SendPollVote votes on a poll
func (s *Service) SendPollVote(ctx context.Context, sessionId, phone, pollMsgID string, selectedOptions []string) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone: %w", err)
	}

	pollInfo := &types.MessageInfo{
		ID: types.MessageID(pollMsgID),
		MessageSource: types.MessageSource{
			Chat:   jid,
			Sender: jid,
		},
	}

	msg, err := client.BuildPollVote(ctx, pollInfo, selectedOptions)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("failed to build poll vote: %w", err)
	}

	return client.SendMessage(ctx, jid, msg)
}

// =============================================================================
// STATUS/STORY
// =============================================================================

// SendStatus sends a status/story
func (s *Service) SendStatus(ctx context.Context, sessionId string, msg *waE2E.Message) (whatsmeow.SendResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	return client.SendMessage(ctx, types.StatusBroadcastJID, msg)
}

// =============================================================================
// MEDIA UTILITIES
// =============================================================================

// DownloadMedia downloads media from a message
func (s *Service) DownloadMedia(ctx context.Context, sessionId string, msg *waE2E.Message) ([]byte, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	var dl whatsmeow.DownloadableMessage
	switch {
	case msg.ImageMessage != nil:
		dl = msg.ImageMessage
	case msg.VideoMessage != nil:
		dl = msg.VideoMessage
	case msg.AudioMessage != nil:
		dl = msg.AudioMessage
	case msg.DocumentMessage != nil:
		dl = msg.DocumentMessage
	case msg.StickerMessage != nil:
		dl = msg.StickerMessage
	default:
		return nil, fmt.Errorf("no downloadable media")
	}

	return client.Download(ctx, dl)
}

// UploadMedia uploads media and returns upload response
func (s *Service) UploadMedia(ctx context.Context, sessionId string, data []byte, mediaType whatsmeow.MediaType) (*whatsmeow.UploadResponse, error) {
	client, err := s.getClient(sessionId)
	if err != nil {
		return nil, err
	}

	uploaded, err := client.Upload(ctx, data, mediaType)
	if err != nil {
		return nil, fmt.Errorf("upload failed: %w", err)
	}
	return &uploaded, nil
}
