package event

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"go.mau.fi/whatsmeow/proto/waHistorySync"
	"go.mau.fi/whatsmeow/proto/waWeb"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"

	"onwapp/internal/logger"
	"onwapp/internal/model"
)

func (s *Service) handleConnected(ctx context.Context, session *model.Session) {
	session.SetStatus(model.StatusConnected)
	session.SetQR("")

	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "connected").
		Msg("Session connected")

	if session.Client.Store.ID != nil {
		jid := session.Client.Store.ID.String()
		phone := session.Client.Store.ID.User
		if err := s.database.Sessions.UpdateJID(ctx, session.Session, jid, phone); err != nil {
			logger.WPP().Error().Err(err).Str("session", session.Session).Msg("Failed to update session JID/phone")
		}
	}

	if err := s.database.Sessions.UpdateStatus(ctx, session.Session, "connected"); err != nil {
		logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to update session status")
	}

	// Ensure settings exist for this session
	if s.settingsProvider != nil {
		if err := s.settingsProvider.EnsureExists(ctx, session.ID); err != nil {
			logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to ensure settings exist")
		}
	}

	// Sync privacy settings from WhatsApp to database and check keepOnline
	if s.settingsProvider != nil {
		go func() {
			syncCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()

			// Sync privacy settings
			if s.privacyGetter != nil {
				privacy, err := s.privacyGetter.GetPrivacySettingsAsStrings(syncCtx, session.Session)
				if err != nil {
					logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to get privacy settings from WhatsApp")
				} else if err := s.settingsProvider.SyncPrivacyFromWhatsApp(syncCtx, session.ID, privacy); err != nil {
					logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to sync privacy settings to database")
				} else {
					logger.WPP().Info().Str("session", session.Session).Msg("Privacy settings synced from WhatsApp")
				}
			}

			// Check if keepOnline is enabled and start presence loop
			alwaysOnline, _, err := s.settingsProvider.GetBySessionID(syncCtx, session.ID)
			if err == nil && alwaysOnline && s.presenceSender != nil {
				s.startKeepOnline(session)
			}
		}()
	}

	s.sendWebhook(ctx, session, string(model.EventSessionConnected), nil)
}

// startKeepOnline starts a goroutine that periodically sends online presence
func (s *Service) startKeepOnline(session *model.Session) {
	logger.WPP().Info().Str("session", session.Session).Msg("Starting keepOnline")

	go func() {
		ticker := time.NewTicker(4 * time.Minute)
		defer ticker.Stop()

		// Send initial presence
		ctx := context.Background()
		if err := s.presenceSender.SendPresence(ctx, session.Session, true); err != nil {
			logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to send initial online presence")
		}

		for range ticker.C {
			// Check if session is still connected
			if session.GetStatus() != model.StatusConnected {
				logger.WPP().Debug().Str("session", session.Session).Msg("Session disconnected, stopping keepOnline")
				return
			}

			// Check if alwaysOnline is still enabled
			if s.settingsProvider != nil {
				alwaysOnline, _, err := s.settingsProvider.GetBySessionID(ctx, session.ID)
				if err != nil || !alwaysOnline {
					logger.WPP().Info().Str("session", session.Session).Msg("AlwaysOnline disabled, stopping keepOnline")
					return
				}
			}

			// Send presence
			if err := s.presenceSender.SendPresence(ctx, session.Session, true); err != nil {
				logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to send keepOnline presence")
			} else {
				logger.WPP().Debug().Str("session", session.Session).Msg("KeepOnline presence sent")
			}
		}
	}()
}

func (s *Service) handleDisconnected(ctx context.Context, session *model.Session) {
	session.SetStatus(model.StatusDisconnected)

	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "disconnected").
		Msg("Session disconnected")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Session, "disconnected"); err != nil {
		logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, string(model.EventSessionDisconnected), nil)
}

func (s *Service) handleLoggedOut(ctx context.Context, session *model.Session, e *events.LoggedOut) {
	session.SetStatus(model.StatusDisconnected)

	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "logged_out").
		Str("reason", e.Reason.String()).
		Msg("Session logged out")

	if session.Client != nil {
		session.Client.Disconnect()
		if session.Client.Store != nil {
			if err := session.Client.Store.Delete(ctx); err != nil {
				logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to delete device store")
			}
		}
	}

	if err := s.database.Sessions.UpdateJID(ctx, session.Session, "", ""); err != nil {
		logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to clear device JID")
	}

	if err := s.database.Sessions.UpdateStatus(ctx, session.Session, "disconnected"); err != nil {
		logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, string(model.EventSessionLoggedOut), e)
}

func (s *Service) handleConnectFailure(ctx context.Context, session *model.Session, e *events.ConnectFailure) {
	session.SetStatus(model.StatusDisconnected)

	logger.WPP().Error().
		Str("session", session.Session).
		Str("event", "connect_failure").
		Int("reason", int(e.Reason)).
		Str("message", e.Message).
		Msg("Connection failed")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Session, "disconnected"); err != nil {
		logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, string(model.EventConnectFailure), e)
}

func (s *Service) handleStreamReplaced(ctx context.Context, session *model.Session, e *events.StreamReplaced) {
	session.SetStatus(model.StatusDisconnected)

	logger.WPP().Warn().
		Str("session", session.Session).
		Str("event", "stream_replaced").
		Msg("Stream replaced by another connection")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Session, "disconnected"); err != nil {
		logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, string(model.EventStreamReplaced), e)
}

func (s *Service) handleStreamError(ctx context.Context, session *model.Session, e *events.StreamError) {
	logger.WPP().Error().
		Str("session", session.Session).
		Str("event", "stream_error").
		Str("code", e.Code).
		Msg("Stream error")

	s.sendWebhook(ctx, session, string(model.EventStreamError), e)
}

func (s *Service) handleTemporaryBan(ctx context.Context, session *model.Session, e *events.TemporaryBan) {
	session.SetStatus(model.StatusDisconnected)

	logger.WPP().Error().
		Str("session", session.Session).
		Str("event", "temporary_ban").
		Int("code", int(e.Code)).
		Dur("expire", e.Expire).
		Msg("Temporarily banned")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Session, "banned"); err != nil {
		logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, string(model.EventTemporaryBan), e)
}

func (s *Service) handleClientOutdated(ctx context.Context, session *model.Session, e *events.ClientOutdated) {
	session.SetStatus(model.StatusDisconnected)

	logger.WPP().Error().
		Str("session", session.Session).
		Str("event", "client_outdated").
		Msg("Client version outdated")

	if err := s.database.Sessions.UpdateStatus(ctx, session.Session, "outdated"); err != nil {
		logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to update session status")
	}

	s.sendWebhook(ctx, session, string(model.EventClientOutdated), e)
}

func (s *Service) handleKeepAliveTimeout(ctx context.Context, session *model.Session, e *events.KeepAliveTimeout) {
	logger.WPP().Warn().
		Str("session", session.Session).
		Str("event", "keepalive_timeout").
		Int("errorCount", e.ErrorCount).
		Time("lastSuccess", e.LastSuccess).
		Msg("Keep alive timeout")

	s.sendWebhook(ctx, session, string(model.EventKeepAliveTimeout), e)
}

func (s *Service) handleKeepAliveRestored(ctx context.Context, session *model.Session, e *events.KeepAliveRestored) {
	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "keepalive_restored").
		Msg("Keep alive restored")

	s.sendWebhook(ctx, session, string(model.EventKeepAliveRestored), e)
}

func (s *Service) handlePairSuccess(ctx context.Context, session *model.Session, e *events.PairSuccess) {
	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "pair_success").
		Str("jid", e.ID.String()).
		Str("platform", e.Platform).
		Str("businessName", e.BusinessName).
		Msg("Pairing successful")

	s.sendWebhook(ctx, session, string(model.EventPairSuccess), e)
}

func (s *Service) handlePairError(ctx context.Context, session *model.Session, e *events.PairError) {
	logger.WPP().Error().
		Str("session", session.Session).
		Str("event", "pair_error").
		Str("id", e.ID.String()).
		Str("businessName", e.BusinessName).
		Msg("Pairing error")

	s.sendWebhook(ctx, session, string(model.EventPairError), e)
}

// Sync events

func (s *Service) handleHistorySync(ctx context.Context, session *model.Session, e *events.HistorySync) {
	syncType := e.Data.GetSyncType().String()
	chunkOrder := e.Data.GetChunkOrder()
	progress := e.Data.GetProgress()
	conversations := e.Data.GetConversations()

	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "history_sync").
		Str("syncType", syncType).
		Uint32("chunkOrder", chunkOrder).
		Uint32("progress", progress).
		Int("conversations", len(conversations)).
		Msg("History sync received")

	s.saveHistorySyncToJSON(session.Session, e, syncType, chunkOrder)

	if e.Data.GetSyncType() == waHistorySync.HistorySync_PUSH_NAME {
		s.handlePushNameSync(ctx, session, e.Data.GetPushnames())
		return
	}

	totalMsgs := 0
	for _, conv := range conversations {
		totalMsgs += len(conv.GetMessages())
	}

	allMessages := make([]*model.Message, 0, totalMsgs)
	allMedias := make([]*model.Media, 0, totalMsgs/4)

	for _, conv := range conversations {
		chatJID := conv.GetID()
		msgs := conv.GetMessages()

		for _, histMsg := range msgs {
			webMsg := histMsg.GetMessage()
			if webMsg == nil {
				continue
			}

			key := webMsg.GetKey()
			if key == nil || key.GetID() == "" {
				continue
			}

			var msgOrderID *int64
			if orderID := histMsg.GetMsgOrderID(); orderID > 0 {
				oid := int64(orderID)
				msgOrderID = &oid
			}

			var stubType *int
			var stubParams []string
			if st := webMsg.GetMessageStubType(); st != 0 {
				stInt := int(st)
				stubType = &stInt
				stubParams = webMsg.GetMessageStubParameters()
			}

			var messageSecret []byte
			if webMsg.GetMessageSecret() != nil {
				messageSecret = webMsg.GetMessageSecret()
			} else if webMsg.GetMessage() != nil {
				if ctx := webMsg.GetMessage().GetMessageContextInfo(); ctx != nil {
					messageSecret = ctx.GetMessageSecret()
				}
			}

			if webMsg.GetMessage() != nil && webMsg.GetMessage().GetSenderKeyDistributionMessage() != nil {
				continue
			}

			msgType, content := s.extractMessageTypeAndContent(webMsg.GetMessage())

			if stubType != nil && *stubType > 0 {
				msgType = "system"
			} else if msgType == "unknown" && content == "" {
				continue
			}

			senderJID := key.GetRemoteJID()
			if key.GetParticipant() != "" {
				senderJID = key.GetParticipant()
			} else if webMsg.GetParticipant() != "" {
				senderJID = webMsg.GetParticipant()
			}

			timestamp := time.Unix(int64(webMsg.GetMessageTimestamp()), 0)
			isGroup := strings.HasSuffix(chatJID, "@g.us")

			rawEvent, _ := json.Marshal(map[string]interface{}{
				"historySyncMsg": histMsg,
				"webMessageInfo": webMsg,
				"syncType":       syncType,
				"chunkOrder":     chunkOrder,
			})

			status := model.MessageStatusSent
			if !key.GetFromMe() {
				status = model.MessageStatusDelivered
			}

			var reactionsJSON []byte
			if reactions := webMsg.GetReactions(); len(reactions) > 0 {
				reactionsJSON = s.buildReactionsJSON(reactions)
			}

			broadcast := key.GetRemoteJID() == "status@broadcast" ||
				webMsg.GetBroadcast() ||
				(webMsg.GetMessage() != nil && webMsg.GetMessage().GetSenderKeyDistributionMessage() != nil)

			msg := &model.Message{
				SessionID:     session.ID,
				MsgId:         key.GetID(),
				ChatJID:       chatJID,
				SenderJID:     senderJID,
				Timestamp:     timestamp,
				PushName:      webMsg.GetPushName(),
				Type:          msgType,
				Content:       content,
				FromMe:        key.GetFromMe(),
				IsGroup:       isGroup,
				Ephemeral:     webMsg.GetEphemeralDuration() > 0,
				Status:        status,
				RawEvent:      rawEvent,
				Reactions:     reactionsJSON,
				MsgOrderID:    msgOrderID,
				StubType:      stubType,
				StubParams:    stubParams,
				MessageSecret: messageSecret,
				Broadcast:     broadcast,
				QuotedID:      extractQuotedID(webMsg.GetMessage()),
				QuotedSender:  extractQuotedSender(webMsg.GetMessage()),
			}

			allMessages = append(allMessages, msg)

			if len(webMsg.GetReactions()) > 0 {
				s.saveHistoryReactions(ctx, session.ID, key.GetID(), webMsg.GetReactions())
			}

			if media := s.extractMediaInfo(session.ID, key.GetID(), webMsg.GetMessage()); media != nil {
				allMedias = append(allMedias, media)
			}
		}
	}

	if len(allMessages) > 0 {
		if session.Client != nil && session.Client.Store != nil && session.Client.Store.Contacts != nil {
			allContacts, err := session.Client.Store.Contacts.GetAllContacts(ctx)
			if err == nil && len(allContacts) > 0 {
				enriched := 0
				for _, msg := range allMessages {
					if msg.PushName == "" && msg.SenderJID != "" {
						senderJID, err := types.ParseJID(msg.SenderJID)
						if err != nil {
							continue
						}
						if contact, ok := allContacts[senderJID]; ok {
							name := contact.PushName
							if name == "" {
								name = contact.FullName
							}
							if name == "" {
								name = contact.FirstName
							}
							if name != "" {
								msg.PushName = name
								enriched++
							}
						}
					}
				}

				if enriched > 0 {
					logger.WPP().Debug().
						Int("enriched", enriched).
						Int("total", len(allMessages)).
						Msg("Enriched messages with pushNames from whatsmeow contacts")
				}
			}
		}

		saved, err := s.database.Messages.SaveBatch(ctx, allMessages)
		if err != nil {
			logger.WPP().Error().
				Err(err).
				Str("session", session.Session).
				Int("total", len(allMessages)).
				Msg("Failed to save history sync messages")
		} else {
			logger.WPP().Info().
				Str("session", session.Session).
				Str("syncType", syncType).
				Uint32("chunkOrder", chunkOrder).
				Int("totalMessages", totalMsgs).
				Int("processed", len(allMessages)).
				Int("saved", saved).
				Int("skipped", len(allMessages)-saved).
				Msg("History sync messages saved")
		}
	}

	if len(allMedias) > 0 {
		savedMedia, err := s.database.Media.SaveBatch(ctx, allMedias)
		if err != nil {
			logger.WPP().Error().
				Err(err).
				Str("session", session.Session).
				Int("total", len(allMedias)).
				Msg("Failed to save history sync media")
		} else {
			logger.WPP().Info().
				Str("session", session.Session).
				Str("syncType", syncType).
				Uint32("chunkOrder", chunkOrder).
				Int("totalMedia", len(allMedias)).
				Int("saved", savedMedia).
				Msg("History sync media info saved")

			if s.mediaService != nil && session.Client != nil && savedMedia > 0 {
				s.mediaService.ProcessHistorySyncMedia(ctx, session.Client, session.ID, savedMedia)
			}
		}
	}

	if s.historySyncService != nil {
		go func() {
			hsCtx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
			defer cancel()
			if err := s.historySyncService.ProcessHistorySync(hsCtx, session.ID, e); err != nil {
				logger.WPP().Warn().Err(err).Str("session", session.Session).Msg("Failed to process history sync metadata")
			}
		}()
	}

	s.sendWebhook(ctx, session, string(model.EventHistorySync), e)
}

func (s *Service) buildReactionsJSON(reactions []*waWeb.Reaction) []byte {
	if len(reactions) == 0 {
		return nil
	}

	reactionsList := make([]map[string]interface{}, 0, len(reactions))
	for _, r := range reactions {
		if r.GetKey() == nil {
			continue
		}
		reactionsList = append(reactionsList, map[string]interface{}{
			"emoji":     r.GetText(),
			"senderJid": r.GetKey().GetRemoteJID(),
			"timestamp": r.GetSenderTimestampMS(),
		})
	}

	if len(reactionsList) == 0 {
		return nil
	}

	data, _ := json.Marshal(reactionsList)
	return data
}

func (s *Service) saveHistoryReactions(ctx context.Context, sessionID, msgID string, reactions []*waWeb.Reaction) {
	for _, r := range reactions {
		if r.GetKey() == nil || r.GetText() == "" {
			continue
		}

		senderJid := r.GetKey().GetRemoteJID()
		timestamp := time.UnixMilli(r.GetSenderTimestampMS())

		data, _ := json.Marshal(map[string]interface{}{
			"action":    "add",
			"emoji":     r.GetText(),
			"timestamp": r.GetSenderTimestampMS(),
			"source":    "history_sync",
		})

		update := &model.MessageUpdate{
			SessionID: sessionID,
			MsgID:     msgID,
			Type:      model.UpdateTypeReaction,
			Actor:     senderJid,
			Data:      data,
			EventAt:   timestamp,
		}

		if _, err := s.database.MessageUpdates.Save(ctx, update); err != nil {
			logger.WPP().Warn().Err(err).Str("msgId", msgID).Msg("Failed to save history reaction")
		}
	}
}

func (s *Service) handlePushNameSync(ctx context.Context, session *model.Session, pushnames []*waHistorySync.Pushname) {
	if len(pushnames) == 0 {
		return
	}

	logger.WPP().Debug().
		Str("session", session.Session).
		Int("count", len(pushnames)).
		Msg("Push name sync received")

	phoneToName := make(map[string]string, len(pushnames))
	lidToName := make(map[string]string, len(pushnames)/4)

	for _, pn := range pushnames {
		jid := pn.GetID()
		name := pn.GetPushname()
		if jid == "" || name == "" {
			continue
		}

		if strings.HasSuffix(jid, "@lid") {
			lidToName[jid] = name
		} else {
			phoneToName[jid] = name
		}
	}

	if len(phoneToName) > 0 {
		var updated int64
		for phoneJID, name := range phoneToName {
			affected, err := s.database.Messages.UpdatePushNameByJID(ctx, session.ID, phoneJID, name)
			if err == nil {
				updated += affected
			}
		}
		if updated > 0 {
			logger.WPP().Debug().Int64("updated", updated).Msg("Updated messages with pushNames from phone JIDs")
		}
	}

	if len(lidToName) > 0 {
		var updated int64
		for lidJID, name := range lidToName {
			lidNum := strings.TrimSuffix(lidJID, "@lid")
			if colonIdx := strings.Index(lidNum, ":"); colonIdx > 0 {
				lidNum = lidNum[:colonIdx]
			}

			affected, err := s.database.Messages.UpdatePushNameByLIDPattern(ctx, session.ID, lidNum+"%@lid", name)
			if err == nil {
				updated += affected
			}
		}
		if updated > 0 {
			logger.WPP().Debug().Int64("updated", updated).Msg("Updated messages with pushNames from LID JIDs")
		}
	}

	if len(phoneToName) > 0 && session.Client != nil && session.Client.Store != nil && session.Client.Store.LIDs != nil {
		var pnJIDs []types.JID
		for phoneJID := range phoneToName {
			if pn, err := types.ParseJID(phoneJID); err == nil {
				pnJIDs = append(pnJIDs, pn)
			}
		}

		if len(pnJIDs) > 0 {
			pnToLID, err := session.Client.Store.LIDs.GetManyLIDsForPNs(ctx, pnJIDs)
			if err == nil && len(pnToLID) > 0 {
				var updated int64
				for pn, lid := range pnToLID {
					if lid.IsEmpty() {
						continue
					}
					phoneJID := pn.String()
					if name, ok := phoneToName[phoneJID]; ok && name != "" {
						lidNum := lid.User
						affected, err := s.database.Messages.UpdatePushNameByLIDPattern(ctx, session.ID, lidNum+"%@lid", name)
						if err == nil {
							updated += affected
						}
					}
				}
				if updated > 0 {
					logger.WPP().Debug().Int64("updated", updated).Msg("Updated LID messages with pushNames via whatsmeow LID store")
				}
			}
		}
	}
}

func (s *Service) handleOfflineSyncPreview(ctx context.Context, session *model.Session, e *events.OfflineSyncPreview) {
	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "offline_sync_preview").
		Int("messages", e.Messages).
		Int("receipts", e.Receipts).
		Int("notifications", e.Notifications).
		Msg("Offline sync preview")
}

func (s *Service) handleOfflineSyncCompleted(ctx context.Context, session *model.Session, e *events.OfflineSyncCompleted) {
	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "offline_sync_completed").
		Int("count", e.Count).
		Msg("Offline sync completed")
}

func (s *Service) handleAppState(ctx context.Context, session *model.Session, e *events.AppState) {
	logger.WPP().Debug().
		Str("session", session.Session).
		Str("event", "app_state").
		Strs("index", e.Index).
		Msg("App state received")

	s.sendWebhook(ctx, session, string(model.EventAppStateSync), e)
}

func (s *Service) handleAppStateSyncComplete(ctx context.Context, session *model.Session, e *events.AppStateSyncComplete) {
	logger.WPP().Info().
		Str("session", session.Session).
		Str("event", "app_state_sync_complete").
		Str("name", string(e.Name)).
		Msg("App state sync complete")

	s.sendWebhook(ctx, session, string(model.EventAppStateSyncComplete), e)
}
