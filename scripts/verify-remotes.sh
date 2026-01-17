#!/bin/bash
# Quick verification script for git remotes
# Run this before any push to ensure remotes are correct

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Verifying git remotes...${NC}"
echo ""

# Check if remotes exist
UPSTREAM_URL=$(git remote get-url upstream 2>/dev/null || echo "")
ORIGIN_URL=$(git remote get-url origin 2>/dev/null || echo "")

# Expected values
EXPECTED_UPSTREAM="GeoWise-AI/company-admin-portal"
EXPECTED_ORIGIN="yoosefashraff/company-admin-portal"

# Check upstream
if [ -z "$UPSTREAM_URL" ]; then
    echo -e "${RED}❌ 'upstream' remote not configured!${NC}"
    echo -e "${YELLOW}   Run: git remote add upstream https://github.com/$EXPECTED_UPSTREAM.git${NC}"
    exit 1
elif [[ "$UPSTREAM_URL" =~ "$EXPECTED_UPSTREAM" ]]; then
    echo -e "${GREEN}✅ upstream: $UPSTREAM_URL${NC}"
    echo -e "${GREEN}   → Use for: feature/*, dev, master, twitchers${NC}"
else
    echo -e "${RED}❌ 'upstream' points to wrong repo!${NC}"
    echo -e "${RED}   Current: $UPSTREAM_URL${NC}"
    echo -e "${YELLOW}   Expected: $EXPECTED_UPSTREAM${NC}"
    exit 1
fi

# Check origin
if [ -z "$ORIGIN_URL" ]; then
    echo -e "${RED}❌ 'origin' remote not configured!${NC}"
    exit 1
elif [[ "$ORIGIN_URL" =~ "$EXPECTED_ORIGIN" ]]; then
    echo -e "${GREEN}✅ origin: $ORIGIN_URL${NC}"
    echo -e "${YELLOW}   → Use for: netlify (auto-synced by GitHub Actions)${NC}"
    echo -e "${YELLOW}   → DO NOT push company work here!${NC}"
else
    echo -e "${YELLOW}⚠️  'origin' points to: $ORIGIN_URL${NC}"
    echo -e "${YELLOW}   Expected: $EXPECTED_ORIGIN${NC}"
fi

echo ""
echo -e "${GREEN}✅ Remotes verified! Safe to push to 'upstream' for company work.${NC}"
