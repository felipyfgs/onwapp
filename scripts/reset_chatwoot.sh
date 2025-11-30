#!/bin/bash
# Reset Chatwoot data for testing imports
# Usage: ./reset_chatwoot.sh

set -e

DB_HOST="localhost"
DB_PORT="5433"
DB_USER="postgres"
DB_PASS="ZeცaPass2030"
DB_NAME="chatwoot"

# Use docker exec to run psql inside the container, or direct connection
echo "=== Resetting Chatwoot data ==="

# Try using curl to call our API endpoint first (fastest)
API_URL="http://localhost:3000"
API_KEY="your-api-key-here"

# If psql is available locally
if command -v psql &> /dev/null; then
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
BEGIN;
DELETE FROM messages WHERE account_id = 1 AND conversation_id > 1;
DELETE FROM conversations WHERE account_id = 1 AND id > 1;
DELETE FROM contact_inboxes WHERE contact_id > 1;
DELETE FROM contacts WHERE account_id = 1 AND id > 1;
COMMIT;
SELECT 
  (SELECT COUNT(*) FROM contacts WHERE account_id = 1) as contacts,
  (SELECT COUNT(*) FROM contact_inboxes) as contact_inboxes,
  (SELECT COUNT(*) FROM conversations WHERE account_id = 1) as conversations,
  (SELECT COUNT(*) FROM messages WHERE account_id = 1) as messages;
EOF
# Try docker exec
elif command -v docker &> /dev/null; then
    docker exec -i $(docker ps -qf "name=postgres" | head -1) psql -U $DB_USER -d $DB_NAME << 'EOF'
BEGIN;
DELETE FROM messages WHERE account_id = 1 AND conversation_id > 1;
DELETE FROM conversations WHERE account_id = 1 AND id > 1;
DELETE FROM contact_inboxes WHERE contact_id > 1;
DELETE FROM contacts WHERE account_id = 1 AND id > 1;
COMMIT;
SELECT 
  (SELECT COUNT(*) FROM contacts WHERE account_id = 1) as contacts,
  (SELECT COUNT(*) FROM contact_inboxes) as contact_inboxes,
  (SELECT COUNT(*) FROM conversations WHERE account_id = 1) as conversations,
  (SELECT COUNT(*) FROM messages WHERE account_id = 1) as messages;
EOF
else
    echo "ERROR: Neither psql nor docker found. Use the MCP tool to reset:"
    echo ""
    echo "Run these SQL commands via chatwoot-db tool:"
    echo "  DELETE FROM messages WHERE account_id = 1 AND conversation_id > 1;"
    echo "  DELETE FROM conversations WHERE account_id = 1 AND id > 1;"
    echo "  DELETE FROM contact_inboxes WHERE contact_id > 1;"
    echo "  DELETE FROM contacts WHERE account_id = 1 AND id > 1;"
    exit 1
fi

echo ""
echo "=== Reset complete ==="
