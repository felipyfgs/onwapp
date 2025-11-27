package model

// EventType represents a webhook event type
type EventType string

// Connection events
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

// Message events
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

// Presence events
const (
	EventPresenceUpdate EventType = "presence.update"
	EventChatPresence   EventType = "chat.presence"
)

// Sync events
const (
	EventHistorySync          EventType = "history.sync"
	EventOfflineSyncPreview   EventType = "sync.offline_preview"
	EventOfflineSyncCompleted EventType = "sync.offline_completed"
	EventAppStateSync         EventType = "sync.app_state"
	EventAppStateSyncComplete EventType = "sync.app_state_complete"
)

// Contact events
const (
	EventContactPushName     EventType = "contact.push_name"
	EventContactPicture      EventType = "contact.picture"
	EventContactUpdate       EventType = "contact.update"
	EventContactBusinessName EventType = "contact.business_name"
	EventContactAbout        EventType = "contact.about"
)

// Call events
const (
	EventCallOffer       EventType = "call.offer"
	EventCallOfferNotice EventType = "call.offer_notice"
	EventCallAccept      EventType = "call.accept"
	EventCallPreAccept   EventType = "call.pre_accept"
	EventCallReject      EventType = "call.reject"
	EventCallTerminate   EventType = "call.terminate"
	EventCallTransport   EventType = "call.transport"
	EventCallRelayLatency EventType = "call.relay_latency"
)

// Group events
const (
	EventGroupUpdate       EventType = "group.update"
	EventGroupJoined       EventType = "group.joined"
	EventGroupParticipants EventType = "group.participants"
)

// Privacy events
const (
	EventPrivacySettings EventType = "privacy.settings"
	EventIdentityChange  EventType = "privacy.identity_change"
	EventBlocklist       EventType = "privacy.blocklist"
)

// Newsletter (Channel) events
const (
	EventNewsletterJoin       EventType = "newsletter.join"
	EventNewsletterLeave      EventType = "newsletter.leave"
	EventNewsletterMuteChange EventType = "newsletter.mute_change"
	EventNewsletterLiveUpdate EventType = "newsletter.live_update"
)

// Chat management events (AppState)
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

// Wildcard event
const (
	EventAll EventType = "*"
)

// AllEvents returns all available event types for documentation/validation
func AllEvents() []EventType {
	return []EventType{
		// Connection
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
		// Messages
		EventMessageReceived,
		EventMessageSent,
		EventMessageReceipt,
		EventMessageReaction,
		EventMessageDeleted,
		EventMessageEdited,
		EventMessageUndecryptable,
		EventMediaRetry,
		// Presence
		EventPresenceUpdate,
		EventChatPresence,
		// Sync
		EventHistorySync,
		EventOfflineSyncPreview,
		EventOfflineSyncCompleted,
		EventAppStateSync,
		EventAppStateSyncComplete,
		// Contacts
		EventContactPushName,
		EventContactPicture,
		EventContactUpdate,
		EventContactBusinessName,
		EventContactAbout,
		// Calls
		EventCallOffer,
		EventCallOfferNotice,
		EventCallAccept,
		EventCallPreAccept,
		EventCallReject,
		EventCallTerminate,
		EventCallTransport,
		EventCallRelayLatency,
		// Groups
		EventGroupUpdate,
		EventGroupJoined,
		EventGroupParticipants,
		// Privacy
		EventPrivacySettings,
		EventIdentityChange,
		EventBlocklist,
		// Newsletter
		EventNewsletterJoin,
		EventNewsletterLeave,
		EventNewsletterMuteChange,
		EventNewsletterLiveUpdate,
		// Chat management
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

// EventCategories groups events by category for documentation
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
