package model

type EventType string

const (
	EventSessionConnected    EventType = "session.connected"
	EventSessionDisconnected EventType = "session.disconnected"
	EventSessionLoggedOut    EventType = "session.logged_out"
	EventSessionQR           EventType = "session.qr"
	EventConnectFailure      EventType = "session.connect_failure"
	EventStreamReplaced      EventType = "session.stream_replaced"
	EventStreamError         EventType = "session.stream_error"
	EventTemporaryBan        EventType = "session.temporary_ban"
	EventClientOutdated      EventType = "session.client_outdated"
	EventKeepAliveTimeout    EventType = "session.keepalive_timeout"
	EventKeepAliveRestored   EventType = "session.keepalive_restored"
	EventPairSuccess         EventType = "session.pair_success"
	EventPairError           EventType = "session.pair_error"
)

const (
	EventMessageReceived      EventType = "message.received"
	EventMessageSent          EventType = "message.sent"
	EventMessageReceipt       EventType = "message.receipt"
	EventMessageReaction      EventType = "message.reaction"
	EventMessageDeleted       EventType = "message.deleted"
	EventMessageEdited        EventType = "message.edited"
	EventMessageUndecryptable EventType = "message.undecryptable"
	EventMediaRetry           EventType = "message.media_retry"
)

const (
	EventPresenceUpdate EventType = "presence.update"
	EventChatPresence   EventType = "chat.presence"
)

const (
	EventHistorySync          EventType = "history.sync"
	EventOfflineSyncPreview   EventType = "sync.offline_preview"
	EventOfflineSyncCompleted EventType = "sync.offline_completed"
	EventAppStateSync         EventType = "sync.app_state"
	EventAppStateSyncComplete EventType = "sync.app_state_complete"
)

const (
	EventContactPushName     EventType = "contact.push_name"
	EventContactPicture      EventType = "contact.picture"
	EventContactUpdate       EventType = "contact.update"
	EventContactBusinessName EventType = "contact.business_name"
	EventContactAbout        EventType = "contact.about"
)

const (
	EventCallOffer        EventType = "call.offer"
	EventCallOfferNotice  EventType = "call.offer_notice"
	EventCallAccept       EventType = "call.accept"
	EventCallPreAccept    EventType = "call.pre_accept"
	EventCallReject       EventType = "call.reject"
	EventCallTerminate    EventType = "call.terminate"
	EventCallTransport    EventType = "call.transport"
	EventCallRelayLatency EventType = "call.relay_latency"
)

const (
	EventGroupUpdate       EventType = "group.update"
	EventGroupJoined       EventType = "group.joined"
	EventGroupParticipants EventType = "group.participants"
)

const (
	EventPrivacySettings EventType = "privacy.settings"
	EventIdentityChange  EventType = "privacy.identity_change"
	EventBlocklist       EventType = "privacy.blocklist"
)

const (
	EventNewsletterJoin       EventType = "newsletter.join"
	EventNewsletterLeave      EventType = "newsletter.leave"
	EventNewsletterMuteChange EventType = "newsletter.mute_change"
	EventNewsletterLiveUpdate EventType = "newsletter.live_update"
)

const (
	EventChatArchive      EventType = "chat.archive"
	EventChatPin          EventType = "chat.pin"
	EventChatMute         EventType = "chat.mute"
	EventChatStar         EventType = "chat.star"
	EventChatDeleteForMe  EventType = "chat.delete_for_me"
	EventChatDelete       EventType = "chat.delete"
	EventChatClear        EventType = "chat.clear"
	EventChatMarkAsRead   EventType = "chat.mark_as_read"
	EventLabelEdit        EventType = "chat.label_edit"
	EventLabelAssociation EventType = "chat.label_association"
)

const (
	EventAll EventType = "*"
)

func AllEvents() []EventType {
	return []EventType{
		EventSessionConnected,
		EventSessionDisconnected,
		EventSessionLoggedOut,
		EventSessionQR,
		EventConnectFailure,
		EventStreamReplaced,
		EventStreamError,
		EventTemporaryBan,
		EventClientOutdated,
		EventKeepAliveTimeout,
		EventKeepAliveRestored,
		EventPairSuccess,
		EventPairError,
		EventMessageReceived,
		EventMessageSent,
		EventMessageReceipt,
		EventMessageReaction,
		EventMessageDeleted,
		EventMessageEdited,
		EventMessageUndecryptable,
		EventMediaRetry,
		EventPresenceUpdate,
		EventChatPresence,
		EventHistorySync,
		EventOfflineSyncPreview,
		EventOfflineSyncCompleted,
		EventAppStateSync,
		EventAppStateSyncComplete,
		EventContactPushName,
		EventContactPicture,
		EventContactUpdate,
		EventContactBusinessName,
		EventContactAbout,
		EventCallOffer,
		EventCallOfferNotice,
		EventCallAccept,
		EventCallPreAccept,
		EventCallReject,
		EventCallTerminate,
		EventCallTransport,
		EventCallRelayLatency,
		EventGroupUpdate,
		EventGroupJoined,
		EventGroupParticipants,
		EventPrivacySettings,
		EventIdentityChange,
		EventBlocklist,
		EventNewsletterJoin,
		EventNewsletterLeave,
		EventNewsletterMuteChange,
		EventNewsletterLiveUpdate,
		EventChatArchive,
		EventChatPin,
		EventChatMute,
		EventChatStar,
		EventChatDeleteForMe,
		EventChatDelete,
		EventChatClear,
		EventChatMarkAsRead,
		EventLabelEdit,
		EventLabelAssociation,
	}
}

var EventCategories = map[string][]EventType{
	"session": {
		EventSessionConnected,
		EventSessionDisconnected,
		EventSessionLoggedOut,
		EventSessionQR,
		EventConnectFailure,
		EventStreamReplaced,
		EventStreamError,
		EventTemporaryBan,
		EventClientOutdated,
		EventKeepAliveTimeout,
		EventKeepAliveRestored,
		EventPairSuccess,
		EventPairError,
	},
	"message": {
		EventMessageReceived,
		EventMessageSent,
		EventMessageReceipt,
		EventMessageReaction,
		EventMessageDeleted,
		EventMessageEdited,
		EventMessageUndecryptable,
		EventMediaRetry,
	},
	"presence": {
		EventPresenceUpdate,
		EventChatPresence,
	},
	"sync": {
		EventHistorySync,
		EventOfflineSyncPreview,
		EventOfflineSyncCompleted,
		EventAppStateSync,
		EventAppStateSyncComplete,
	},
	"contact": {
		EventContactPushName,
		EventContactPicture,
		EventContactUpdate,
		EventContactBusinessName,
		EventContactAbout,
	},
	"call": {
		EventCallOffer,
		EventCallOfferNotice,
		EventCallAccept,
		EventCallPreAccept,
		EventCallReject,
		EventCallTerminate,
		EventCallTransport,
		EventCallRelayLatency,
	},
	"group": {
		EventGroupUpdate,
		EventGroupJoined,
		EventGroupParticipants,
	},
	"privacy": {
		EventPrivacySettings,
		EventIdentityChange,
		EventBlocklist,
	},
	"newsletter": {
		EventNewsletterJoin,
		EventNewsletterLeave,
		EventNewsletterMuteChange,
		EventNewsletterLiveUpdate,
	},
	"chat": {
		EventChatArchive,
		EventChatPin,
		EventChatMute,
		EventChatStar,
		EventChatDeleteForMe,
		EventChatDelete,
		EventChatClear,
		EventChatMarkAsRead,
		EventLabelEdit,
		EventLabelAssociation,
	},
}
