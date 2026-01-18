/**
 * Create .env file for server deployment
 * 
 * Usage: node scripts/create-env-file.js
 * 
 * This creates a .env file in the project root with the required
 * environment variables for server deployment.
 */

const fs = require('fs');
const path = require('path');

const envContent = `# Backend API URL (DEV environment)
NEXT_PUBLIC_DEV_API_URL=https://gw5cndev.geowise.ai

# Google Maps API Key (REQUIRED - replace with your actual key)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# Server port (default: 3000)
PORT=3000

# Node environment
NODE_ENV=production
`;

const envPath = path.join(__dirname, '..', '.env.deploy');

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Created .env.deploy file');
  console.log('📝 Location:', envPath);
  console.log('');
  console.log('⚠️  IMPORTANT:');
  console.log('   1. Replace "your_google_maps_key_here" with your actual Google Maps API key');
  console.log('   2. Rename this file to .env when uploading to server');
  console.log('   3. Or copy the content to create .env file');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   - Copy .env.deploy to your frontend-deploy folder');
  console.log('   - Rename it to .env');
  console.log('   - Include it in your ZIP file');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}
