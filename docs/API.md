# OnWapp API Reference

Complete REST API documentation for OnWapp - WhatsApp API Bridge.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Health & Status](#health--status)
- [Sessions](#sessions)
- [Profile](#profile)
- [Settings](#settings)
- [Contacts](#contacts)
- [Presence](#presence)
- [Chat](#chat)
- [Messages - Send](#messages---send)
- [Messages - Actions](#messages---actions)
- [Groups](#groups)
- [Communities](#communities)
- [Media](#media)
- [Newsletters (Channels)](#newsletters-channels)
- [Status (Stories)](#status-stories)
- [Calls](#calls)
- [Webhooks](#webhooks)
- [Chatwoot Integration](#chatwoot-integration)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints (except `/`, `/health`, `/swagger/*`) require authentication via the `Authorization` header.

**Header:**
```
Authorization: your-api-key
```

**Authentication Types:**
- **Global API Key**: Full access to all sessions and endpoints
- **Session API Key**: Access only to the specific session (returned on session creation)

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

Check API health and database connection status. No authentication required.

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

Get all WhatsApp sessions with profile info and stats.

```bash
curl -X GET http://localhost:3000/sessions \
  -H "Authorization: your-api-key"
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
    "apiKey": "session-specific-key",
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
  -H "Authorization: your-api-key" \
  -d '{"session": "my-session"}'
```

**Response (201):**
```json
{
  "id": "uuid-here",
  "session": "my-session",
  "status": "disconnected",
  "apiKey": "generated-session-api-key",
  "createdAt": "2024-12-03T10:00:00Z",
  "updatedAt": "2024-12-03T10:00:00Z"
}
```

---

## Get Session Status

**GET** `/:session/status`

Get information and status of a specific session.

```bash
curl -X GET http://localhost:3000/my-session/status \
  -H "Authorization: your-api-key"
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

**DELETE** `/:session`

Delete a WhatsApp session.

```bash
curl -X DELETE http://localhost:3000/my-session \
  -H "Authorization: your-api-key"
```

**Response (200):**
```json
{
  "message": "session deleted"
}
```

---

## Connect Session

**POST** `/:session/connect`

Connect a WhatsApp session. Returns QR code endpoint if not authenticated.

```bash
curl -X POST http://localhost:3000/my-session/connect \
  -H "Authorization: your-api-key"
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
  "qr": "/my-session/qr"
}
```

---

## Get QR Code

**GET** `/:session/qr`

Get QR code for session authentication (base64 PNG image).

```bash
curl -X GET http://localhost:3000/my-session/qr \
  -H "Authorization: your-api-key"
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

**POST** `/:session/pairphone`

Get pairing code for phone number authentication (alternative to QR).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number with country code |

```bash
curl -X POST http://localhost:3000/my-session/pairphone \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
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

**POST** `/:session/disconnect`

Disconnect a WhatsApp session (keeps authentication).

```bash
curl -X POST http://localhost:3000/my-session/disconnect \
  -H "Authorization: your-api-key"
```

**Response (200):**
```json
{
  "message": "session disconnected"
}
```

---

## Logout Session

**POST** `/:session/logout`

Logout from WhatsApp (removes authentication, needs new QR scan).

```bash
curl -X POST http://localhost:3000/my-session/logout \
  -H "Authorization: your-api-key"
```

**Response (200):**
```json
{
  "message": "logged out successfully"
}
```

---

## Restart Session

**POST** `/:session/restart`

Restart a WhatsApp session.

```bash
curl -X POST http://localhost:3000/my-session/restart \
  -H "Authorization: your-api-key"
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

**GET** `/:session/profile`

Get current user profile information.

```bash
curl -X GET http://localhost:3000/my-session/profile \
  -H "Authorization: your-api-key"
```

**Response (200):**
```json
{
  "jid": "5511999999999@s.whatsapp.net",
  "pushName": "John Doe",
  "status": "Hey there!"
}
```

---

## Set Status Message

**POST** `/:session/profile/status`

Update status/bio message.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New status message |

```bash
curl -X POST http://localhost:3000/my-session/profile/status \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
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

**POST** `/:session/profile/name`

Update display name.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | New display name |

```bash
curl -X POST http://localhost:3000/my-session/profile/name \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
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

**POST** `/:session/profile/picture`

Update profile picture.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image | string | Yes | Base64 encoded image |

```bash
curl -X POST http://localhost:3000/my-session/profile/picture \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
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

**POST** `/:session/profile/picture/remove`

Remove profile picture.

```bash
curl -X POST http://localhost:3000/my-session/profile/picture/remove \
  -H "Authorization: your-api-key"
```

**Response (200):**
```json
{
  "message": "profile picture deleted"
}
```

---

# Settings

## Get Settings

**GET** `/:session/settings`

Get all settings for a session.

```bash
curl -X GET http://localhost:3000/my-session/settings \
  -H "Authorization: your-api-key"
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

**POST** `/:session/settings`

Update settings for a session. All fields are optional.

**Local Settings:**

| Field | Type | Description |
|-------|------|-------------|
| alwaysOnline | boolean | Keep session online |
| autoRejectCalls | boolean | Automatically reject incoming calls |
| syncHistory | boolean | Enable history synchronization |

**Privacy Settings:**

| Field | Type | Description |
|-------|------|-------------|
| lastSeen | string | all, contacts, contact_blacklist, none |
| online | string | all, match_last_seen |
| profilePhoto | string | all, contacts, contact_blacklist, none |
| status | string | all, contacts, contact_blacklist, none |
| readReceipts | string | all, none |
| groupAdd | string | all, contacts, contact_blacklist |
| callAdd | string | all, known |
| defaultDisappearingTimer | string | off, 24h, 7d, 90d |

```bash
curl -X POST http://localhost:3000/my-session/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{
    "alwaysOnline": true,
    "autoRejectCalls": true,
    "lastSeen": "contacts"
  }'
```

**Response (200):** Returns updated settings object.

---

# Contacts

## Get All Contacts

**GET** `/:session/contact/list`

Get all contacts from the phone.

```bash
curl -X GET http://localhost:3000/my-session/contact/list \
  -H "Authorization: your-api-key"
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

**POST** `/:session/contact/check`

Check if phone numbers are registered on WhatsApp.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phones | array | Yes | Array of phone numbers |

```bash
curl -X POST http://localhost:3000/my-session/contact/check \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phones": ["5511999999999", "5511888888888"]}'
```

**Response (200):**
```json
[
  {
    "phone": "5511999999999",
    "isRegistered": true,
    "jid": "5511999999999@s.whatsapp.net"
  }
]
```

---

## Get Blocklist

**GET** `/:session/contact/blocklist`

Get list of blocked contacts.

```bash
curl -X GET http://localhost:3000/my-session/contact/blocklist \
  -H "Authorization: your-api-key"
```

**Response (200):**
```json
{
  "jids": ["5511777777777@s.whatsapp.net"]
}
```

---

## Update Blocklist

**POST** `/:session/contact/blocklist`

Block or unblock a contact.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| action | string | Yes | "block" or "unblock" |

```bash
curl -X POST http://localhost:3000/my-session/contact/blocklist \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
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

**GET** `/:session/contact/info?phone=:phone`

Get detailed information about a contact.

```bash
curl -X GET "http://localhost:3000/my-session/contact/info?phone=5511999999999" \
  -H "Authorization: your-api-key"
```

---

## Get Contact Avatar

**GET** `/:session/contact/avatar?phone=:phone`

Get contact's profile picture URL.

```bash
curl -X GET "http://localhost:3000/my-session/contact/avatar?phone=5511999999999" \
  -H "Authorization: your-api-key"
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

**GET** `/:session/contact/business?phone=:phone`

Get business profile information.

```bash
curl -X GET "http://localhost:3000/my-session/contact/business?phone=5511999999999" \
  -H "Authorization: your-api-key"
```

---

## Get Contact LID

**GET** `/:session/contact/lid?phone=:phone`

Get Linked ID (LID) for a contact.

```bash
curl -X GET "http://localhost:3000/my-session/contact/lid?phone=5511999999999" \
  -H "Authorization: your-api-key"
```

---

## Get Contact QR Link

**GET** `/:session/contact/qrlink`

Get wa.me QR link for adding contact.

```bash
curl -X GET http://localhost:3000/my-session/contact/qrlink \
  -H "Authorization: your-api-key"
```

---

# Presence

## Set Presence

**POST** `/:session/presence`

Set online/offline presence.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| available | boolean | Yes | true = online, false = offline |

```bash
curl -X POST http://localhost:3000/my-session/presence \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"available": true}'
```

---

## Subscribe to Presence

**POST** `/:session/presence/subscribe`

Subscribe to a contact's online/offline status updates.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |

```bash
curl -X POST http://localhost:3000/my-session/presence/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999"}'
```

---

# Chat

## Set Chat Presence (Typing)

**POST** `/:session/chat/presence`

Set typing/recording indicator in a chat.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number or JID |
| state | string | Yes | composing, recording, paused |

```bash
curl -X POST http://localhost:3000/my-session/chat/presence \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "state": "composing"}'
```

---

## Mark Messages as Read

**POST** `/:session/chat/markread`

Mark messages as read in a chat.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number or JID |
| messageIds | array | Yes | Array of message IDs |

```bash
curl -X POST http://localhost:3000/my-session/chat/markread \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "messageIds": ["ABCD1234"]}'
```

---

## Mark Chat as Unread

**POST** `/:session/chat/unread`

Mark a chat as unread.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number or JID |

```bash
curl -X POST http://localhost:3000/my-session/chat/unread \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999"}'
```

---

## Archive/Unarchive Chat

**POST** `/:session/chat/archive`

Archive or unarchive a chat.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number or JID |
| archive | boolean | Yes | true = archive, false = unarchive |

```bash
curl -X POST http://localhost:3000/my-session/chat/archive \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "archive": true}'
```

---

## Set Disappearing Timer

**POST** `/:session/chat/disappearing`

Set disappearing messages timer for a chat.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number or JID |
| timer | string | Yes | "24h", "7d", "90d", or "off" |

```bash
curl -X POST http://localhost:3000/my-session/chat/disappearing \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "timer": "24h"}'
```

---

## List All Chats

**GET** `/:session/chat/list`

Get list of all chats with pagination.

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | int | Max results (default: 100, max: 500) |
| offset | int | Offset for pagination (default: 0) |

```bash
curl -X GET "http://localhost:3000/my-session/chat/list?limit=50&offset=0" \
  -H "Authorization: your-api-key"
```

---

## Get Chat Messages

**GET** `/:session/chat/messages`

Get messages from a specific chat with pagination.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chatId | string | Yes | Chat JID |
| limit | int | No | Max results (default: 50, max: 200) |
| offset | int | No | Offset for pagination |

```bash
curl -X GET "http://localhost:3000/my-session/chat/messages?chatId=5511999999999@s.whatsapp.net&limit=20" \
  -H "Authorization: your-api-key"
```

---

## Get Chat Info

**GET** `/:session/chat/info`

Get detailed chat information.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chatId | string | Yes | Chat JID |

```bash
curl -X GET "http://localhost:3000/my-session/chat/info?chatId=5511999999999@s.whatsapp.net" \
  -H "Authorization: your-api-key"
```

---

# Messages - Send

All send endpoints support quoting messages by adding `quoted` object:
```json
{
  "quoted": {
    "messageId": "ORIGINAL_MSG_ID",
    "participant": "sender@s.whatsapp.net"
  }
}
```

## Send Text Message

**POST** `/:session/message/send/text`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number with country code |
| text | string | Yes | Message text |
| quoted | object | No | Quote a message |

```bash
curl -X POST http://localhost:3000/my-session/message/send/text \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
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

## Send Image

**POST** `/:session/message/send/image`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| image | string | Yes | Base64 or URL |
| caption | string | No | Image caption |
| mimetype | string | No | MIME type |

```bash
curl -X POST http://localhost:3000/my-session/message/send/image \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "image": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }'
```

---

## Send Audio

**POST** `/:session/message/send/audio`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| audio | string | Yes | Base64 or URL |
| ptt | boolean | No | Push-to-talk (voice message) |

```bash
curl -X POST http://localhost:3000/my-session/message/send/audio \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "audio": "base64...", "ptt": true}'
```

---

## Send Video

**POST** `/:session/message/send/video`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| video | string | Yes | Base64 or URL |
| caption | string | No | Video caption |

```bash
curl -X POST http://localhost:3000/my-session/message/send/video \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "video": "https://example.com/video.mp4"}'
```

---

## Send Document

**POST** `/:session/message/send/document`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| document | string | Yes | Base64 or URL |
| filename | string | Yes | File name |

```bash
curl -X POST http://localhost:3000/my-session/message/send/document \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "document": "base64...", "filename": "report.pdf"}'
```

---

## Send Sticker

**POST** `/:session/message/send/sticker`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| sticker | string | Yes | Base64 or URL (WebP) |

```bash
curl -X POST http://localhost:3000/my-session/message/send/sticker \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "sticker": "base64..."}'
```

---

## Send Location

**POST** `/:session/message/send/location`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| latitude | number | Yes | Latitude |
| longitude | number | Yes | Longitude |
| name | string | No | Location name |
| address | string | No | Address |

```bash
curl -X POST http://localhost:3000/my-session/message/send/location \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "latitude": -23.55, "longitude": -46.63}'
```

---

## Send Contact

**POST** `/:session/message/send/contact`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Recipient phone |
| contactName | string | Yes | Contact name |
| contactPhone | string | Yes | Contact phone |

```bash
curl -X POST http://localhost:3000/my-session/message/send/contact \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "contactName": "John", "contactPhone": "5511888888888"}'
```

---

## Send Poll

**POST** `/:session/message/send/poll`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| name | string | Yes | Poll question |
| options | array | Yes | Array of options |
| selectableCount | number | No | Max selections (default: 1) |

```bash
curl -X POST http://localhost:3000/my-session/message/send/poll \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "name": "Favorite color?", "options": ["Red", "Blue", "Green"]}'
```

---

## Send Buttons

**POST** `/:session/message/send/buttons`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| contentText | string | Yes | Message body |
| buttons | array | Yes | Array of buttons (max 3) |
| headerText | string | No | Header |
| footerText | string | No | Footer |

```bash
curl -X POST http://localhost:3000/my-session/message/send/buttons \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "contentText": "Choose:",
    "buttons": [{"buttonId": "1", "displayText": "Option 1"}]
  }'
```

---

## Send List

**POST** `/:session/message/send/list`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| title | string | Yes | List title |
| description | string | Yes | Description |
| buttonText | string | Yes | Button text |
| sections | array | Yes | Sections with rows |

```bash
curl -X POST http://localhost:3000/my-session/message/send/list \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "title": "Menu",
    "description": "Select an option",
    "buttonText": "View",
    "sections": [{"title": "Products", "rows": [{"title": "Item 1", "rowId": "1"}]}]
  }'
```

---

## Send Interactive

**POST** `/:session/message/send/interactive`

Send an interactive message with native flow buttons.

```bash
curl -X POST http://localhost:3000/my-session/message/send/interactive \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{
    "phone": "5511999999999",
    "body": "Check out!",
    "buttons": [{"name": "quick_reply", "params": {"display_text": "Buy", "id": "buy"}}]
  }'
```

---

## Send Template

**POST** `/:session/message/send/template`

Send a template message with buttons.

---

## Send Carousel

**POST** `/:session/message/send/carousel`

Send a carousel/product cards message.

---

# Messages - Actions

## Send Reaction

**POST** `/:session/message/react`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Chat phone |
| messageId | string | Yes | Message ID |
| emoji | string | Yes | Emoji (empty to remove) |

```bash
curl -X POST http://localhost:3000/my-session/message/react \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "messageId": "3EB0ABC123", "emoji": "👍"}'
```

---

## Delete Message

**POST** `/:session/message/delete`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| messageId | string | Yes | Message ID |
| forMe | boolean | No | Delete for me only |

```bash
curl -X POST http://localhost:3000/my-session/message/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "messageId": "3EB0ABC123", "forMe": false}'
```

---

## Edit Message

**POST** `/:session/message/edit`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| messageId | string | Yes | Message ID |
| newText | string | Yes | New text |

```bash
curl -X POST http://localhost:3000/my-session/message/edit \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "messageId": "3EB0ABC123", "newText": "Edited"}'
```

---

## Vote on Poll

**POST** `/:session/message/poll/vote`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number |
| pollMessageId | string | Yes | Poll message ID |
| selectedOptions | array | Yes | Selected options |

```bash
curl -X POST http://localhost:3000/my-session/message/poll/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"phone": "5511999999999", "pollMessageId": "3EB0ABC123", "selectedOptions": ["Blue"]}'
```

---

## Request Unavailable Message

**POST** `/:session/message/request-unavailable`

Request a message that wasn't delivered.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chatJid | string | Yes | Chat JID |
| messageId | string | Yes | Message ID |
| senderJid | string | No | Sender JID |

---

# Groups

## Create Group

**POST** `/:session/group/create`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Group name |
| participants | array | Yes | Array of phone numbers |

```bash
curl -X POST http://localhost:3000/my-session/group/create \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"name": "My Group", "participants": ["5511999999999"]}'
```

---

## Get Joined Groups

**GET** `/:session/group/list`

Get all groups the session is a member of.

```bash
curl -X GET http://localhost:3000/my-session/group/list \
  -H "Authorization: your-api-key"
```

---

## Get Group Info

**GET** `/:session/group/info?groupId=:groupId`

Get detailed information about a group.

```bash
curl -X GET "http://localhost:3000/my-session/group/info?groupId=123456789@g.us" \
  -H "Authorization: your-api-key"
```

---

## Get Group Picture

**GET** `/:session/group/avatar?groupId=:groupId`

Get group profile picture URL.

---

## Leave Group

**POST** `/:session/group/leave`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |

```bash
curl -X POST http://localhost:3000/my-session/group/leave \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"groupId": "123456789@g.us"}'
```

---

## Update Group Name

**POST** `/:session/group/name`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |
| name | string | Yes | New name |

---

## Update Group Topic

**POST** `/:session/group/topic`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |
| topic | string | Yes | New description |

---

## Set Group Picture

**POST** `/:session/group/photo`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |
| image | string | Yes | Base64 image |

---

## Delete Group Picture

**POST** `/:session/group/photo/remove`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |

---

## Add Participants

**POST** `/:session/group/participants/add`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |
| participants | array | Yes | Phone numbers |

---

## Remove Participants

**POST** `/:session/group/participants/remove`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |
| participants | array | Yes | Phone numbers |

---

## Promote Participants

**POST** `/:session/group/participants/promote`

Promote participants to admin.

---

## Demote Participants

**POST** `/:session/group/participants/demote`

Demote admins to regular members.

---

## Set Group Announce Mode

**POST** `/:session/group/announce`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |
| announce | boolean | Yes | Only admins can send |

---

## Set Group Locked Mode

**POST** `/:session/group/locked`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |
| locked | boolean | Yes | Only admins can edit |

---

## Set Group Approval Mode

**POST** `/:session/group/approval`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |
| approvalMode | boolean | Yes | Require approval |

---

## Set Group Member Add Mode

**POST** `/:session/group/memberadd`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |
| mode | string | Yes | "admin_add" or "all_member_add" |

---

## Get Group Invite Link

**GET** `/:session/group/invitelink?groupId=:groupId`

Get invite link for a group.

---

## Get Group Info from Invite Link

**GET** `/:session/group/inviteinfo?inviteLink=:url`

Get group information from an invite link.

---

## Join Group via Invite Link

**POST** `/:session/group/join`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| inviteLink | string | Yes | Invite URL |

---

## Get Join Requests

**GET** `/:session/group/requests?groupId=:groupId`

Get pending join requests.

---

## Handle Join Requests

**POST** `/:session/group/requests/action`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string | Yes | Group JID |
| participants | array | Yes | Phone numbers |
| action | string | Yes | "approve" or "reject" |

---

## Send Group Message (Legacy)

**POST** `/:session/group/send/text`

Legacy endpoint for sending text to groups.

---

# Communities

## Get Sub Groups

**GET** `/:session/community/groups?communityId=:id`

Get all groups linked to a community.

---

## Link Group to Community

**POST** `/:session/community/link`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| communityId | string | Yes | Community JID |
| childGroupId | string | Yes | Group JID |

---

## Unlink Group from Community

**POST** `/:session/community/unlink`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| communityId | string | Yes | Community JID |
| childGroupId | string | Yes | Group JID |

---

# Media

## List Media

**GET** `/:session/media/list`

List all downloaded media files.

---

## List Pending Media

**GET** `/:session/media/pending`

List media files pending download.

---

## Process Pending Media

**POST** `/:session/media/process`

Download all pending media files.

---

## Get Media

**GET** `/:session/media/download?messageId=:id`

Get/download media file by message ID.

---

# Newsletters (Channels)

## Create Newsletter

**POST** `/:session/newsletter/create`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Channel name |
| description | string | No | Description |

---

## Get Subscribed Newsletters

**GET** `/:session/newsletter/list`

Get all subscribed channels.

---

## Get Newsletter Info

**GET** `/:session/newsletter/info?newsletterId=:id`

Get channel information.

---

## Follow Newsletter

**POST** `/:session/newsletter/follow`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| newsletterId | string | Yes | Newsletter JID |

---

## Unfollow Newsletter

**POST** `/:session/newsletter/unfollow`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| newsletterId | string | Yes | Newsletter JID |

---

## Get Newsletter Messages

**GET** `/:session/newsletter/messages?newsletterId=:id`

Get messages from a channel.

---

## React to Newsletter Message

**POST** `/:session/newsletter/react`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| newsletterId | string | Yes | Newsletter JID |
| serverId | number | Yes | Message server ID |
| reaction | string | Yes | Emoji |

---

## Toggle Newsletter Mute

**POST** `/:session/newsletter/mute`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| newsletterId | string | Yes | Newsletter JID |
| mute | boolean | Yes | Mute state |

---

## Mark Newsletter Viewed

**POST** `/:session/newsletter/viewed`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| newsletterId | string | Yes | Newsletter JID |
| serverIds | array | Yes | Server IDs |

---

## Subscribe to Live Updates

**POST** `/:session/newsletter/subscribe-live`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| newsletterId | string | Yes | Newsletter JID |

---

# Status (Stories)

## Send Story

**POST** `/:session/status/send`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | No | Text status |
| image | string | No | Base64 image |
| video | string | No | Base64 video |
| caption | string | No | Media caption |

---

## Get Status Privacy

**GET** `/:session/status/privacy`

Get status privacy settings.

---

# Calls

## Reject Call

**POST** `/:session/call/reject`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| callFrom | string | Yes | Caller phone |
| callId | string | Yes | Call ID |

```bash
curl -X POST http://localhost:3000/my-session/call/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"callFrom": "5511999999999", "callId": "CALL123"}'
```

---

# Webhooks

## Get Webhook Configuration

**GET** `/:session/webhook`

Get webhook configuration for a session.

```bash
curl -X GET http://localhost:3000/my-session/webhook \
  -H "Authorization: your-api-key"
```

---

## Set Webhook

**POST** `/:session/webhook`

Create webhook configuration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | Webhook URL |
| events | array | No | Event types to receive |
| enabled | boolean | No | Enable webhook |
| secret | string | No | Secret for signature |

```bash
curl -X POST http://localhost:3000/my-session/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{"url": "https://example.com/webhook", "events": ["message.received"], "enabled": true}'
```

---

## Update Webhook

**PUT** `/:session/webhook`

Update webhook configuration.

---

## Delete Webhook

**DELETE** `/:session/webhook`

Delete webhook configuration.

---

## Get Available Events

**GET** `/events`

Get all available webhook event types.

```bash
curl -X GET http://localhost:3000/events \
  -H "Authorization: your-api-key"
```

---

# Chatwoot Integration

Integration with Chatwoot for customer support.

## Set Chatwoot Config

**POST** `/sessions/:sessionId/chatwoot/set`

Configure Chatwoot integration for a session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| baseUrl | string | Yes | Chatwoot URL |
| apiAccessToken | string | Yes | API token |
| accountId | number | Yes | Account ID |
| inboxId | number | Yes | Inbox ID |

```bash
curl -X POST http://localhost:3000/sessions/my-session/chatwoot/set \
  -H "Content-Type: application/json" \
  -H "Authorization: your-api-key" \
  -d '{
    "baseUrl": "https://chatwoot.example.com",
    "apiAccessToken": "token",
    "accountId": 1,
    "inboxId": 1
  }'
```

---

## Get Chatwoot Config

**GET** `/sessions/:sessionId/chatwoot/find`

Get Chatwoot configuration.

---

## Delete Chatwoot Config

**DELETE** `/sessions/:sessionId/chatwoot`

Remove Chatwoot integration.

---

## Sync All

**POST** `/sessions/:sessionId/chatwoot/sync`

Sync all contacts and messages to Chatwoot.

---

## Sync Contacts

**POST** `/sessions/:sessionId/chatwoot/sync/contacts`

Sync only contacts to Chatwoot.

---

## Sync Messages

**POST** `/sessions/:sessionId/chatwoot/sync/messages`

Sync only messages to Chatwoot.

---

## Get Sync Status

**GET** `/sessions/:sessionId/chatwoot/sync/status`

Get current sync status.

---

## Get Sync Overview

**GET** `/sessions/:sessionId/chatwoot/overview`

Get overview of synced data.

---

## Resolve All Conversations

**POST** `/sessions/:sessionId/chatwoot/resolve-all`

Resolve all open conversations.

---

## Get Conversations Stats

**GET** `/sessions/:sessionId/chatwoot/conversations/stats`

Get conversation statistics.

---

## Reset Chatwoot

**POST** `/sessions/:sessionId/chatwoot/reset`

Reset Chatwoot integration (for testing).

---

## Chatwoot Webhook

**POST** `/chatwoot/webhook/:sessionId`

Webhook endpoint for Chatwoot events. No authentication required.

---

# Error Responses

```json
{
  "error": "description of the error"
}
```

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (session key accessing wrong session) |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

# Rate Limiting

API requests are rate limited. Default: **200 requests per second** per IP.

When rate limited, you'll receive a `429 Too Many Requests` response.

Configure via environment:
- `RATE_LIMIT_PER_SECOND`: Requests per second
- `RATE_LIMIT_BURST`: Burst size

---

# Swagger Documentation

Interactive API documentation available at:

```
http://localhost:3000/swagger/index.html
```
