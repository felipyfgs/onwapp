# History Sync Data Model

## Overview

This document describes the data model for storing WhatsApp History Sync data in ZPWoot. The model is designed to be efficient, avoid redundancy with whatsmeow tables, and support common query patterns.

## Migration File

`internal/db/migrations/008_history_sync_tables.sql`

---

## Design Principles

### 1. No Redundancy with Whatsmeow

Whatsmeow already stores certain data that we should **NOT duplicate**:

| Whatsmeow Table | Data Stored | Our Action |
|-----------------|-------------|------------|
| `whatsmeow_contacts` | push_name, business_name, first_name, full_name | Use via JOIN or resolve at runtime |
| `whatsmeow_chat_settings` | muted_until, pinned, archived | Use via JOIN in views |
| `whatsmeow_lid_map` | LID → phone mapping | Use for LID resolution |

### 2. Cascade Deletion

All new tables reference `zpSessions` with `ON DELETE CASCADE`. When a session is deleted:
- All zpChats for that session are deleted
- All zpGroupPastParticipants are deleted
- All zpStickers are deleted
- zpMessages already cascade (existing behavior)

### 3. Optimized for Common Queries

Indexes are designed for these patterns:
- List chats ordered by last activity
- Get messages with pagination by msgOrderID
- Find pending media/sticker downloads
- Filter chats by unread count

---

## Schema Changes

### zpMessages Extensions

New columns added to existing `zpMessages` table:

| Column | Type | Purpose |
|--------|------|---------|
| `msgOrderID` | BIGINT | Server-assigned sequence for precise History Sync ordering |
| `stubType` | INTEGER | System message type (1=revoke, 28=add, 31=remove, 132=delete) |
| `stubParams` | TEXT[] | Parameters for system messages (e.g., JIDs of added/removed users) |
| `messageSecret` | BYTEA | Decryption key for view-once messages |
| `revokeTimestamp` | TIMESTAMPTZ | When message was deleted for everyone |
| `expiresAt` | TIMESTAMPTZ | Expiration time for ephemeral/status messages |
| `broadcast` | BOOLEAN | True for broadcast list messages |

**New Indexes:**
- `idx_zpMessages_order` - For History Sync pagination
- `idx_zpMessages_stubType` - Find system messages
- `idx_zpMessages_expires` - Cleanup expired messages
- `idx_zpMessages_status_broadcast` - Status messages

---

## New Tables

### 1. zpChats

Extended chat metadata from History Sync that complements (not duplicates) `whatsmeow_chat_settings`.

```sql
CREATE TABLE "zpChats" (
    "id" UUID PRIMARY KEY,
    "sessionId" UUID REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "chatJid" VARCHAR(255) NOT NULL,
    
    -- Display Info
    "name" VARCHAR(500),
    
    -- Unread Tracking
    "unreadCount" INTEGER DEFAULT 0,
    "unreadMentionCount" INTEGER DEFAULT 0,
    "markedAsUnread" BOOLEAN DEFAULT FALSE,
    
    -- Ephemeral/Disappearing Settings
    "ephemeralExpiration" INTEGER DEFAULT 0,
    "ephemeralSettingTimestamp" BIGINT DEFAULT 0,
    "disappearingInitiator" SMALLINT DEFAULT 0,
    
    -- Chat State
    "readOnly" BOOLEAN DEFAULT FALSE,
    "suspended" BOOLEAN DEFAULT FALSE,
    "locked" BOOLEAN DEFAULT FALSE,
    
    -- Limit Sharing
    "limitSharing" BOOLEAN DEFAULT FALSE,
    "limitSharingTimestamp" BIGINT DEFAULT 0,
    "limitSharingTrigger" SMALLINT DEFAULT 0,
    "limitSharingInitiatedByMe" BOOLEAN DEFAULT FALSE,
    
    -- Group-Specific
    "isDefaultSubgroup" BOOLEAN DEFAULT FALSE,
    "commentsCount" INTEGER DEFAULT 0,
    
    -- Sync Metadata
    "conversationTimestamp" BIGINT,
    "pHash" VARCHAR(100),
    "notSpam" BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    "syncedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE ("sessionId", "chatJid")
);
```

**Key Design Decisions:**
- `conversationTimestamp` stored as BIGINT (epoch) to match WhatsApp's format
- Ephemeral settings stored here (not in whatsmeow_chat_settings)
- Limit sharing fields for privacy feature tracking
- `pHash` useful for detecting group membership changes

### 2. zpGroupPastParticipants

Historical record of users who left or were removed from groups.

```sql
CREATE TABLE "zpGroupPastParticipants" (
    "id" UUID PRIMARY KEY,
    "sessionId" UUID REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    "groupJid" VARCHAR(255) NOT NULL,
    "userJid" VARCHAR(255) NOT NULL,
    
    "leaveReason" SMALLINT DEFAULT 0,  -- 0=left, 1=removed
    "leaveTimestamp" TIMESTAMPTZ NOT NULL,
    
    "phone" VARCHAR(50),      -- Resolved at sync time
    "pushName" VARCHAR(255),  -- Cached at sync time
    
    "syncedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE ("sessionId", "groupJid", "userJid", "leaveTimestamp")
);
```

**Key Design Decisions:**
- `phone` and `pushName` cached at sync time for historical accuracy
- Unique constraint allows same user to leave/rejoin multiple times
- `leaveReason` as SMALLINT (0=left voluntarily, 1=removed by admin)

### 3. zpStickers

Frequently used stickers with usage statistics.

```sql
CREATE TABLE "zpStickers" (
    "id" UUID PRIMARY KEY,
    "sessionId" UUID REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    
    -- WhatsApp Media Identifiers
    "waFileSHA256" BYTEA NOT NULL,
    "waFileEncSHA256" BYTEA,
    "waMediaKey" BYTEA,
    "waDirectPath" TEXT,
    
    -- Metadata
    "mimeType" VARCHAR(100) DEFAULT 'image/webp',
    "fileSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    
    -- Usage Statistics
    "weight" REAL DEFAULT 0,
    "lastUsedAt" TIMESTAMPTZ,
    
    -- Sticker Flags
    "isLottie" BOOLEAN DEFAULT FALSE,
    "isAvatar" BOOLEAN DEFAULT FALSE,
    
    -- Storage (same pattern as zpMedia)
    "storageKey" VARCHAR(500),
    "storageUrl" TEXT,
    "downloaded" BOOLEAN DEFAULT FALSE,
    "downloadError" TEXT,
    "downloadAttempts" INTEGER DEFAULT 0,
    
    "syncedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE ("sessionId", "waFileSHA256")
);
```

**Key Design Decisions:**
- Same download tracking pattern as `zpMedia`
- `weight` for usage frequency (higher = more used)
- `isLottie` for animated stickers (different rendering)
- Unique by file hash, not by any other identifier

### 4. zpHistorySyncProgress

Tracks History Sync progress for resumable syncs.

```sql
CREATE TABLE "zpHistorySyncProgress" (
    "id" UUID PRIMARY KEY,
    "sessionId" UUID REFERENCES "zpSessions"("id") ON DELETE CASCADE,
    
    "syncType" VARCHAR(50) NOT NULL,  -- INITIAL_BOOTSTRAP, RECENT, etc.
    
    -- Progress Markers
    "lastChunkIndex" INTEGER DEFAULT 0,
    "lastMsgOrderID" BIGINT,
    "lastTimestamp" TIMESTAMPTZ,
    
    -- Status
    "status" VARCHAR(20) DEFAULT 'pending',
    "progress" SMALLINT DEFAULT 0,
    
    -- Statistics
    "totalChunks" INTEGER,
    "processedChunks" INTEGER DEFAULT 0,
    "totalMessages" INTEGER DEFAULT 0,
    "processedMessages" INTEGER DEFAULT 0,
    "totalChats" INTEGER DEFAULT 0,
    "processedChats" INTEGER DEFAULT 0,
    "errors" INTEGER DEFAULT 0,
    
    -- Timing
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE ("sessionId", "syncType")
);
```

**Sync Types:**
- `INITIAL_BOOTSTRAP` - Full initial sync
- `INITIAL_STATUS_V3` - Status/Stories sync
- `RECENT` - Recent messages sync
- `PUSH_NAME` - Contact name updates
- `NON_BLOCKING_DATA` - Background data
- `ON_DEMAND` - User-requested sync
- `FULL` - Complete resync

---

## Views

### vwChatList

Combined chat view merging `zpChats` with `whatsmeow_chat_settings`:

```sql
SELECT 
    c."chatJid",
    c."name",
    c."unreadCount",
    COALESCE(wcs.muted_until, 0) AS "mutedUntil",
    COALESCE(wcs.pinned, FALSE) AS "pinned",
    COALESCE(wcs.archived, FALSE) AS "archived",
    c."ephemeralExpiration",
    to_timestamp(c."conversationTimestamp") AS "lastMessageAt"
FROM "zpChats" c
LEFT JOIN whatsmeow_chat_settings wcs ON ...
```

### vwGroupHistory

Group membership history with resolved names:

```sql
SELECT 
    pp."groupJid",
    pp."userJid",
    COALESCE(pp."pushName", wc.push_name) AS "pushName",
    CASE pp."leaveReason" 
        WHEN 0 THEN 'left'
        WHEN 1 THEN 'removed'
    END AS "leaveReasonText",
    pp."leaveTimestamp"
FROM "zpGroupPastParticipants" pp
LEFT JOIN whatsmeow_contacts wc ON ...
```

---

## What NOT to Store

### 1. Temporary Status Data
Status/Stories expire in 24 hours. We store them in `zpMessages` with `expiresAt` for automatic cleanup rather than a separate table.

### 2. Contact Data
Already in `whatsmeow_contacts`. Don't duplicate.

### 3. Basic Chat Settings
`muted_until`, `pinned`, `archived` are in `whatsmeow_chat_settings`. Use the view.

### 4. Raw Sync Chunks
Process and discard. No need to store raw protobuf chunks.

---

## Index Strategy

### High-Frequency Queries

| Query Pattern | Index |
|---------------|-------|
| List chats by activity | `idx_zpChats_session_timestamp` |
| Messages by msgOrderID | `idx_zpMessages_order` |
| Pending downloads | `idx_zpStickers_pending` |
| Unread chats | `idx_zpChats_unread` |
| Status messages | `idx_zpMessages_status_broadcast` |

### Partial Indexes

Used where queries filter on specific conditions:
- `WHERE "stubType" IS NOT NULL` - Only 5-10% of messages are stubs
- `WHERE "downloaded" = FALSE` - Pending downloads
- `WHERE "unreadCount" > 0` - Unread chats only

---

## Cleanup Strategy

### Expired Messages

```sql
-- Run periodically (cron or pg_cron)
DELETE FROM "zpMessages" 
WHERE "expiresAt" IS NOT NULL 
AND "expiresAt" < NOW();
```

### Failed Downloads

```sql
-- Reset stuck downloads older than 24h
UPDATE "zpStickers"
SET "downloadAttempts" = 0, "downloadError" = NULL
WHERE "downloaded" = FALSE
AND "downloadAttempts" >= 3
AND "updatedAt" < NOW() - INTERVAL '24 hours';
```

---

## Trade-offs

### Normalization vs Performance

| Decision | Trade-off |
|----------|-----------|
| `phone`/`pushName` cached in zpGroupPastParticipants | Denormalized but preserves historical accuracy |
| Views for combined data | Slight query overhead but maintains single source of truth |
| Partial indexes | More storage but faster queries on common filters |

### Storage vs Features

| Decision | Reasoning |
|----------|-----------|
| Store stickers | Enables sticker picker UI without re-downloading |
| Store past participants | Essential for group context in CRM integrations |
| Don't store raw sync data | Would balloon storage with little benefit |

---

## ERD Summary

```
zpSessions (1) ──────┬──────── (n) zpMessages
                     │              │
                     │              └─── msgOrderID, stubType, expiresAt (NEW)
                     │
                     ├──────── (n) zpChats
                     │              │
                     │              └─── ephemeralExpiration, unreadCount
                     │
                     ├──────── (n) zpGroupPastParticipants
                     │              │
                     │              └─── leaveReason, leaveTimestamp
                     │
                     ├──────── (n) zpStickers
                     │              │
                     │              └─── weight, isLottie, download tracking
                     │
                     └──────── (n) zpHistorySyncProgress
                                    │
                                    └─── syncType, progress, statistics
```

---

## Usage Examples

### Get chat list with unread counts
```sql
SELECT * FROM "vwChatList" 
WHERE "sessionId" = $1 
ORDER BY "conversationTimestamp" DESC 
LIMIT 50;
```

### Get messages with History Sync ordering
```sql
SELECT * FROM "zpMessages"
WHERE "sessionId" = $1 AND "chatJid" = $2
ORDER BY "msgOrderID" DESC NULLS LAST, "timestamp" DESC
LIMIT 50;
```

### Get stickers ordered by usage
```sql
SELECT * FROM "zpStickers"
WHERE "sessionId" = $1 AND "downloaded" = TRUE
ORDER BY "weight" DESC, "lastUsedAt" DESC
LIMIT 20;
```

### Get group history
```sql
SELECT * FROM "vwGroupHistory"
WHERE "sessionId" = $1 AND "groupJid" = $2
ORDER BY "leaveTimestamp" DESC;
```

### Check sync progress
```sql
SELECT * FROM "zpHistorySyncProgress"
WHERE "sessionId" = $1
ORDER BY "updatedAt" DESC;
```
