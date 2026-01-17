#!/usr/bin/env node

/**
 * Prepare Next.js build for FTP deployment
 * 
 * This script:
 * 1. Builds the Next.js app for production (if not already built)
 * 2. Packages files for FTP upload
 * 3. Creates a deployment package in ./deploy/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT_DIR, '.next');
const DEPLOY_DIR = path.join(ROOT_DIR, 'deploy');

console.log('🚀 Preparing FTP deployment...\n');

// Step 1: Check if build exists
if (!fs.existsSync(BUILD_DIR)) {
  console.log('📦 Build not found. Running build...\n');
  try {
    execSync('npm run build', { 
      stdio: 'inherit',
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    console.log('\n✅ Build completed\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Step 2: Check for standalone build
const standaloneDir = path.join(BUILD_DIR, 'standalone');
if (!fs.existsSync(standaloneDir)) {
  console.error('❌ Standalone build not found!');
  console.error('   Make sure next.config.js has: output: "standalone"');
  process.exit(1);
}

// Step 3: Create deployment directory
if (fs.existsSync(DEPLOY_DIR)) {
  console.log('🧹 Cleaning old deployment directory...');
  fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DEPLOY_DIR, { recursive: true });

// Step 4: Copy standalone build
console.log('📦 Copying standalone build...');
const deployStandalone = path.join(DEPLOY_DIR, '.next', 'standalone');
fs.mkdirSync(deployStandalone, { recursive: true });
copyRecursiveSync(standaloneDir, deployStandalone);

// Step 5: Copy static assets
console.log('📦 Copying static assets...');
const staticDir = path.join(BUILD_DIR, 'static');
if (fs.existsSync(staticDir)) {
  const deployStatic = path.join(DEPLOY_DIR, '.next', 'static');
  copyRecursiveSync(staticDir, deployStatic);
}

// Step 6: Copy public directory
console.log('📦 Copying public directory...');
const publicDir = path.join(ROOT_DIR, 'public');
if (fs.existsSync(publicDir)) {
  const deployPublic = path.join(DEPLOY_DIR, 'public');
  copyRecursiveSync(publicDir, deployPublic);
}

// Step 7: Copy package.json (for reference)
console.log('📦 Copying package.json...');
const packageJson = path.join(ROOT_DIR, 'package.json');
if (fs.existsSync(packageJson)) {
  fs.copyFileSync(packageJson, path.join(DEPLOY_DIR, 'package.json'));
}

// Step 8: Create .env.example (for reference)
console.log('📦 Creating .env.example...');
const envExample = `# Dev API URL (for company server)
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai

# Google Maps API Key (REQUIRED)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# Server port (optional, defaults to 3000)
PORT=3000

# Node environment
NODE_ENV=production
`;
fs.writeFileSync(path.join(DEPLOY_DIR, '.env.example'), envExample);

// Step 9: Create deployment instructions
console.log('📦 Creating deployment instructions...');
const instructions = `# FTP Deployment Instructions

## Files Structure

Upload these files to the server at: /var/www/frontend/

\`\`\`
./
├── .next/
│   ├── standalone/     # Main application
│   └── static/         # Static assets
├── public/             # Public assets
├── package.json        # For reference
└── .env                # Environment variables (create on server)
\`\`\`

## Server Setup

1. Upload all files to server directory: /var/www/frontend/

2. Create .env file on server with:
   - NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai
   - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   - PORT=3000 (optional, default: 3000)
   - NODE_ENV=production

3. Start the application:
   \`\`\`bash
   cd /var/www/frontend
   node .next/standalone/server.js
   \`\`\`

   Or with PM2:
   \`\`\`bash
   pm2 start .next/standalone/server.js --name frontend
   pm2 save
   pm2 startup  # Run once to enable auto-start on reboot
   \`\`\`

4. Configure Nginx/Apache reverse proxy (ask backend team)

## FTP Upload Settings

- **Transfer Mode:** Binary (for all files) ⚠️ CRITICAL!
- **Passive Mode:** false (Active mode)
- **Server:** 8.213.23.175:21
- **Username:** ftpuser
- **Upload Path:** / (FTP root maps to /var/www/frontend/ on server)

## Notes

- Make sure Node.js 18+ is installed on server
- Environment variables must match build-time variables
- Check server logs if app doesn't start
`;
fs.writeFileSync(path.join(DEPLOY_DIR, 'DEPLOYMENT_INSTRUCTIONS.md'), instructions);

console.log('\n✅ Deployment package ready!');
console.log(`\n📁 Location: ${DEPLOY_DIR}`);
console.log('\n📋 Next steps:');
console.log('   1. Review files in ./deploy/ directory');
console.log('   2. Upload to FTP server (use BINARY mode!)');
console.log('   3. Follow DEPLOYMENT_INSTRUCTIONS.md on server');
console.log('\n💡 Tip: Use "npm run deploy-ftp" for automated upload\n');

// Helper function to copy directories recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
