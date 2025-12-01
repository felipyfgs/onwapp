# Changelog

All notable changes to ZPWoot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-01

### Added

#### Core Features
- Multi-session WhatsApp management with PostgreSQL persistence
- RESTful API with Gin framework
- Swagger API documentation
- API key authentication
- Rate limiting and CORS support

#### Messaging
- Send text, image, video, audio, document, sticker messages
- Send location and contact cards
- Send polls with voting support
- Send interactive messages (buttons, lists, templates, carousels)
- Message reactions
- Message editing and deletion
- Reply/quote messages
- Disappearing messages support

#### Groups
- Create and manage groups
- Add/remove participants
- Promote/demote admins
- Update group settings (name, description, picture)
- Join via invite link
- Group join request management

#### Contacts
- Contact list management
- Check phone numbers on WhatsApp
- Get contact info and avatars
- Business profile support
- Block/unblock contacts
- Presence subscription

#### Newsletters (Channels)
- Create newsletters
- Follow/unfollow newsletters
- Get newsletter messages
- Send reactions to newsletter posts

#### Stories/Status
- Post status updates
- Privacy settings for status

#### Communities
- Link/unlink groups to communities
- Get community subgroups

#### Media
- MinIO/S3 storage integration
- Automatic media download
- Media processing and thumbnails
- Sticker management

#### Chatwoot Integration
- Bidirectional message sync
- Contact auto-creation
- Delivery/read receipt sync
- Media attachment support
- Brazilian phone number normalization (9-digit merge)
- Agent signature on messages
- Bot message handling
- Avatar sync
- Direct database integration for advanced features

#### Queue System (NATS JetStream)
- Reliable message queue between WhatsApp and Chatwoot
- Automatic retry with exponential backoff
- Dead Letter Queue for failed messages
- Graceful degradation to direct processing

#### History Sync
- Full conversation history synchronization
- Extended chat metadata (ephemeral settings, unread counts)
- Sticker sync from WhatsApp

#### Webhooks
- 60+ event types support
- Configurable per session
- Secure webhook delivery

### Technical
- Go 1.24+ with whatsmeow library
- PostgreSQL 16 database
- Zerolog structured logging
- Docker and Docker Compose support

---

## Version History

- **0.1.0** - Initial release with full WhatsApp API and Chatwoot integration
