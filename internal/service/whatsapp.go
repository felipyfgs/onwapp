package service

import (
	"context"
	"fmt"
	"os"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"google.golang.org/protobuf/proto"

	"zpwoot/internal/model"
)

type WhatsAppService struct {
	sessionService *SessionService
}

func NewWhatsAppService(sessionService *SessionService) *WhatsAppService {
	return &WhatsAppService{sessionService: sessionService}
}

func (w *WhatsAppService) getClient(sessionName string) (*whatsmeow.Client, error) {
	session, err := w.sessionService.Get(sessionName)
	if err != nil {
		return nil, err
	}
	if !session.Client.IsConnected() {
		return nil, fmt.Errorf("session %s is not connected", sessionName)
	}
	return session.Client, nil
}

func parseJID(phone string) (types.JID, error) {
	if phone[0] == '+' {
		phone = phone[1:]
	}
	return types.ParseJID(phone + "@s.whatsapp.net")
}

func parseGroupJID(groupID string) (types.JID, error) {
	return types.ParseJID(groupID + "@g.us")
}

// SendText envia mensagem de texto
func (w *WhatsAppService) SendText(ctx context.Context, sessionName, phone, text string) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	msg := &waE2E.Message{
		Conversation: proto.String(text),
	}

	return client.SendMessage(ctx, jid, msg)
}

// SendImage envia imagem
func (w *WhatsAppService) SendImage(ctx context.Context, sessionName, phone string, imageData []byte, caption string, mimeType string) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	uploaded, err := client.Upload(ctx, imageData, whatsmeow.MediaImage)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("failed to upload image: %w", err)
	}

	msg := &waE2E.Message{
		ImageMessage: &waE2E.ImageMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			Mimetype:      proto.String(mimeType),
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(imageData))),
			Caption:       proto.String(caption),
		},
	}

	return client.SendMessage(ctx, jid, msg)
}

// SendDocument envia documento
func (w *WhatsAppService) SendDocument(ctx context.Context, sessionName, phone string, docData []byte, filename, mimeType string) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	uploaded, err := client.Upload(ctx, docData, whatsmeow.MediaDocument)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("failed to upload document: %w", err)
	}

	msg := &waE2E.Message{
		DocumentMessage: &waE2E.DocumentMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			Mimetype:      proto.String(mimeType),
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(docData))),
			FileName:      proto.String(filename),
		},
	}

	return client.SendMessage(ctx, jid, msg)
}

// SendAudio envia áudio
func (w *WhatsAppService) SendAudio(ctx context.Context, sessionName, phone string, audioData []byte, mimeType string, ptt bool) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	uploaded, err := client.Upload(ctx, audioData, whatsmeow.MediaAudio)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("failed to upload audio: %w", err)
	}

	msg := &waE2E.Message{
		AudioMessage: &waE2E.AudioMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			Mimetype:      proto.String(mimeType),
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(audioData))),
			PTT:           proto.Bool(ptt),
		},
	}

	return client.SendMessage(ctx, jid, msg)
}

// SendVideo envia vídeo
func (w *WhatsAppService) SendVideo(ctx context.Context, sessionName, phone string, videoData []byte, caption, mimeType string) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	uploaded, err := client.Upload(ctx, videoData, whatsmeow.MediaVideo)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("failed to upload video: %w", err)
	}

	msg := &waE2E.Message{
		VideoMessage: &waE2E.VideoMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			Mimetype:      proto.String(mimeType),
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(videoData))),
			Caption:       proto.String(caption),
		},
	}

	return client.SendMessage(ctx, jid, msg)
}

// SendSticker envia sticker
func (w *WhatsAppService) SendSticker(ctx context.Context, sessionName, phone string, stickerData []byte, mimeType string) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	uploaded, err := client.Upload(ctx, stickerData, whatsmeow.MediaImage)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("failed to upload sticker: %w", err)
	}

	msg := &waE2E.Message{
		StickerMessage: &waE2E.StickerMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			Mimetype:      proto.String(mimeType),
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(stickerData))),
		},
	}

	return client.SendMessage(ctx, jid, msg)
}

// SendLocation envia localização
func (w *WhatsAppService) SendLocation(ctx context.Context, sessionName, phone string, lat, lng float64, name, address string) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	msg := &waE2E.Message{
		LocationMessage: &waE2E.LocationMessage{
			DegreesLatitude:  proto.Float64(lat),
			DegreesLongitude: proto.Float64(lng),
			Name:             proto.String(name),
			Address:          proto.String(address),
		},
	}

	return client.SendMessage(ctx, jid, msg)
}

// SendContact envia contato
func (w *WhatsAppService) SendContact(ctx context.Context, sessionName, phone, contactName, contactPhone string) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	vcard := fmt.Sprintf("BEGIN:VCARD\nVERSION:3.0\nFN:%s\nTEL;type=CELL;type=VOICE;waid=%s:+%s\nEND:VCARD",
		contactName, contactPhone, contactPhone)

	msg := &waE2E.Message{
		ContactMessage: &waE2E.ContactMessage{
			DisplayName: proto.String(contactName),
			Vcard:       proto.String(vcard),
		},
	}

	return client.SendMessage(ctx, jid, msg)
}

// SendReaction envia reação a uma mensagem
func (w *WhatsAppService) SendReaction(ctx context.Context, sessionName, phone, messageID, emoji string) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	return client.SendMessage(ctx, jid, client.BuildReaction(jid, jid, messageID, emoji))
}

// SendPresence envia status de presença (available/unavailable)
func (w *WhatsAppService) SendPresence(ctx context.Context, sessionName string, available bool) error {
	client, err := w.getClient(sessionName)
	if err != nil {
		return err
	}

	presence := types.PresenceUnavailable
	if available {
		presence = types.PresenceAvailable
	}

	return client.SendPresence(ctx, presence)
}

// SendChatPresence envia status de digitando/gravando
func (w *WhatsAppService) SendChatPresence(ctx context.Context, sessionName, phone string, state model.ChatPresence, media model.ChatPresenceMedia) error {
	client, err := w.getClient(sessionName)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone number: %w", err)
	}

	return client.SendChatPresence(ctx, jid, types.ChatPresence(state), types.ChatPresenceMedia(media))
}

// MarkRead marca mensagens como lidas
func (w *WhatsAppService) MarkRead(ctx context.Context, sessionName, phone string, messageIDs []string) error {
	client, err := w.getClient(sessionName)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone number: %w", err)
	}

	ids := make([]types.MessageID, len(messageIDs))
	for i, id := range messageIDs {
		ids[i] = types.MessageID(id)
	}

	return client.MarkRead(ctx, ids, time.Now(), jid, jid)
}

// CheckPhoneRegistered verifica se número está registrado no WhatsApp
func (w *WhatsAppService) CheckPhoneRegistered(ctx context.Context, sessionName string, phones []string) ([]types.IsOnWhatsAppResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	return client.IsOnWhatsApp(ctx, phones)
}

// GetProfilePicture obtém foto de perfil
func (w *WhatsAppService) GetProfilePicture(ctx context.Context, sessionName, phone string) (*types.ProfilePictureInfo, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return nil, fmt.Errorf("invalid phone number: %w", err)
	}

	return client.GetProfilePictureInfo(ctx, jid, &whatsmeow.GetProfilePictureParams{})
}

// GetUserInfo obtém informações de usuários
func (w *WhatsAppService) GetUserInfo(ctx context.Context, sessionName string, phones []string) (map[types.JID]types.UserInfo, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	jids := make([]types.JID, len(phones))
	for i, phone := range phones {
		jid, err := parseJID(phone)
		if err != nil {
			return nil, fmt.Errorf("invalid phone number %s: %w", phone, err)
		}
		jids[i] = jid
	}

	return client.GetUserInfo(ctx, jids)
}

// DownloadMedia baixa mídia de uma mensagem
func (w *WhatsAppService) DownloadMedia(ctx context.Context, sessionName string, msg *waE2E.Message) ([]byte, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	var downloadable whatsmeow.DownloadableMessage

	switch {
	case msg.ImageMessage != nil:
		downloadable = msg.ImageMessage
	case msg.VideoMessage != nil:
		downloadable = msg.VideoMessage
	case msg.AudioMessage != nil:
		downloadable = msg.AudioMessage
	case msg.DocumentMessage != nil:
		downloadable = msg.DocumentMessage
	case msg.StickerMessage != nil:
		downloadable = msg.StickerMessage
	default:
		return nil, fmt.Errorf("message does not contain downloadable media")
	}

	return client.Download(ctx, downloadable)
}

// SendImageFromFile envia imagem de arquivo
func (w *WhatsAppService) SendImageFromFile(ctx context.Context, sessionName, phone, filePath, caption string) (whatsmeow.SendResponse, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("failed to read file: %w", err)
	}

	mimeType := "image/jpeg"
	return w.SendImage(ctx, sessionName, phone, data, caption, mimeType)
}

// SendDocumentFromFile envia documento de arquivo
func (w *WhatsAppService) SendDocumentFromFile(ctx context.Context, sessionName, phone, filePath, filename, mimeType string) (whatsmeow.SendResponse, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("failed to read file: %w", err)
	}

	return w.SendDocument(ctx, sessionName, phone, data, filename, mimeType)
}

// SendAudioFromFile envia áudio de arquivo
func (w *WhatsAppService) SendAudioFromFile(ctx context.Context, sessionName, phone, filePath string, ptt bool) (whatsmeow.SendResponse, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("failed to read file: %w", err)
	}

	mimeType := "audio/ogg; codecs=opus"
	return w.SendAudio(ctx, sessionName, phone, data, mimeType, ptt)
}

// SendVideoFromFile envia vídeo de arquivo
func (w *WhatsAppService) SendVideoFromFile(ctx context.Context, sessionName, phone, filePath, caption string) (whatsmeow.SendResponse, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("failed to read file: %w", err)
	}

	mimeType := "video/mp4"
	return w.SendVideo(ctx, sessionName, phone, data, caption, mimeType)
}

// GROUP METHODS

// CreateGroup cria um grupo
func (w *WhatsAppService) CreateGroup(ctx context.Context, sessionName, name string, participants []string) (*types.GroupInfo, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	jids := make([]types.JID, len(participants))
	for i, phone := range participants {
		jid, err := parseJID(phone)
		if err != nil {
			return nil, fmt.Errorf("invalid phone number %s: %w", phone, err)
		}
		jids[i] = jid
	}

	req := whatsmeow.ReqCreateGroup{
		Name:         name,
		Participants: jids,
	}

	return client.CreateGroup(ctx, req)
}

// GetGroupInfo obtém informações do grupo
func (w *WhatsAppService) GetGroupInfo(ctx context.Context, sessionName, groupID string) (*types.GroupInfo, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}

	return client.GetGroupInfo(ctx, jid)
}

// GetJoinedGroups lista grupos que participa
func (w *WhatsAppService) GetJoinedGroups(ctx context.Context, sessionName string) ([]*types.GroupInfo, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	return client.GetJoinedGroups(ctx)
}

// LeaveGroup sai de um grupo
func (w *WhatsAppService) LeaveGroup(ctx context.Context, sessionName, groupID string) error {
	client, err := w.getClient(sessionName)
	if err != nil {
		return err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return fmt.Errorf("invalid group ID: %w", err)
	}

	return client.LeaveGroup(ctx, jid)
}

// UpdateGroupName atualiza nome do grupo
func (w *WhatsAppService) UpdateGroupName(ctx context.Context, sessionName, groupID, name string) error {
	client, err := w.getClient(sessionName)
	if err != nil {
		return err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return fmt.Errorf("invalid group ID: %w", err)
	}

	return client.SetGroupName(ctx, jid, name)
}

// UpdateGroupTopic atualiza descrição do grupo
func (w *WhatsAppService) UpdateGroupTopic(ctx context.Context, sessionName, groupID, topic string) error {
	client, err := w.getClient(sessionName)
	if err != nil {
		return err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return fmt.Errorf("invalid group ID: %w", err)
	}

	return client.SetGroupTopic(ctx, jid, "", "", topic)
}

// AddGroupParticipants adiciona participantes ao grupo
func (w *WhatsAppService) AddGroupParticipants(ctx context.Context, sessionName, groupID string, participants []string) ([]types.GroupParticipant, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	groupJID, err := parseGroupJID(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}

	jids := make([]types.JID, len(participants))
	for i, phone := range participants {
		jid, err := parseJID(phone)
		if err != nil {
			return nil, fmt.Errorf("invalid phone number %s: %w", phone, err)
		}
		jids[i] = jid
	}

	changes, err := client.UpdateGroupParticipants(ctx, groupJID, jids, whatsmeow.ParticipantChangeAdd)
	if err != nil {
		return nil, err
	}

	result := make([]types.GroupParticipant, len(changes))
	for i, c := range changes {
		result[i] = types.GroupParticipant{JID: c.JID}
	}
	return result, nil
}

// RemoveGroupParticipants remove participantes do grupo
func (w *WhatsAppService) RemoveGroupParticipants(ctx context.Context, sessionName, groupID string, participants []string) ([]types.GroupParticipant, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	groupJID, err := parseGroupJID(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}

	jids := make([]types.JID, len(participants))
	for i, phone := range participants {
		jid, err := parseJID(phone)
		if err != nil {
			return nil, fmt.Errorf("invalid phone number %s: %w", phone, err)
		}
		jids[i] = jid
	}

	changes, err := client.UpdateGroupParticipants(ctx, groupJID, jids, whatsmeow.ParticipantChangeRemove)
	if err != nil {
		return nil, err
	}

	result := make([]types.GroupParticipant, len(changes))
	for i, c := range changes {
		result[i] = types.GroupParticipant{JID: c.JID}
	}
	return result, nil
}

// PromoteGroupParticipants promove participantes a admin
func (w *WhatsAppService) PromoteGroupParticipants(ctx context.Context, sessionName, groupID string, participants []string) ([]types.GroupParticipant, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	groupJID, err := parseGroupJID(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}

	jids := make([]types.JID, len(participants))
	for i, phone := range participants {
		jid, err := parseJID(phone)
		if err != nil {
			return nil, fmt.Errorf("invalid phone number %s: %w", phone, err)
		}
		jids[i] = jid
	}

	changes, err := client.UpdateGroupParticipants(ctx, groupJID, jids, whatsmeow.ParticipantChangePromote)
	if err != nil {
		return nil, err
	}

	result := make([]types.GroupParticipant, len(changes))
	for i, c := range changes {
		result[i] = types.GroupParticipant{JID: c.JID}
	}
	return result, nil
}

// DemoteGroupParticipants remove admin de participantes
func (w *WhatsAppService) DemoteGroupParticipants(ctx context.Context, sessionName, groupID string, participants []string) ([]types.GroupParticipant, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	groupJID, err := parseGroupJID(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group ID: %w", err)
	}

	jids := make([]types.JID, len(participants))
	for i, phone := range participants {
		jid, err := parseJID(phone)
		if err != nil {
			return nil, fmt.Errorf("invalid phone number %s: %w", phone, err)
		}
		jids[i] = jid
	}

	changes, err := client.UpdateGroupParticipants(ctx, groupJID, jids, whatsmeow.ParticipantChangeDemote)
	if err != nil {
		return nil, err
	}

	result := make([]types.GroupParticipant, len(changes))
	for i, c := range changes {
		result[i] = types.GroupParticipant{JID: c.JID}
	}
	return result, nil
}

// GetGroupInviteLink obtém link de convite do grupo
func (w *WhatsAppService) GetGroupInviteLink(ctx context.Context, sessionName, groupID string, reset bool) (string, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return "", err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return "", fmt.Errorf("invalid group ID: %w", err)
	}

	return client.GetGroupInviteLink(ctx, jid, reset)
}

// JoinGroupWithLink entra em grupo pelo link
func (w *WhatsAppService) JoinGroupWithLink(ctx context.Context, sessionName, link string) (types.JID, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return types.JID{}, err
	}

	return client.JoinGroupWithLink(ctx, link)
}

// SendGroupMessage envia mensagem para grupo
func (w *WhatsAppService) SendGroupMessage(ctx context.Context, sessionName, groupID, text string) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseGroupJID(groupID)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid group ID: %w", err)
	}

	msg := &waE2E.Message{
		Conversation: proto.String(text),
	}

	return client.SendMessage(ctx, jid, msg)
}

// CONTACT METHODS

// GetContacts obtém todos os contatos
func (w *WhatsAppService) GetContacts(ctx context.Context, sessionName string) (map[string]interface{}, error) {
	session, err := w.sessionService.Get(sessionName)
	if err != nil {
		return nil, err
	}

	contacts, err := session.Client.Store.Contacts.GetAllContacts(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get contacts: %w", err)
	}

	result := make(map[string]interface{})
	for jid, contact := range contacts {
		result[jid.String()] = map[string]interface{}{
			"pushName":     contact.PushName,
			"businessName": contact.BusinessName,
			"fullName":     contact.FullName,
			"firstName":    contact.FirstName,
		}
	}

	return result, nil
}

// SendChatPresenceRaw envia presença de chat com strings
func (w *WhatsAppService) SendChatPresenceRaw(ctx context.Context, sessionName, phone, state, media string) error {
	client, err := w.getClient(sessionName)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone number: %w", err)
	}

	var chatPresence types.ChatPresence
	switch state {
	case "composing":
		chatPresence = types.ChatPresenceComposing
	case "paused":
		chatPresence = types.ChatPresencePaused
	default:
		chatPresence = types.ChatPresencePaused
	}

	var chatMedia types.ChatPresenceMedia
	switch media {
	case "audio":
		chatMedia = types.ChatPresenceMediaAudio
	default:
		chatMedia = types.ChatPresenceMediaText
	}

	return client.SendChatPresence(ctx, jid, chatPresence, chatMedia)
}

// CHAT METHODS

// ArchiveChat arquiva ou desarquiva um chat
func (w *WhatsAppService) ArchiveChat(ctx context.Context, sessionName, phone string, archive bool) error {
	client, err := w.getClient(sessionName)
	if err != nil {
		return err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return fmt.Errorf("invalid phone number: %w", err)
	}

	return client.SendAppState(ctx, appstate.BuildArchive(jid, archive, time.Time{}, nil))
}

// DeleteMessage deleta uma mensagem
func (w *WhatsAppService) DeleteMessage(ctx context.Context, sessionName, phone, messageID string, forMe bool) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	if forMe {
		return client.SendMessage(ctx, jid, client.BuildRevoke(jid, types.EmptyJID, messageID))
	}

	return client.SendMessage(ctx, jid, client.BuildRevoke(jid, jid, messageID))
}

// EditMessage edita uma mensagem
func (w *WhatsAppService) EditMessage(ctx context.Context, sessionName, phone, messageID, newText string) (whatsmeow.SendResponse, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return whatsmeow.SendResponse{}, err
	}

	jid, err := parseJID(phone)
	if err != nil {
		return whatsmeow.SendResponse{}, fmt.Errorf("invalid phone number: %w", err)
	}

	return client.SendMessage(ctx, jid, client.BuildEdit(jid, messageID, &waE2E.Message{
		Conversation: proto.String(newText),
	}))
}

// PROFILE METHODS

// GetOwnProfile obtém o perfil próprio
func (w *WhatsAppService) GetOwnProfile(ctx context.Context, sessionName string) (map[string]interface{}, error) {
	session, err := w.sessionService.Get(sessionName)
	if err != nil {
		return nil, err
	}

	client := session.Client
	if client.Store.ID == nil {
		return nil, fmt.Errorf("session not authenticated")
	}

	profile := map[string]interface{}{
		"jid":      client.Store.ID.String(),
		"pushName": client.Store.PushName,
	}

	return profile, nil
}

// SetStatusMessage define a mensagem de status
func (w *WhatsAppService) SetStatusMessage(ctx context.Context, sessionName, status string) error {
	client, err := w.getClient(sessionName)
	if err != nil {
		return err
	}

	return client.SetStatusMessage(ctx, status)
}

// SetPushName define o nome de exibição
func (w *WhatsAppService) SetPushName(ctx context.Context, sessionName, name string) error {
	session, err := w.sessionService.Get(sessionName)
	if err != nil {
		return err
	}

	session.Client.Store.PushName = name
	return nil
}

// SetProfilePicture define a foto de perfil
func (w *WhatsAppService) SetProfilePicture(ctx context.Context, sessionName string, imageData []byte) (string, error) {
	session, err := w.sessionService.Get(sessionName)
	if err != nil {
		return "", err
	}

	if session.Client.Store.ID == nil {
		return "", fmt.Errorf("session not authenticated")
	}

	pictureID, err := session.Client.SetGroupPhoto(ctx, *session.Client.Store.ID, imageData)
	if err != nil {
		return "", fmt.Errorf("failed to set profile picture: %w", err)
	}

	return pictureID, nil
}

// DeleteProfilePicture remove a foto de perfil
func (w *WhatsAppService) DeleteProfilePicture(ctx context.Context, sessionName string) error {
	session, err := w.sessionService.Get(sessionName)
	if err != nil {
		return err
	}

	if session.Client.Store.ID == nil {
		return fmt.Errorf("session not authenticated")
	}

	_, err = session.Client.SetGroupPhoto(ctx, *session.Client.Store.ID, nil)
	return err
}

// GetPrivacySettings obtém configurações de privacidade
func (w *WhatsAppService) GetPrivacySettings(ctx context.Context, sessionName string) (map[string]interface{}, error) {
	client, err := w.getClient(sessionName)
	if err != nil {
		return nil, err
	}

	settings, err := client.GetPrivacySettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get privacy settings: %w", err)
	}

	return map[string]interface{}{
		"groupAdd":       string(settings.GroupAdd),
		"lastSeen":       string(settings.LastSeen),
		"status":         string(settings.Status),
		"profile":        string(settings.Profile),
		"readReceipts":   string(settings.ReadReceipts),
		"callAdd":        string(settings.CallAdd),
		"online":         string(settings.Online),
	}, nil
}

// SetPrivacySettings define configurações de privacidade
func (w *WhatsAppService) SetPrivacySettings(ctx context.Context, sessionName string, settings map[string]string, readReceipts bool) error {
	client, err := w.getClient(sessionName)
	if err != nil {
		return err
	}

	privacySettings := types.PrivacySettings{}
	
	if v, ok := settings["lastSeen"]; ok {
		privacySettings.LastSeen = types.PrivacySetting(v)
	}
	if v, ok := settings["profilePicture"]; ok {
		privacySettings.Profile = types.PrivacySetting(v)
	}
	if v, ok := settings["status"]; ok {
		privacySettings.Status = types.PrivacySetting(v)
	}
	if v, ok := settings["groupsAdd"]; ok {
		privacySettings.GroupAdd = types.PrivacySetting(v)
	}
	if readReceipts {
		privacySettings.ReadReceipts = types.PrivacySettingAll
	} else {
		privacySettings.ReadReceipts = types.PrivacySettingNone
	}

	return client.SetPrivacySettings(ctx, privacySettings)
}
