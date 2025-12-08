#!/bin/bash
set -e

echo "==> Pushing main branch..."
git push origin main

echo "==> Deleting local tag v1.0.0 if exists..."
git tag -d v1.0.0 2>/dev/null || echo "Tag local não existe"

echo "==> Deleting remote tag v1.0.0 if exists..."
git push origin :refs/tags/v1.0.0 2>/dev/null || echo "Tag remota não existe"

echo "==> Creating new tag v1.0.0..."
git tag -a v1.0.0 -m "Release v1.0.0 - WhatsApp API Bridge"

echo "==> Pushing tag v1.0.0..."
git push origin v1.0.0

echo ""
echo "==> Done! Check GitHub Actions:"
echo "    https://github.com/felipyfgs/onwapp/actions"
