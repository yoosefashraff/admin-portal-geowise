#!/bin/bash
# Git Push Safety Script
# This script validates that you're pushing to the correct remote

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Repository mapping
UPSTREAM_REPO="GeoWise-AI/company-admin-portal"
ORIGIN_REPO="yoosefashraff/company-admin-portal"

# Get the remote and branch from arguments
REMOTE=${1:-""}
BRANCH=${2:-""}

if [ -z "$REMOTE" ] || [ -z "$BRANCH" ]; then
    echo -e "${RED}❌ Usage: $0 <remote> <branch>${NC}"
    echo -e "${YELLOW}Example: $0 upstream feature/task-description${NC}"
    exit 1
fi

# Verify remotes are configured correctly
echo -e "${YELLOW}🔍 Verifying git remotes...${NC}"
UPSTREAM_URL=$(git remote get-url upstream 2>/dev/null || echo "")
ORIGIN_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$UPSTREAM_URL" ]; then
    echo -e "${RED}❌ ERROR: 'upstream' remote not configured!${NC}"
    echo -e "${YELLOW}Run: git remote add upstream https://github.com/$UPSTREAM_REPO.git${NC}"
    exit 1
fi

if [ -z "$ORIGIN_URL" ]; then
    echo -e "${RED}❌ ERROR: 'origin' remote not configured!${NC}"
    exit 1
fi

# Check if pushing to origin (personal repo)
if [ "$REMOTE" = "origin" ]; then
    # Only allow netlify branch to origin
    if [ "$BRANCH" != "netlify" ]; then
        echo -e "${RED}❌ ERROR: Pushing to 'origin' (personal repo) is not allowed!${NC}"
        echo -e "${RED}   Branch: $BRANCH${NC}"
        echo -e "${YELLOW}⚠️  Only 'netlify' branch can be pushed to origin (and it's auto-synced by GitHub Actions)${NC}"
        echo -e "${YELLOW}   Use 'upstream' for company work: git push upstream $BRANCH${NC}"
        exit 1
    else
        echo -e "${YELLOW}⚠️  WARNING: Pushing 'netlify' branch to origin${NC}"
        echo -e "${YELLOW}   This branch is usually auto-synced by GitHub Actions.${NC}"
        echo -e "${YELLOW}   Are you sure? (This will proceed in 3 seconds...)${NC}"
        sleep 3
    fi
fi

# Check if pushing feature/dev/master/twitchers to wrong remote
if [ "$REMOTE" != "upstream" ]; then
    case "$BRANCH" in
        feature/*|dev|master|twitchers)
            echo -e "${RED}❌ ERROR: Branch '$BRANCH' must be pushed to 'upstream' (GeoWise repo)!${NC}"
            echo -e "${RED}   You're trying to push to: $REMOTE${NC}"
            echo -e "${YELLOW}   Correct command: git push upstream $BRANCH${NC}"
            exit 1
            ;;
    esac
fi

# Verify upstream remote points to correct repo
if [ "$REMOTE" = "upstream" ]; then
    if [[ ! "$UPSTREAM_URL" =~ "$UPSTREAM_REPO" ]]; then
        echo -e "${RED}❌ ERROR: 'upstream' remote doesn't point to $UPSTREAM_REPO!${NC}"
        echo -e "${RED}   Current URL: $UPSTREAM_URL${NC}"
        exit 1
    fi
fi

# All checks passed
echo -e "${GREEN}✅ Safety checks passed!${NC}"
echo -e "${GREEN}   Remote: $REMOTE${NC}"
echo -e "${GREEN}   Branch: $BRANCH${NC}"
echo ""
echo -e "${YELLOW}Proceeding with push...${NC}"

# Execute the actual push
git push "$REMOTE" "$BRANCH"

echo -e "${GREEN}✅ Push completed successfully!${NC}"
