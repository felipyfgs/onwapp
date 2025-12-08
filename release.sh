#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==> OnWapp Release Script${NC}"
echo ""

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}Error: Working directory is not clean. Commit or stash your changes first.${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Get latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
echo -e "Latest tag: ${YELLOW}${LATEST_TAG}${NC}"

# Parse version
VERSION=${LATEST_TAG#v}
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

# Calculate next versions
NEXT_MAJOR="v$((MAJOR + 1)).0.0"
NEXT_MINOR="v${MAJOR}.$((MINOR + 1)).0"
NEXT_PATCH="v${MAJOR}.${MINOR}.$((PATCH + 1))"

echo ""
echo "Choose release type:"
echo "  1) Patch   - ${NEXT_PATCH}  (bug fixes)"
echo "  2) Minor   - ${NEXT_MINOR}  (new features, backward compatible)"
echo "  3) Major   - ${NEXT_MAJOR}  (breaking changes)"
echo "  4) Custom  - specify version"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1) NEW_VERSION=$NEXT_PATCH ;;
    2) NEW_VERSION=$NEXT_MINOR ;;
    3) NEW_VERSION=$NEXT_MAJOR ;;
    4)
        read -p "Enter custom version (e.g., v1.2.3): " NEW_VERSION
        if [[ ! $NEW_VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo -e "${RED}Error: Invalid version format. Use vX.Y.Z${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}Creating release ${NEW_VERSION}${NC}"
echo ""

# Confirm
read -p "Continue? [y/N]: " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "==> Fetching latest changes..."
git fetch origin

echo "==> Switching to develop..."
git checkout develop
git pull origin develop

echo "==> Switching to main..."
git checkout main
git pull origin main

echo "==> Merging develop into main..."
git merge develop --no-edit

echo "==> Pushing main..."
git push origin main

echo "==> Creating tag ${NEW_VERSION}..."
git tag -a ${NEW_VERSION} -m "Release ${NEW_VERSION}"

echo "==> Pushing tag..."
git push origin ${NEW_VERSION}

echo "==> Switching back to ${CURRENT_BRANCH}..."
git checkout ${CURRENT_BRANCH}

echo ""
echo -e "${GREEN}✓ Release ${NEW_VERSION} created successfully!${NC}"
echo ""
echo "Monitor the release at:"
echo "  https://github.com/felipyfgs/onwapp/actions"
echo "  https://github.com/felipyfgs/onwapp/releases"
echo ""
