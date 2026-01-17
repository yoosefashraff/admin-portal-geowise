#!/usr/bin/env node

/**
 * Automated FTP Deployment Script
 * 
 * This script:
 * 1. Prepares files for upload (if needed)
 * 2. Uploads to FTP server automatically using Active mode
 * 
 * FTP Configuration (from .env file):
 * - Server: FTP_HOST (default: 8.213.23.175)
 * - Port: FTP_PORT (default: 21)
 * - Username: FTP_USER (default: ftpuser)
 * - Password: FTP_PASSWORD (REQUIRED - set in .env file)
 * - Passive Mode: false (Active mode - required by server)
 * - Upload Path: / (FTP root maps to /var/www/frontend/ on server)
 * 
 * SECURITY: Password is stored in .env file (not committed to git)
 */

const fs = require('fs');
const path = require('path');
const FTP = require('ftp');

// Load environment variables from .env file
require('dotenv').config();

// FTP Configuration - Password from environment variable for security
const FTP_CONFIG = {
  host: process.env.FTP_HOST || '8.213.23.175',
  port: parseInt(process.env.FTP_PORT || '21', 10),
  user: process.env.FTP_USER || 'ftpuser',
  password: process.env.FTP_PASSWORD, // REQUIRED - Set in .env file
  // Force Active mode (not passive)
  // The 'ftp' library uses Active mode by default, but we explicitly disable passive
};

// Validate password is set before proceeding
if (!FTP_CONFIG.password) {
  console.error('❌ FTP_PASSWORD not set in .env file!');
  console.error('\n💡 Add to your .env file:');
  console.error('   FTP_PASSWORD=your_password_here');
  console.error('\n   Get the password from the backend team.');
  console.error('   See .env.example for all required variables.\n');
  process.exit(1);
}

const DEPLOY_DIR = path.join(__dirname, '..', 'deploy');
const REMOTE_DIR = '/'; // FTP root maps to /var/www/frontend/ on server

// Helper function to promisify FTP operations
function promisifyFTP(client) {
  return {
    connect: () => new Promise((resolve, reject) => {
      client.once('ready', resolve);
      client.once('error', reject);
      client.connect(FTP_CONFIG);
    }),
    end: () => new Promise((resolve) => {
      client.end();
      resolve();
    }),
    mkdir: (dir, recursive) => new Promise((resolve, reject) => {
      client.mkdir(dir, recursive, (err) => {
        if (err && err.code !== 550) reject(err); // 550 = directory exists
        else resolve();
      });
    }),
    put: (localPath, remotePath) => new Promise((resolve, reject) => {
      client.put(localPath, remotePath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    }),
    cwd: (dir) => new Promise((resolve, reject) => {
      client.cwd(dir, (err) => {
        if (err) reject(err);
        else resolve();
      });
    }),
  };
}

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
  const client = new FTP();
  const ftp = promisifyFTP(client);

  // Handle connection errors
  client.on('error', (err) => {
    if (err.code !== 'ECONNRESET') {
      console.error('   ⚠️  FTP Error:', err.message);
    }
  });

  try {
    console.log('📡 Connecting to FTP server...');
    console.log(`   Host: ${FTP_CONFIG.host}:${FTP_CONFIG.port}`);
    console.log(`   User: ${FTP_CONFIG.user}`);
    console.log(`   Mode: Active (PORT)`);
    console.log(`   Password: ${FTP_CONFIG.password ? '***' + FTP_CONFIG.password.slice(-4) : 'NOT SET'}\n`);

    // Connect to FTP server
    await ftp.connect();
    console.log('   ✅ Connected successfully\n');

    // Navigate to remote directory
    console.log(`📁 Navigating to remote directory: ${REMOTE_DIR}`);
    await ftp.cwd(REMOTE_DIR);
    console.log('✅ Remote directory ready\n');

    // Upload files
    console.log('📤 Uploading files...\n');
    let uploadedCount = 0;
    let failedCount = 0;
    
    await uploadDirectory(ftp, client, DEPLOY_DIR, REMOTE_DIR, uploadedCount, failedCount);

    console.log('\n✅ Deployment completed successfully!');
    console.log(`   Uploaded: ${uploadedCount} files`);
    if (failedCount > 0) {
      console.log(`   Failed: ${failedCount} files`);
    }
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
    process.exit(1);
  } finally {
    await ftp.end();
  }
}

async function uploadDirectory(ftp, client, localDir, remoteDir, uploadedCount, failedCount, retryCount = 0) {
  const items = fs.readdirSync(localDir);
  const maxRetries = 3;

  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remotePath = path.posix.join(remoteDir, item);
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      console.log(`📁 Creating directory: ${remotePath}`);
      try {
        // Create directory (recursive)
        await ftp.mkdir(remotePath, true);
        await uploadDirectory(ftp, client, localPath, remotePath, uploadedCount, failedCount, 0);
      } catch (dirError) {
        if (retryCount < maxRetries && (dirError.code === 550 || dirError.message.includes('exists'))) {
          // Directory might already exist, continue
          await uploadDirectory(ftp, client, localPath, remotePath, uploadedCount, failedCount, 0);
        } else if (retryCount < maxRetries) {
          console.log(`   ⚠️  Retrying directory creation...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          await uploadDirectory(ftp, client, localPath, remotePath, uploadedCount, failedCount, retryCount + 1);
        } else {
          console.error(`   ❌ Failed to create directory: ${remotePath}`);
          failedCount++;
        }
      }
    } else {
      const fileName = path.basename(remotePath);
      const fileSize = stat.size;
      const sizeKB = (fileSize / 1024).toFixed(1);
      
      // Show progress for larger files or every 100 files
      if (fileSize > 50000 || uploadedCount % 100 === 0) {
        console.log(`📄 Uploading: ${fileName} (${sizeKB} KB)`);
      }
      
      let uploaded = false;
      let attempts = 0;
      
      while (!uploaded && attempts < maxRetries) {
        try {
          await ftp.put(localPath, remotePath);
          uploaded = true;
          uploadedCount++;
        } catch (uploadError) {
          attempts++;
          const errorMsg = uploadError.message || '';
          
          if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ECONNRESET')) {
            if (attempts < maxRetries) {
              console.log(`   ⚠️  Retry ${attempts}/${maxRetries}: ${fileName}`);
              await new Promise(resolve => setTimeout(resolve, 2000 * attempts)); // Exponential backoff
              
              // Reconnect if connection was lost
              try {
                if (!client.connected) {
                  await ftp.connect();
                  await ftp.cwd(REMOTE_DIR);
                }
              } catch (reconnectError) {
                // Ignore reconnect errors, will retry
              }
            } else {
              console.error(`   ❌ Failed after ${maxRetries} attempts: ${fileName}`);
              failedCount++;
              uploaded = true; // Move to next file
            }
          } else {
            console.error(`   ❌ Upload error: ${fileName} - ${errorMsg}`);
            failedCount++;
            uploaded = true; // Move to next file
          }
        }
      }
    }
  }
}

// Run deployment
deploy().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
