-- Reset Chatwoot data for testing imports
-- Run with: psql -h localhost -p 5433 -U postgres -d chatwoot -f reset_chatwoot.sql

BEGIN;

-- Delete messages (except bot conversation id=1)
DELETE FROM messages WHERE account_id = 1 AND conversation_id > 1;

-- Delete conversations (except bot conversation id=1)
DELETE FROM conversations WHERE account_id = 1 AND id > 1;

-- Delete contact_inboxes (except bot contact id=1)
DELETE FROM contact_inboxes WHERE contact_id > 1;

-- Delete contacts (except bot contact id=1 - ZPWoot)
DELETE FROM contacts WHERE account_id = 1 AND id > 1;

-- Reset sequences
SELECT setval('contacts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM contacts));
SELECT setval('contact_inboxes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM contact_inboxes));
SELECT setval('conversations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM conversations));
SELECT setval('messages_id_seq', (SELECT COALESCE(MAX(id), 1) FROM messages));

COMMIT;

-- Show counts after reset
SELECT 
  (SELECT COUNT(*) FROM contacts WHERE account_id = 1) as contacts,
  (SELECT COUNT(*) FROM contact_inboxes) as contact_inboxes,
  (SELECT COUNT(*) FROM conversations WHERE account_id = 1) as conversations,
  (SELECT COUNT(*) FROM messages WHERE account_id = 1) as messages;
