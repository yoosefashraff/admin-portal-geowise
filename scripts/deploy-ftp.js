#!/usr/bin/env node

/**
 * Automated FTP Deployment Script
 * 
 * This script:
 * 1. Prepares files for upload (if needed)
 * 2. Uploads to FTP server automatically
 * 
 * FTP Configuration:
 * - Server: 8.213.23.175:21
 * - Username: ftpuser
 * - Password: 012022037055116080071
 * - Passive Mode: false (Active mode)
 * - Upload Path: / (FTP root maps to /var/www/frontend/ on server)
 * 
 * Note: If automated upload fails, use manual upload via SpeedCommander/FileZilla
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('basic-ftp');

// FTP Configuration
const FTP_CONFIG = {
  host: '8.213.23.175',
  port: 21,
  user: 'ftpuser',
  password: '012022037055116080071',
  secure: false, // Plain FTP
  passive: false, // Active mode (as specified by backend team)
  // Additional connection options
  keepalive: 10000, // Keep connection alive
  timeout: 30000, // 30 second timeout
};

const DEPLOY_DIR = path.join(__dirname, '..', 'deploy');
const REMOTE_DIR = '/'; // FTP root maps to /var/www/frontend/ on server

async function deploy() {
  console.log('🚀 Starting FTP deployment...\n');

  // Step 1: Check if deploy directory exists
  if (!fs.existsSync(DEPLOY_DIR)) {
    console.log('📦 Deploy directory not found. Preparing files...\n');
    try {
      const { execSync } = require('child_process');
      execSync('node scripts/prepare-ftp-deploy.js', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('\n✅ Files prepared\n');
    } catch (error) {
      console.error('❌ Failed to prepare files:', error.message);
      process.exit(1);
    }
  }

  // Step 2: Connect to FTP
  const client = new Client();
  client.ftp.verbose = true; // Enable verbose logging

  try {
    console.log('📡 Connecting to FTP server...');
    console.log(`   Host: ${FTP_CONFIG.host}:${FTP_CONFIG.port}`);
    console.log(`   User: ${FTP_CONFIG.user}`);
    console.log(`   Passive: ${FTP_CONFIG.passive}`);
    console.log(`   Password: ${FTP_CONFIG.password ? '***' + FTP_CONFIG.password.slice(-4) : 'NOT SET'}\n`);

    // Try to connect with better error handling
    try {
      await client.access(FTP_CONFIG);
    } catch (loginError) {
      console.error('\n❌ FTP Login failed!');
      console.error('   Error:', loginError.message);
      console.error('\n💡 Solution: Use manual upload instead');
      console.error('   1. Open SpeedCommander or FileZilla');
      console.error('   2. Connect to: 8.213.23.175:21');
      console.error('   3. Username: ftpuser');
      console.error('   4. Password: 012022037055116080071');
      console.error('   5. Set transfer mode to BINARY');
      console.error('   6. Upload everything from ./deploy/ folder\n');
      console.error('   Files are ready in: ./deploy/\n');
      process.exit(1);
    }

    console.log('✅ Connected to FTP server\n');

    // Step 3: Navigate to remote directory
    console.log(`📁 Navigating to remote directory: ${REMOTE_DIR}`);
    await client.ensureDir(REMOTE_DIR);
    console.log('✅ Remote directory ready\n');

    // Step 4: Upload files
    console.log('📤 Uploading files...\n');
    await uploadDirectory(client, DEPLOY_DIR, REMOTE_DIR);

    console.log('\n✅ Deployment completed successfully!');
    console.log('\n📋 Next steps on server:');
    console.log('   1. SSH into server (if you have access)');
    console.log('   2. Navigate to: cd /var/www/frontend');
    console.log('   3. Create .env file with environment variables');
    console.log('   4. Start the application:');
    console.log('      node .next/standalone/server.js');
    console.log('   5. Or with PM2:');
    console.log('      pm2 start .next/standalone/server.js --name frontend');
    console.log('      pm2 save');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    client.close();
  }
}

async function uploadDirectory(client, localDir, remoteDir) {
  const items = fs.readdirSync(localDir);

  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remotePath = path.posix.join(remoteDir, item);
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      console.log(`📁 Creating directory: ${remotePath}`);
      await client.ensureDir(remotePath);
      await uploadDirectory(client, localPath, remotePath);
    } else {
      console.log(`📄 Uploading: ${remotePath}`);
      // Use binary transfer mode for all files
      await client.uploadFrom(localPath, remotePath);
    }
  }
}

// Run deployment
deploy().catch(console.error);
