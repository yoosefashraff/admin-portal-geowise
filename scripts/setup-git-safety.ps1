# PowerShell script for setting up git safety on Windows
# Run this once after cloning the repository

Write-Host "🔧 Setting up git safety mechanisms..." -ForegroundColor Yellow

# Make scripts executable (Unix-style, for Git Bash)
Write-Host "Setting up safety scripts..." -ForegroundColor Yellow

# Install pre-push hook
if (Test-Path ".git") {
    Write-Host "Installing pre-push hook..." -ForegroundColor Yellow
    
    $hookContent = @'
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
'@

    $hookPath = ".git\hooks\pre-push"
    $hookDir = Split-Path -Parent $hookPath
    
    if (-not (Test-Path $hookDir)) {
        New-Item -ItemType Directory -Force -Path $hookDir | Out-Null
    }
    
    $hookContent | Out-File -FilePath $hookPath -Encoding UTF8 -NoNewline
    Write-Host "✅ Pre-push hook installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Not a git repository, skipping hook installation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Git safety setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now:" -ForegroundColor Yellow
Write-Host "  • Run 'npm run verify-remotes' to check remotes"
Write-Host "  • Use 'npm run push-safe upstream <branch>' for safe pushes"
Write-Host "  • The pre-push hook will automatically block wrong pushes"
Write-Host ""
