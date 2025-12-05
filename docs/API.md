# OnWapp API Reference

Complete REST API documentation for OnWapp - WhatsApp API Bridge.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Health & Status](#health--status)
- [Sessions](#sessions)
  - [List All Sessions](#list-all-sessions)
  - [Create Session](#create-session)
  - [Get Session Info](#get-session-info)
  - [Delete Session](#delete-session)
  - [Connect Session](#connect-session)
  - [Get QR Code](#get-qr-code)
  - [Pair with Phone Number](#pair-with-phone-number)
  - [Disconnect Session](#disconnect-session)
  - [Logout Session](#logout-session)
  - [Restart Session](#restart-session)
- [Profile](#profile)
  - [Get Profile](#get-profile)
  - [Set Status Message](#set-status-message)
  - [Set Push Name](#set-push-name)
  - [Set Profile Picture](#set-profile-picture)
  - [Delete Profile Picture](#delete-profile-picture)
- [Settings](#settings)
  - [Get Settings](#get-settings)
  - [Update Settings](#update-settings)
- [Presence](#presence)
  - [Set Presence](#set-presence)
  - [Subscribe to Contact Presence](#subscribe-to-contact-presence)
  - [Set Chat Presence (Typing)](#set-chat-presence-typing)
  - [Mark Messages as Read](#mark-messages-as-read)
- [Contacts](#contacts)
  - [Get All Contacts](#get-all-contacts)
  - [Check Phone Numbers](#check-phone-numbers)
  - [Get Blocklist](#get-blocklist)
  - [Update Blocklist](#update-blocklist)
  - [Get Contact Info](#get-contact-info)
  - [Get Contact Avatar](#get-contact-avatar)
  - [Get Business Profile](#get-business-profile)
  - [Get Contact LID](#get-contact-lid)
  - [Get Contact QR Link](#get-contact-qr-link)
- [Groups](#groups)
  - [Create Group](#create-group)
  - [Get Joined Groups](#get-joined-groups)
  - [Get Group Info](#get-group-info)
  - [Leave Group](#leave-group)
  - [Update Group Name](#update-group-name)
  - [Update Group Topic](#update-group-topic)
  - [Set Group Picture](#set-group-picture)
  - [Delete Group Picture](#delete-group-picture)
  - [Add Participants](#add-participants)
  - [Remove Participants](#remove-participants)
  - [Promote Participants](#promote-participants)
  - [Demote Participants](#demote-participants)
  - [Set Group Announce Mode](#set-group-announce-mode)
  - [Set Group Locked Mode](#set-group-locked-mode)
  - [Set Group Approval Mode](#set-group-approval-mode)
  - [Set Group Member Add Mode](#set-group-member-add-mode)
  - [Get Group Info from Invite Link](#get-group-info-from-invite-link)
  - [Join Group via Invite Link](#join-group-via-invite-link)
  - [Get Group Invite Link](#get-group-invite-link)
  - [Get Join Requests](#get-join-requests)
  - [Handle Join Requests](#handle-join-requests)
  - [Send Group Message](#send-group-message)
- [Communities](#communities)
  - [Get Sub Groups](#get-sub-groups)
  - [Link Group to Community](#link-group-to-community)
  - [Unlink Group from Community](#unlink-group-from-community)
- [Chats](#chats)
  - [List All Chats](#list-all-chats)
  - [Get Chat Messages](#get-chat-messages)
  - [Mark Chat as Unread](#mark-chat-as-unread)
  - [Archive/Unarchive Chat](#archiveunarchive-chat)
  - [Set Disappearing Timer](#set-disappearing-timer)
  - [Edit Message](#edit-message)
  - [Delete Message](#delete-message)
  - [Request Unavailable Message](#request-unavailable-message)
- [Messages - Text](#messages---text)
  - [Send Text Message](#send-text-message)
  - [Send Location](#send-location)
  - [Send Contact](#send-contact)
  - [Send Reaction](#send-reaction)
- [Messages - Media](#messages---media)
  - [Send Image](#send-image)
  - [Send Audio](#send-audio)
  - [Send Video](#send-video)
  - [Send Document](#send-document)
  - [Send Sticker](#send-sticker)
- [Messages - Interactive](#messages---interactive)
  - [Send Poll](#send-poll)
  - [Vote on Poll](#vote-on-poll)
  - [Send Buttons](#send-buttons)
  - [Send List](#send-list)
  - [Send Interactive](#send-interactive)
  - [Send Template](#send-template)
  - [Send Carousel](#send-carousel)
- [Media Storage](#media-storage)
  - [List Media](#list-media)
  - [List Pending Media](#list-pending-media)
  - [Process Pending Media](#process-pending-media)
  - [Get Media](#get-media)
- [Newsletters (Channels)](#newsletters-channels)
  - [Create Newsletter](#create-newsletter)
  - [Get Subscribed Newsletters](#get-subscribed-newsletters)
  - [Get Newsletter Info](#get-newsletter-info)
  - [Follow Newsletter](#follow-newsletter)
  - [Unfollow Newsletter](#unfollow-newsletter)
  - [Get Newsletter Messages](#get-newsletter-messages)
  - [React to Newsletter Message](#react-to-newsletter-message)
  - [Toggle Newsletter Mute](#toggle-newsletter-mute)
  - [Mark Newsletter Viewed](#mark-newsletter-viewed)
  - [Subscribe to Live Updates](#subscribe-to-live-updates)
- [Stories/Status](#storiesstatus)
  - [Send Story](#send-story)
  - [Get Status Privacy](#get-status-privacy)
- [Calls](#calls)
  - [Reject Call](#reject-call)
- [History Sync](#history-sync)
  - [Request History Sync](#request-history-sync)
  - [Get Unread Chats](#get-unread-chats)
  - [Get Chat Info](#get-chat-info)
- [Webhooks](#webhooks)
  - [Get Webhook Configuration](#get-webhook-configuration)
  - [Set Webhook](#set-webhook)
  - [Update Webhook](#update-webhook)
  - [Delete Webhook](#delete-webhook)
  - [Get Available Events](#get-available-events)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)
- [Swagger Documentation](#swagger-documentation)

---

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints (except `/`, `/health`, `/swagger/*`) require API key authentication.

**Header:**
```
X-API-Key: your-api-key
```

## Response Format

**Success responses** return the data directly (no envelope).

**Error responses** use a standard format:
```json
{
  "error": "error message description"
}
```

---

# Health & Status

## Get Health Status

**GET** `/` or `/health`

Check API health and database connection status.

```bash
curl http://localhost:3000/health
```

**Response (200):**
```json
{
  "status": "healthy",
  "version": "0.2.11",
  "database": "connected",
  "time": "2024-12-03T10:30:00Z"
}
```

---

# Sessions

## List All Sessions

**GET** `/sessions`

Get all WhatsApp sessions.

```bash
curl -X GET http://localhost:3000/sessions \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
[
  {
    "id": "uuid-here",
    "session": "my-session",
    "deviceJid": "5511999999999@s.whatsapp.net",
    "phone": "5511999999999",
    "status": "connected",
    "createdAt": "2024-12-03T10:00:00Z",
    "updatedAt": "2024-12-03T10:30:00Z"
  }
]
```

---

## Create Session

**POST** `/sessions`

Create a new WhatsApp session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| session | string | Yes | Unique session name |

```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"session": "my-session"}'
```

**Response (201):**
```json
{
  "id": "uuid-here",
  "session": "my-session",
  "status": "disconnected",
  "createdAt": "2024-12-03T10:00:00Z",
  "updatedAt": "2024-12-03T10:00:00Z"
}
```

---

## Get Session Info

**GET** `/sessions/:sessionId`

Get information about a specific session.

```bash
curl -X GET http://localhost:3000/sessions/my-session \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "id": "uuid-here",
  "session": "my-session",
  "deviceJid": "5511999999999@s.whatsapp.net",
  "phone": "5511999999999",
  "status": "connected",
  "createdAt": "2024-12-03T10:00:00Z",
  "updatedAt": "2024-12-03T10:30:00Z"
}
```

---

## Delete Session

**DELETE** `/sessions/:sessionId`

Delete a WhatsApp session.

```bash
curl -X DELETE http://localhost:3000/sessions/my-session \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "session deleted"
}
```

---

## Connect Session

**POST** `/sessions/:sessionId/connect`

Connect a WhatsApp session. Returns QR code endpoint if not authenticated.

```bash
curl -X POST http://localhost:3000/sessions/my-session/connect \
  -H "X-API-Key: your-api-key"
```

**Response (200) - Already connected:**
```json
{
  "message": "session connected",
  "status": "connected"
}
```

**Response (200) - Needs QR:**
```json
{
  "message": "scan QR code to authenticate",
  "status": "connecting",
  "qr": "/sessions/my-session/qr"
}
```

---

## Get QR Code

**GET** `/sessions/:sessionId/qr`

Get QR code for session authentication (base64 PNG image).

```bash
curl -X GET http://localhost:3000/sessions/my-session/qr \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "qr": "data:image/png;base64,iVBORw0KGgo...",
  "status": "connecting"
}
```

---

## Pair with Phone Number

**POST** `/sessions/:sessionId/pair/phone`

Get pairing code for phone number authentication (alternative to QR).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number with country code |

```bash
curl -X POST http://localhost:3000/sessions/my-session/pair/phone \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"phone": "5511999999999"}'
```

**Response (200):**
```json
{
  "code": "ABCD-EFGH"
}
```

---

## Disconnect Session

**POST** `/sessions/:sessionId/disconnect`

Disconnect a WhatsApp session (keeps authentication).

```bash
curl -X POST http://localhost:3000/sessions/my-session/disconnect \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "session disconnected"
}
```

---

## Logout Session

**POST** `/sessions/:sessionId/logout`

Logout from WhatsApp (removes authentication, needs new QR scan).

```bash
curl -X POST http://localhost:3000/sessions/my-session/logout \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "logged out successfully"
}
```

---

## Restart Session

**POST** `/sessions/:sessionId/restart`

Restart a WhatsApp session.

```bash
curl -X POST http://localhost:3000/sessions/my-session/restart \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "session restarted"
}
```

---

# Profile

## Get Profile

**GET** `/sessions/:sessionId/profile`

Get current user profile information.

```bash
curl -X GET http://localhost:3000/sessions/my-session/profile \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "profile": {
    "jid": "5511999999999@s.whatsapp.net",
    "pushName": "John Doe",
    "status": "Hey there!"
  }
}
```

---

## Set Status Message

**PATCH** `/sessions/:sessionId/profile/status`

Update status/bio message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New status message |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/profile/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"status": "Available for business"}'
```

**Response (200):**
```json
{
  "status": "Available for business"
}
```

---

## Set Push Name

**PATCH** `/sessions/:sessionId/profile/name`

Update display name.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | New display name |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/profile/name \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "John Doe"}'
```

**Response (200):**
```json
{
  "name": "John Doe"
}
```

---

## Set Profile Picture

**PUT** `/sessions/:sessionId/profile/picture`

Update profile picture.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image | string | Yes | Base64 encoded image |

```bash
curl -X PUT http://localhost:3000/sessions/my-session/profile/picture \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"image": "base64_encoded_image_here"}'
```

**Response (200):**
```json
{
  "pictureId": "abc123"
}
```

---

## Delete Profile Picture

**DELETE** `/sessions/:sessionId/profile/picture`

Remove profile picture.

```bash
curl -X DELETE http://localhost:3000/sessions/my-session/profile/picture \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "profile picture deleted"
}
```

---

# Settings

Unified settings management for session configuration. Local settings (alwaysOnline, autoRejectCalls) are managed by OnWapp. Privacy settings are synced FROM WhatsApp on connect and applied TO WhatsApp when updated.

## Get Settings

**GET** `/sessions/:sessionId/settings`

Get all settings for a session.

```bash
curl -X GET http://localhost:3000/sessions/my-session/settings \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "id": 1,
  "sessionId": 123,
  "alwaysOnline": false,
  "autoRejectCalls": false,
  "syncHistory": true,
  "lastSeen": "all",
  "online": "all",
  "profilePhoto": "all",
  "status": "all",
  "readReceipts": "all",
  "groupAdd": "all",
  "callAdd": "all",
  "defaultDisappearingTimer": "off",
  "privacySyncedAt": "2024-12-03T10:30:00Z",
  "createdAt": "2024-12-03T10:00:00Z",
  "updatedAt": "2024-12-03T10:30:00Z"
}
```

---

## Update Settings

**POST** `/sessions/:sessionId/settings`

Update settings for a session. All fields are optional - only provided fields are updated.

**Local Settings** (saved to database only):

| Field | Type | Description |
|-------|------|-------------|
| alwaysOnline | boolean | Keep session online (sends presence every 4 min) |
| autoRejectCalls | boolean | Automatically reject incoming calls |
| syncHistory | boolean | Enable history synchronization |

**Privacy Settings** (applied to WhatsApp AND saved to database):

| Field | Type | Description |
|-------|------|-------------|
| lastSeen | string | Who can see last seen (all, contacts, contact_blacklist, none) |
| online | string | Who can see online status (all, match_last_seen) |
| profilePhoto | string | Who can see profile photo (all, contacts, contact_blacklist, none) |
| status | string | Who can see status (all, contacts, contact_blacklist, none) |
| readReceipts | string | Read receipts (all, none) |
| groupAdd | string | Who can add to groups (all, contacts, contact_blacklist) |
| callAdd | string | Who can call (all, known) |
| defaultDisappearingTimer | string | Default timer for new chats (off, 24h, 7d, 90d) |

```bash
# Update local settings
curl -X POST http://localhost:3000/sessions/my-session/settings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "alwaysOnline": true,
    "autoRejectCalls": true
  }'

# Update privacy settings
curl -X POST http://localhost:3000/sessions/my-session/settings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "lastSeen": "contacts",
    "online": "match_last_seen",
    "readReceipts": "none"
  }'

# Update both
curl -X POST http://localhost:3000/sessions/my-session/settings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "alwaysOnline": true,
    "lastSeen": "contacts",
    "defaultDisappearingTimer": "24h"
  }'
```

**Response (200):**
```json
{
  "id": 1,
  "sessionId": 123,
  "alwaysOnline": true,
  "autoRejectCalls": true,
  "syncHistory": true,
  "lastSeen": "contacts",
  "online": "match_last_seen",
  "profilePhoto": "all",
  "status": "all",
  "readReceipts": "none",
  "groupAdd": "all",
  "callAdd": "all",
  "defaultDisappearingTimer": "24h",
  "privacySyncedAt": "2024-12-03T10:30:00Z",
  "createdAt": "2024-12-03T10:00:00Z",
  "updatedAt": "2024-12-03T10:35:00Z"
}
```

---

# Presence

## Set Presence

**PUT** `/sessions/:sessionId/presence`

Set online/offline presence.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| available | boolean | Yes | true = online, false = offline |

```bash
curl -X PUT http://localhost:3000/sessions/my-session/presence \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"available": true}'
```

**Response (200):**
```json
{
  "status": "available"
}
```

---

## Subscribe to Contact Presence

**POST** `/sessions/:sessionId/presence/subscribe/:phone`

Subscribe to a contact's online/offline status updates.

```bash
curl -X POST http://localhost:3000/sessions/my-session/presence/subscribe/5511999999999 \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "subscribed to presence"
}
```

---

## Set Chat Presence (Typing)

**POST** `/sessions/:sessionId/chats/:chatId/presence`

Set typing/recording indicator in a chat.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| state | string | Yes | composing, recording, paused |

```bash
curl -X POST http://localhost:3000/sessions/my-session/chats/5511999999999/presence \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"state": "composing"}'
```

**Response (200):**
```json
{
  "state": "composing"
}
```

---

## Mark Messages as Read

**POST** `/sessions/:sessionId/chats/:chatId/read`

Mark messages as read in a chat.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| messageIds | array | Yes | Array of message IDs to mark as read |

```bash
curl -X POST http://localhost:3000/sessions/my-session/chats/5511999999999/read \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"messageIds": ["ABCD1234", "EFGH5678"]}'
```

**Response (200):**
```json
{
  "message": "messages marked as read"
}
```

---

# Contacts

## Get All Contacts

**GET** `/sessions/:sessionId/contacts`

Get all contacts from the phone.

```bash
curl -X GET http://localhost:3000/sessions/my-session/contacts \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "5511999999999@s.whatsapp.net": {
    "pushName": "John Doe",
    "businessName": "",
    "fullName": "John Doe",
    "firstName": "John"
  }
}
```

---

## Check Phone Numbers

**POST** `/sessions/:sessionId/contacts/check`

Check if phone numbers are registered on WhatsApp.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phones | array | Yes | Array of phone numbers |

```bash
curl -X POST http://localhost:3000/sessions/my-session/contacts/check \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"phones": ["5511999999999", "5511888888888"]}'
```

**Response (200):**
```json
[
  {
    "phone": "5511999999999",
    "isRegistered": true,
    "jid": "5511999999999@s.whatsapp.net"
  },
  {
    "phone": "5511888888888",
    "isRegistered": false
  }
]
```

---

## Get Blocklist

**GET** `/sessions/:sessionId/contacts/blocklist`

Get list of blocked contacts.

```bash
curl -X GET http://localhost:3000/sessions/my-session/contacts/blocklist \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "jids": [
    "5511777777777@s.whatsapp.net"
  ]
}
```

---

## Update Blocklist

**PUT** `/sessions/:sessionId/contacts/blocklist`

Block or unblock a contact.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| action | string | Yes | "block" or "unblock" |

```bash
curl -X PUT http://localhost:3000/sessions/my-session/contacts/blocklist \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"phone": "5511777777777", "action": "block"}'
```

**Response (200):**
```json
{
  "action": "block",
  "phone": "5511777777777"
}
```

---

## Get Contact Info

**GET** `/sessions/:sessionId/contacts/:phone`

Get detailed information about a contact.

```bash
curl -X GET http://localhost:3000/sessions/my-session/contacts/5511999999999 \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "users": {
    "5511999999999@s.whatsapp.net": {
      "status": "Hey there!",
      "pictureID": "abc123",
      "devices": []
    }
  }
}
```

---

## Get Contact Avatar

**GET** `/sessions/:sessionId/contacts/:phone/avatar`

Get contact's profile picture URL.

```bash
curl -X GET http://localhost:3000/sessions/my-session/contacts/5511999999999/avatar \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "url": "https://pps.whatsapp.net/v/...",
  "id": "abc123"
}
```

---

## Get Business Profile

**GET** `/sessions/:sessionId/contacts/:phone/business`

Get business profile information.

```bash
curl -X GET http://localhost:3000/sessions/my-session/contacts/5511999999999/business \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "profile": {
    "businessName": "My Company",
    "description": "We sell things",
    "category": "Shopping & Retail",
    "email": "contact@company.com",
    "website": "https://company.com"
  }
}
```

---

## Get Contact LID

**GET** `/sessions/:sessionId/contacts/:phone/lid`

Get Linked ID (LID) for a contact.

```bash
curl -X GET http://localhost:3000/sessions/my-session/contacts/5511999999999/lid \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "phone": "5511999999999",
  "lid": "123456789:0@lid"
}
```

---

## Get Contact QR Link

**GET** `/sessions/:sessionId/contacts/:phone/qrlink`

Get wa.me QR link for a contact.

```bash
curl -X GET http://localhost:3000/sessions/my-session/contacts/5511999999999/qrlink \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "link": "https://wa.me/qr/ABCD1234"
}
```

---

# Groups

## Create Group

**POST** `/sessions/:sessionId/groups`

Create a new WhatsApp group.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Group name |
| participants | array | Yes | Array of phone numbers |

```bash
curl -X POST http://localhost:3000/sessions/my-session/groups \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "My Group", "participants": ["5511999999999", "5511888888888"]}'
```

**Response (200):**
```json
{
  "jid": "123456789@g.us",
  "name": "My Group",
  "participants": ["5511999999999@s.whatsapp.net", "5511888888888@s.whatsapp.net"]
}
```

---

## Get Joined Groups

**GET** `/sessions/:sessionId/groups`

Get all groups the session is a member of.

```bash
curl -X GET http://localhost:3000/sessions/my-session/groups \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
[
  {
    "jid": "123456789@g.us",
    "name": "My Group",
    "topic": "Group description"
  }
]
```

---

## Get Group Info

**GET** `/sessions/:sessionId/groups/:groupId`

Get detailed information about a group.

```bash
curl -X GET http://localhost:3000/sessions/my-session/groups/123456789@g.us \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "jid": "123456789@g.us",
  "name": "My Group",
  "topic": "Group description",
  "participants": [
    {
      "jid": "5511999999999@s.whatsapp.net",
      "isAdmin": true,
      "isSuperAdmin": true
    }
  ]
}
```

---

## Leave Group

**DELETE** `/sessions/:sessionId/groups/:groupId`

Leave a WhatsApp group.

```bash
curl -X DELETE http://localhost:3000/sessions/my-session/groups/123456789@g.us \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "left group"
}
```

---

## Update Group Name

**PATCH** `/sessions/:sessionId/groups/:groupId/name`

Update group name (requires admin).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | New group name |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/groups/123456789@g.us/name \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "New Group Name"}'
```

**Response (200):**
```json
{
  "message": "group name updated"
}
```

---

## Update Group Topic

**PATCH** `/sessions/:sessionId/groups/:groupId/topic`

Update group description (requires admin).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| topic | string | Yes | New group description |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/groups/123456789@g.us/topic \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"topic": "New description"}'
```

**Response (200):**
```json
{
  "message": "group topic updated"
}
```

---

## Set Group Picture

**PUT** `/sessions/:sessionId/groups/:groupId/picture`

Set group profile picture (requires admin).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image | string | Yes | Base64 encoded image |

```bash
curl -X PUT http://localhost:3000/sessions/my-session/groups/123456789@g.us/picture \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"image": "base64_encoded_image"}'
```

**Response (200):**
```json
{
  "pictureId": "abc123"
}
```

---

## Delete Group Picture

**DELETE** `/sessions/:sessionId/groups/:groupId/picture`

Remove group profile picture (requires admin).

```bash
curl -X DELETE http://localhost:3000/sessions/my-session/groups/123456789@g.us/picture \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "group picture deleted"
}
```

---

## Add Participants

**POST** `/sessions/:sessionId/groups/:groupId/participants`

Add participants to a group (requires admin).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| participants | array | Yes | Array of phone numbers |

```bash
curl -X POST http://localhost:3000/sessions/my-session/groups/123456789@g.us/participants \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"participants": ["5511777777777"]}'
```

**Response (200):**
```json
{
  "groupId": "123456789@g.us",
  "data": [{"jid": "5511777777777@s.whatsapp.net", "type": "add"}]
}
```

---

## Remove Participants

**DELETE** `/sessions/:sessionId/groups/:groupId/participants`

Remove participants from a group (requires admin).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| participants | array | Yes | Array of phone numbers |

```bash
curl -X DELETE http://localhost:3000/sessions/my-session/groups/123456789@g.us/participants \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"participants": ["5511777777777"]}'
```

**Response (200):**
```json
{
  "groupId": "123456789@g.us",
  "data": [{"jid": "5511777777777@s.whatsapp.net", "type": "remove"}]
}
```

---

## Promote Participants

**PATCH** `/sessions/:sessionId/groups/:groupId/participants/promote`

Promote participants to admin (requires admin).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| participants | array | Yes | Array of phone numbers |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/groups/123456789@g.us/participants/promote \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"participants": ["5511777777777"]}'
```

**Response (200):**
```json
{
  "groupId": "123456789@g.us",
  "data": [{"jid": "5511777777777@s.whatsapp.net", "type": "promote"}]
}
```

---

## Demote Participants

**PATCH** `/sessions/:sessionId/groups/:groupId/participants/demote`

Demote admins to regular members (requires admin).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| participants | array | Yes | Array of phone numbers |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/groups/123456789@g.us/participants/demote \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"participants": ["5511777777777"]}'
```

**Response (200):**
```json
{
  "groupId": "123456789@g.us",
  "data": [{"jid": "5511777777777@s.whatsapp.net", "type": "demote"}]
}
```

---

## Set Group Announce Mode

**PATCH** `/sessions/:sessionId/groups/:groupId/settings/announce`

Set whether only admins can send messages.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| announce | boolean | Yes | true = only admins can send |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/groups/123456789@g.us/settings/announce \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"announce": true}'
```

**Response (200):**
```json
{
  "message": "group announce mode updated"
}
```

---

## Set Group Locked Mode

**PATCH** `/sessions/:sessionId/groups/:groupId/settings/locked`

Set whether only admins can edit group info.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| locked | boolean | Yes | true = only admins can edit |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/groups/123456789@g.us/settings/locked \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"locked": true}'
```

**Response (200):**
```json
{
  "message": "group locked mode updated"
}
```

---

## Set Group Approval Mode

**PATCH** `/sessions/:sessionId/groups/:groupId/settings/approval`

Set whether new members need admin approval.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| approvalMode | boolean | Yes | true = require approval |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/groups/123456789@g.us/settings/approval \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"approvalMode": true}'
```

**Response (200):**
```json
{
  "message": "group approval mode updated"
}
```

---

## Set Group Member Add Mode

**PATCH** `/sessions/:sessionId/groups/:groupId/settings/memberadd`

Set who can add new members.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| mode | string | Yes | "admin_add" or "all_member_add" |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/groups/123456789@g.us/settings/memberadd \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"mode": "admin_add"}'
```

**Response (200):**
```json
{
  "message": "group member add mode updated"
}
```

---

## Get Group Info from Invite Link

**GET** `/sessions/:sessionId/groups/invite/info?inviteLink=URL`

Get group information from an invite link.

```bash
curl -X GET "http://localhost:3000/sessions/my-session/groups/invite/info?inviteLink=https://chat.whatsapp.com/ABC123" \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "jid": "123456789@g.us",
  "name": "Group Name",
  "topic": "Group description"
}
```

---

## Join Group via Invite Link

**POST** `/sessions/:sessionId/groups/join`

Join a group using an invite link.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| inviteLink | string | Yes | Group invite URL |

```bash
curl -X POST http://localhost:3000/sessions/my-session/groups/join \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"inviteLink": "https://chat.whatsapp.com/ABC123"}'
```

**Response (200):**
```json
{
  "jid": "123456789@g.us"
}
```

---

## Get Group Invite Link

**GET** `/sessions/:sessionId/groups/:groupId/invite`

Get invite link for a group (requires admin).

```bash
curl -X GET http://localhost:3000/sessions/my-session/groups/123456789@g.us/invite \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "groupId": "123456789@g.us",
  "link": "https://chat.whatsapp.com/ABC123"
}
```

---

## Get Join Requests

**GET** `/sessions/:sessionId/groups/:groupId/requests`

Get pending join requests (requires admin, approval mode enabled).

```bash
curl -X GET http://localhost:3000/sessions/my-session/groups/123456789@g.us/requests \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "groupId": "123456789@g.us",
  "participants": [
    {"jid": "5511777777777@s.whatsapp.net", "requestedAt": "2024-12-03T10:00:00Z"}
  ]
}
```

---

## Handle Join Requests

**POST** `/sessions/:sessionId/groups/:groupId/requests`

Approve or reject join requests.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| participants | array | Yes | Array of phone numbers |
| action | string | Yes | "approve" or "reject" |

```bash
curl -X POST http://localhost:3000/sessions/my-session/groups/123456789@g.us/requests \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"participants": ["5511777777777"], "action": "approve"}'
```

**Response (200):**
```json
{
  "message": "requests processed"
}
```

---

## Send Group Message

**POST** `/sessions/:sessionId/groups/:groupId/messages`

Send a text message to a group.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | Yes | Message text |

```bash
curl -X POST http://localhost:3000/sessions/my-session/groups/123456789@g.us/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"text": "Hello group!"}'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

# Communities

## Get Sub Groups

**GET** `/sessions/:sessionId/communities/:communityId/groups`

Get all groups linked to a community.

```bash
curl -X GET http://localhost:3000/sessions/my-session/communities/123456789@g.us/groups \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "groups": [
    {"jid": "111111111@g.us", "name": "Sub Group 1"},
    {"jid": "222222222@g.us", "name": "Sub Group 2"}
  ]
}
```

---

## Link Group to Community

**POST** `/sessions/:sessionId/communities/:communityId/groups`

Link a group to a community.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| childGroupId | string | Yes | Group JID to link |

```bash
curl -X POST http://localhost:3000/sessions/my-session/communities/123456789@g.us/groups \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"childGroupId": "987654321@g.us"}'
```

**Response (200):**
```json
{
  "message": "group linked to community"
}
```

---

## Unlink Group from Community

**DELETE** `/sessions/:sessionId/communities/:communityId/groups/:groupId`

Unlink a group from a community.

```bash
curl -X DELETE http://localhost:3000/sessions/my-session/communities/123456789@g.us/groups/987654321@g.us \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "group unlinked from community"
}
```

---

# Chats

## List All Chats

**GET** `/sessions/:sessionId/chat/list`

Get list of all chats from synced history data with pagination.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | int | No | Max results (default: 100, max: 500) |
| offset | int | No | Offset for pagination (default: 0) |

```bash
curl -X GET "http://localhost:3000/sessions/my-session/chat/list?limit=50&offset=0" \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
[
  {
    "jid": "5511999999999@s.whatsapp.net",
    "name": "John Doe",
    "unreadCount": 3,
    "markedAsUnread": false,
    "ephemeralExpiration": 86400,
    "conversationTimestamp": 1701619200,
    "readOnly": false,
    "suspended": false,
    "locked": false
  }
]
```

---

## Get Chat Messages

**GET** `/sessions/:sessionId/chat/messages`

Get messages from a specific chat with pagination.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chatId | string | Yes | Chat JID (query parameter) |
| limit | int | No | Max results (default: 50, max: 200) |
| offset | int | No | Offset for pagination (default: 0) |

```bash
curl -X GET "http://localhost:3000/sessions/my-session/chat/messages?chatId=5511999999999@s.whatsapp.net&limit=20" \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
[
  {
    "msgId": "3EB0ABC123",
    "chatJid": "5511999999999@s.whatsapp.net",
    "senderJid": "5511999999999@s.whatsapp.net",
    "pushName": "John Doe",
    "timestamp": 1701619200,
    "type": "text",
    "content": "Hello!",
    "fromMe": false,
    "isGroup": false,
    "status": "received"
  }
]
```

---

## Mark Chat as Unread

**POST** `/sessions/:sessionId/chat/unread`

Mark a chat as unread.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number or JID |

```bash
curl -X POST http://localhost:3000/sessions/my-session/chat/unread \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"phone": "5511999999999"}'
```

**Response (200):**
```json
{
  "status": "marked_unread"
}
```

---

## Archive/Unarchive Chat

**PATCH** `/sessions/:sessionId/chats/:chatId/archive`

Archive or unarchive a chat.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| archive | boolean | Yes | true = archive, false = unarchive |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/chats/5511999999999/archive \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"archive": true}'
```

**Response (200):**
```json
{
  "status": "archived"
}
```

---

## Set Disappearing Timer

**PATCH** `/sessions/:sessionId/chats/:chatId/disappearing`

Set disappearing messages timer for a chat.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timer | string | Yes | "24h", "7d", "90d", or "off" |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/chats/5511999999999/disappearing \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"timer": "24h"}'
```

**Response (200):**
```json
{
  "message": "disappearing timer set"
}
```

---

## Edit Message

**PATCH** `/sessions/:sessionId/chats/:chatId/messages/:messageId`

Edit a sent message (within 15 minutes).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| newText | string | Yes | New message text |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/chats/5511999999999/messages/3EB0ABC123 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"newText": "Edited message"}'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Delete Message

**DELETE** `/sessions/:sessionId/chats/:chatId/messages/:messageId`

Delete a message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| forMe | boolean | No | true = delete for me only (default: false = delete for everyone) |

```bash
curl -X DELETE http://localhost:3000/sessions/my-session/chats/5511999999999/messages/3EB0ABC123 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"forMe": false}'
```

**Response (200):**
```json
{
  "message": "message deleted"
}
```

---

## Request Unavailable Message

**POST** `/sessions/:sessionId/chats/:chatId/messages/:messageId/request`

Request a message that wasn't delivered (e.g., sent while offline).

```bash
curl -X POST http://localhost:3000/sessions/my-session/chats/5511999999999/messages/3EB0ABC123/request \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"senderJid": "5511888888888@s.whatsapp.net"}'
```

**Response (200):**
```json
{
  "message": "message requested"
}
```

---

# Messages - Text

## Send Text Message

**POST** `/sessions/:sessionId/messages/text`

Send a text message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number with country code |
| text | string | Yes | Message text |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/text \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"phone": "5511999999999", "text": "Hello!"}'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send Location

**POST** `/sessions/:sessionId/messages/location`

Send a location message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| latitude | number | Yes | Latitude coordinate |
| longitude | number | Yes | Longitude coordinate |
| name | string | No | Location name |
| address | string | No | Location address |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/location \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "name": "São Paulo",
    "address": "São Paulo, Brazil"
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send Contact

**POST** `/sessions/:sessionId/messages/contact`

Send a contact card.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Recipient phone number |
| contactName | string | Yes | Contact name |
| contactPhone | string | Yes | Contact phone number |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/contact \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "contactName": "John Doe",
    "contactPhone": "5511888888888"
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send Reaction

**POST** `/sessions/:sessionId/messages/reaction`

React to a message with an emoji.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Chat phone number |
| messageId | string | Yes | Message ID to react to |
| emoji | string | Yes | Emoji (empty to remove) |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/reaction \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "messageId": "3EB0ABC123",
    "emoji": "👍"
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0DEF456",
  "timestamp": 1701619200
}
```

---

# Messages - Media

All media endpoints support three formats:
1. **JSON with base64**: `{"phone": "...", "image": "base64..."}`
2. **JSON with URL**: `{"phone": "...", "image": "https://..."}`
3. **Multipart form-data**: `phone` + `file` fields

## Send Image

**POST** `/sessions/:sessionId/messages/image`

Send an image message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| image | string | Yes | Base64 or URL |
| caption | string | No | Image caption |
| mimetype | string | No | MIME type (auto-detected) |

```bash
# JSON with URL
curl -X POST http://localhost:3000/sessions/my-session/messages/image \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "image": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }'

# Multipart form-data
curl -X POST http://localhost:3000/sessions/my-session/messages/image \
  -H "X-API-Key: your-api-key" \
  -F "phone=5511999999999" \
  -F "caption=Check this out!" \
  -F "file=@/path/to/image.jpg"
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send Audio

**POST** `/sessions/:sessionId/messages/audio`

Send an audio message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| audio | string | Yes | Base64 or URL |
| ptt | boolean | No | Push-to-talk (voice message) |
| mimetype | string | No | MIME type |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/audio \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "audio": "https://example.com/audio.ogg",
    "ptt": true
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send Video

**POST** `/sessions/:sessionId/messages/video`

Send a video message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| video | string | Yes | Base64 or URL |
| caption | string | No | Video caption |
| mimetype | string | No | MIME type |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/video \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "video": "https://example.com/video.mp4",
    "caption": "Watch this!"
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send Document

**POST** `/sessions/:sessionId/messages/document`

Send a document/file.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| document | string | Yes | Base64 or URL |
| filename | string | Yes | File name |
| mimetype | string | No | MIME type |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/document \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "document": "https://example.com/doc.pdf",
    "filename": "report.pdf"
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send Sticker

**POST** `/sessions/:sessionId/messages/sticker`

Send a sticker (WebP image).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| sticker | string | Yes | Base64 or URL |
| mimetype | string | No | MIME type (image/webp) |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/sticker \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "sticker": "https://example.com/sticker.webp"
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

# Messages - Interactive

## Send Poll

**POST** `/sessions/:sessionId/messages/poll`

Create a poll.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| name | string | Yes | Poll question |
| options | array | Yes | Array of options |
| selectableCount | number | No | Max selections (default: 1) |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/poll \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "name": "What is your favorite color?",
    "options": ["Red", "Blue", "Green"],
    "selectableCount": 1
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Vote on Poll

**POST** `/sessions/:sessionId/messages/poll/vote`

Vote on a poll.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| pollMessageId | string | Yes | Poll message ID |
| selectedOptions | array | Yes | Selected options |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/poll/vote \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "pollMessageId": "3EB0ABC123",
    "selectedOptions": ["Blue"]
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0DEF456",
  "timestamp": 1701619200
}
```

---

## Send Buttons

**POST** `/sessions/:sessionId/messages/buttons`

Send a message with quick reply buttons.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| contentText | string | Yes | Message body |
| buttons | array | Yes | Array of buttons (max 3) |
| headerText | string | No | Header text |
| footerText | string | No | Footer text |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/buttons \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "contentText": "Choose an option:",
    "buttons": [
      {"buttonId": "opt1", "displayText": "Option 1"},
      {"buttonId": "opt2", "displayText": "Option 2"}
    ],
    "footerText": "Powered by OnWapp"
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send List

**POST** `/sessions/:sessionId/messages/list`

Send a list/menu message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| title | string | Yes | List title |
| description | string | Yes | List description |
| buttonText | string | Yes | Button text |
| sections | array | Yes | Array of sections with rows |
| footerText | string | No | Footer text |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/list \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "title": "Menu",
    "description": "Select an option",
    "buttonText": "View Options",
    "sections": [
      {
        "title": "Products",
        "rows": [
          {"title": "Product A", "description": "$10.00", "rowId": "prod_a"},
          {"title": "Product B", "description": "$15.00", "rowId": "prod_b"}
        ]
      }
    ]
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send Interactive

**POST** `/sessions/:sessionId/messages/interactive`

Send an interactive message with native flow buttons.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| body | string | Yes | Message body |
| buttons | array | Yes | Array of native flow buttons |
| title | string | No | Message title |
| footer | string | No | Footer text |
| image | string | No | Image URL or base64 |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/interactive \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "title": "Special Offer",
    "body": "Check out our new products!",
    "footer": "Limited time",
    "buttons": [
      {"name": "quick_reply", "params": {"display_text": "View Products", "id": "view"}}
    ]
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send Template

**POST** `/sessions/:sessionId/messages/template`

Send a template message with buttons.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| content | string | Yes | Message content |
| buttons | array | Yes | Template buttons |
| title | string | No | Message title |
| footer | string | No | Footer text |
| image/video/document | string | No | Media attachment |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/template \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "title": "Welcome!",
    "content": "Thanks for reaching out",
    "footer": "OnWapp",
    "buttons": [
      {"index": 0, "quickReply": {"displayText": "Get Started", "id": "start"}},
      {"index": 1, "urlButton": {"displayText": "Visit Site", "url": "https://example.com"}}
    ]
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Send Carousel

**POST** `/sessions/:sessionId/messages/carousel`

Send a carousel/product cards message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| cards | array | Yes | Array of carousel cards |
| title | string | No | Carousel title |
| body | string | No | Body text |
| footer | string | No | Footer text |

```bash
curl -X POST http://localhost:3000/sessions/my-session/messages/carousel \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "title": "Our Products",
    "cards": [
      {
        "header": {"title": "Product 1", "image": "https://example.com/prod1.jpg"},
        "body": "Amazing product",
        "footer": "$9.99",
        "buttons": [{"name": "quick_reply", "params": {"display_text": "Buy", "id": "buy_1"}}]
      },
      {
        "header": {"title": "Product 2", "image": "https://example.com/prod2.jpg"},
        "body": "Great product",
        "footer": "$14.99",
        "buttons": [{"name": "quick_reply", "params": {"display_text": "Buy", "id": "buy_2"}}]
      }
    ]
  }'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

# Media Storage

## List Media

**GET** `/sessions/:sessionId/media`

List all downloaded media files.

```bash
curl -X GET http://localhost:3000/sessions/my-session/media \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "sessionId": "uuid",
    "msgId": "3EB0ABC123",
    "mediaType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 12345,
    "fileName": "photo.jpg",
    "storageUrl": "https://s3.example.com/media/photo.jpg",
    "downloaded": true,
    "createdAt": "2024-12-03T10:00:00Z"
  }
]
```

---

## List Pending Media

**GET** `/sessions/:sessionId/media/pending`

List media files pending download.

```bash
curl -X GET http://localhost:3000/sessions/my-session/media/pending \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "msgId": "3EB0ABC123",
    "mediaType": "image",
    "downloaded": false
  }
]
```

---

## Process Pending Media

**POST** `/sessions/:sessionId/media/process`

Download all pending media files.

```bash
curl -X POST http://localhost:3000/sessions/my-session/media/process \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "processed": 5,
  "failed": 0
}
```

---

## Get Media

**GET** `/sessions/:sessionId/media/:messageId`

Get media file by message ID.

```bash
curl -X GET http://localhost:3000/sessions/my-session/media/3EB0ABC123 \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "id": "uuid",
  "msgId": "3EB0ABC123",
  "mediaType": "image",
  "mimeType": "image/jpeg",
  "storageUrl": "https://s3.example.com/media/photo.jpg",
  "downloaded": true
}
```

---

# Newsletters (Channels)

## Create Newsletter

**POST** `/sessions/:sessionId/newsletters`

Create a new WhatsApp Channel.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Channel name |
| description | string | No | Channel description |
| picture | string | No | Base64 encoded picture |

```bash
curl -X POST http://localhost:3000/sessions/my-session/newsletters \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "My Channel", "description": "Updates and news"}'
```

**Response (200):**
```json
{
  "data": {
    "id": "123456789@newsletter",
    "name": "My Channel"
  }
}
```

---

## Get Subscribed Newsletters

**GET** `/sessions/:sessionId/newsletters`

Get all subscribed channels.

```bash
curl -X GET http://localhost:3000/sessions/my-session/newsletters \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "newsletters": [
    {
      "id": "123456789@newsletter",
      "name": "My Channel",
      "subscriberCount": 1000
    }
  ]
}
```

---

## Get Newsletter Info

**GET** `/sessions/:sessionId/newsletters/:newsletterId`

Get channel information.

```bash
curl -X GET http://localhost:3000/sessions/my-session/newsletters/123456789@newsletter \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "data": {
    "id": "123456789@newsletter",
    "name": "My Channel",
    "description": "Updates and news",
    "subscriberCount": 1000
  }
}
```

---

## Follow Newsletter

**POST** `/sessions/:sessionId/newsletters/:newsletterId/follow`

Subscribe to a channel.

```bash
curl -X POST http://localhost:3000/sessions/my-session/newsletters/123456789@newsletter/follow \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "followed newsletter"
}
```

---

## Unfollow Newsletter

**DELETE** `/sessions/:sessionId/newsletters/:newsletterId/follow`

Unsubscribe from a channel.

```bash
curl -X DELETE http://localhost:3000/sessions/my-session/newsletters/123456789@newsletter/follow \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "unfollowed newsletter"
}
```

---

## Get Newsletter Messages

**GET** `/sessions/:sessionId/newsletters/:newsletterId/messages`

Get messages from a channel.

```bash
curl -X GET http://localhost:3000/sessions/my-session/newsletters/123456789@newsletter/messages \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "data": []
}
```

---

## React to Newsletter Message

**POST** `/sessions/:sessionId/newsletters/:newsletterId/reactions`

React to a channel message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| serverId | number | Yes | Message server ID |
| reaction | string | Yes | Reaction emoji |

```bash
curl -X POST http://localhost:3000/sessions/my-session/newsletters/123456789@newsletter/reactions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"serverId": 123, "reaction": "👍"}'
```

**Response (200):**
```json
{
  "message": "reaction sent"
}
```

---

## Toggle Newsletter Mute

**PATCH** `/sessions/:sessionId/newsletters/:newsletterId/mute`

Mute or unmute a channel.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| mute | boolean | Yes | true = mute, false = unmute |

```bash
curl -X PATCH http://localhost:3000/sessions/my-session/newsletters/123456789@newsletter/mute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"mute": true}'
```

**Response (200):**
```json
{
  "message": "newsletter muted"
}
```

---

## Mark Newsletter Viewed

**POST** `/sessions/:sessionId/newsletters/:newsletterId/viewed`

Mark newsletter messages as viewed.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| serverIds | array | Yes | Array of server IDs |

```bash
curl -X POST http://localhost:3000/sessions/my-session/newsletters/123456789@newsletter/viewed \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"serverIds": [1, 2, 3]}'
```

**Response (200):**
```json
{
  "message": "marked as viewed"
}
```

---

## Subscribe to Live Updates

**POST** `/sessions/:sessionId/newsletters/:newsletterId/subscribe-live`

Subscribe to live updates from a channel.

```bash
curl -X POST http://localhost:3000/sessions/my-session/newsletters/123456789@newsletter/subscribe-live \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "duration": "24h0m0s"
}
```

---

# Stories/Status

## Send Story

**POST** `/sessions/:sessionId/stories`

Post a story/status update.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | No | Text status |
| image | string | No | Base64 image |
| video | string | No | Base64 video |
| caption | string | No | Media caption |

```bash
curl -X POST http://localhost:3000/sessions/my-session/stories \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"text": "Hello from OnWapp!"}'
```

**Response (200):**
```json
{
  "messageId": "3EB0ABC123",
  "timestamp": 1701619200
}
```

---

## Get Status Privacy

**GET** `/sessions/:sessionId/stories/privacy`

Get status privacy settings.

```bash
curl -X GET http://localhost:3000/sessions/my-session/stories/privacy \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "privacy": {
    "type": "contacts"
  }
}
```

---

# Calls

## Reject Call

**POST** `/sessions/:sessionId/calls/reject`

Reject an incoming call.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| callFrom | string | Yes | Caller phone number |
| callId | string | Yes | Call ID |

```bash
curl -X POST http://localhost:3000/sessions/my-session/calls/reject \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"callFrom": "5511999999999", "callId": "CALL123"}'
```

**Response (200):**
```json
{
  "message": "call rejected"
}
```

---

# History Sync

## Request History Sync

**POST** `/sessions/:sessionId/history/sync`

Request chat history synchronization from WhatsApp.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| count | number | No | Number of messages to request (default: 100) |

```bash
curl -X POST http://localhost:3000/sessions/my-session/history/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"count": 100}'
```

**Response (200):**
```json
{
  "message": "history sync request sent",
  "id": "3EB0ABC123"
}
```

---

## Get Unread Chats

**GET** `/sessions/:sessionId/history/chats/unread`

Get list of chats with unread messages from synced history data.

```bash
curl -X GET http://localhost:3000/sessions/my-session/history/chats/unread \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
[
  {
    "jid": "5511999999999@s.whatsapp.net",
    "name": "John Doe",
    "unreadCount": 5,
    "markedAsUnread": false,
    "ephemeralExpiration": 0,
    "conversationTimestamp": 1701619200
  }
]
```

---

## Get Chat Info

**GET** `/sessions/:sessionId/history/chat?chatId=:chatId`

Get detailed chat information from synced history data.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chatId | string | Yes | Chat JID (query parameter) |

```bash
curl -X GET "http://localhost:3000/sessions/my-session/history/chat?chatId=5511999999999@s.whatsapp.net" \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "jid": "5511999999999@s.whatsapp.net",
  "name": "John Doe",
  "unreadCount": 0,
  "markedAsUnread": false,
  "ephemeralExpiration": 86400,
  "conversationTimestamp": 1701619200,
  "readOnly": false,
  "suspended": false,
  "locked": false
}
```

---

# Webhooks

## Get Webhook Configuration

**GET** `/sessions/:sessionId/webhooks`

Get webhook configuration for a session.

```bash
curl -X GET http://localhost:3000/sessions/my-session/webhooks \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "url": "https://example.com/webhook",
  "events": ["message.received", "message.sent"],
  "enabled": true
}
```

---

## Set Webhook

**POST** `/sessions/:sessionId/webhooks`

Create webhook configuration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | Webhook URL |
| events | array | No | Array of event types |
| enabled | boolean | No | Enable webhook |
| secret | string | No | Webhook secret for signature |

```bash
curl -X POST http://localhost:3000/sessions/my-session/webhooks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "url": "https://example.com/webhook",
    "events": ["message.received", "message.sent"],
    "enabled": true,
    "secret": "my-secret-key"
  }'
```

**Response (200):**
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "url": "https://example.com/webhook",
  "events": ["message.received", "message.sent"],
  "enabled": true
}
```

---

## Update Webhook

**PUT** `/sessions/:sessionId/webhooks`

Update webhook configuration.

```bash
curl -X PUT http://localhost:3000/sessions/my-session/webhooks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "url": "https://example.com/new-webhook",
    "enabled": true
  }'
```

**Response (200):**
```json
{
  "id": "uuid",
  "url": "https://example.com/new-webhook",
  "enabled": true
}
```

---

## Delete Webhook

**DELETE** `/sessions/:sessionId/webhooks`

Delete webhook configuration.

```bash
curl -X DELETE http://localhost:3000/sessions/my-session/webhooks \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "message": "webhook deleted"
}
```

---

## Get Available Events

**GET** `/events`

Get all available webhook event types.

```bash
curl -X GET http://localhost:3000/events \
  -H "X-API-Key: your-api-key"
```

**Response (200):**
```json
{
  "categories": {
    "session": ["session.connected", "session.disconnected", "session.qr"],
    "message": ["message.received", "message.sent", "message.delivered", "message.read"],
    "chat": ["chat.presence", "chat.archived"],
    "group": ["group.created", "group.updated", "group.participant_added"],
    "call": ["call.received", "call.missed"]
  },
  "all": [
    "session.connected",
    "session.disconnected",
    "message.received",
    "..."
  ]
}
```

---

# Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "description of the error"
}
```

**Common HTTP Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing/invalid API key) |
| 404 | Not Found (session/resource not found) |
| 409 | Conflict (resource already exists) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

# Rate Limiting

API requests are rate limited to **100 requests per minute** per IP address by default.

When rate limited, you'll receive a `429 Too Many Requests` response.

---

# Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:3000/swagger/index.html
```
