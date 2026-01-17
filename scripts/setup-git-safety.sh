#!/bin/bash
# Setup script for git safety hooks and scripts
# Run this once after cloning the repository

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Setting up git safety mechanisms...${NC}"

# Make scripts executable
echo -e "${YELLOW}Making safety scripts executable...${NC}"
chmod +x scripts/git-push-safety.sh
chmod +x scripts/verify-remotes.sh
chmod +x scripts/setup-git-safety.sh

# Install pre-push hook
if [ -d ".git" ]; then
    echo -e "${YELLOW}Installing pre-push hook...${NC}"
    
    # Copy hook template to .git/hooks
    if [ -f "scripts/pre-push-hook-template.sh" ]; then
        cp scripts/pre-push-hook-template.sh .git/hooks/pre-push
        chmod +x .git/hooks/pre-push
        echo -e "${GREEN}✅ Pre-push hook installed${NC}"
    else
        # If template doesn't exist, create hook directly
        cat > .git/hooks/pre-push << 'HOOK_EOF'
#!/bin/bash
# Git Pre-Push Hook - Repository Safety Check
# This hook prevents pushing to the wrong repository

UPSTREAM_REPO="GeoWise-AI/company-admin-portal"
ORIGIN_REPO="yoosefashraff/company-admin-portal"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REMOTE="$1"
REMOTE_URL="$2"

while read local_ref local_sha remote_ref remote_sha; do
    BRANCH=$(echo "$remote_ref" | sed 's|refs/heads/||')
    [ -z "$BRANCH" ] && continue
    
    if [ "$REMOTE" = "origin" ]; then
        if [ "$BRANCH" != "netlify" ]; then
            echo -e "${RED}❌ BLOCKED: Cannot push '$BRANCH' to 'origin' (personal repo)!${NC}"
            echo -e "${YELLOW}   Use 'upstream' for company work: git push upstream $BRANCH${NC}"
            exit 1
        fi
    fi
    
    if [ "$REMOTE" != "upstream" ]; then
        case "$BRANCH" in
            feature/*|dev|master|twitchers)
                echo -e "${RED}❌ BLOCKED: Branch '$BRANCH' must be pushed to 'upstream'!${NC}"
                echo -e "${YELLOW}   Correct command: git push upstream $BRANCH${NC}"
                exit 1
                ;;
        esac
    fi
done

echo -e "${GREEN}✅ Pre-push safety checks passed${NC}"
exit 0
HOOK_EOF
        chmod +x .git/hooks/pre-push
        echo -e "${GREEN}✅ Pre-push hook created${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Not a git repository, skipping hook installation${NC}"
fi

echo ""
echo -e "${GREEN}✅ Git safety setup complete!${NC}"
echo ""
echo -e "${YELLOW}You can now:${NC}"
echo -e "  • Run 'npm run verify-remotes' to check remotes"
echo -e "  • Use 'npm run push-safe upstream <branch>' for safe pushes"
echo -e "  • The pre-push hook will automatically block wrong pushes"
echo ""
