#!/usr/bin/env node

const https = require('https');

// Configuration - update these values
const BOT_TOKEN = '7599843447:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // Replace with your actual bot token
const WEBAPP_URL = 'https://app.showpls.io/twa';

console.log('🚀 Setting up Telegram Web App...');
console.log(`📱 Web App URL: ${WEBAPP_URL}`);

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function setupWebApp() {
  console.log('\n🔧 Setting up Web App...');
  
  try {
    const response = await makeRequest(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: 'Open Showpls',
          web_app: {
            url: WEBAPP_URL
          }
        }
      })
    });
    
    console.log('Response:', response);
    
    if (response.status === 200 && response.data.ok) {
      console.log('✅ Web App set up successfully');
      return true;
    } else {
      console.error('❌ Failed to set up Web App:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error setting up Web App:', error.message);
    return false;
  }
}

async function getBotInfo() {
  console.log('\n📋 Getting bot info...');
  
  try {
    const response = await makeRequest(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    
    if (response.status === 200 && response.data.ok) {
      console.log('✅ Bot info retrieved successfully');
      console.log(`   Name: ${response.data.result.first_name}`);
      console.log(`   Username: @${response.data.result.username}`);
      return response.data.result;
    } else {
      console.error('❌ Failed to get bot info:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting bot info:', error.message);
    return null;
  }
}

async function main() {
  // Step 1: Get bot info
  const botInfo = await getBotInfo();
  if (!botInfo) {
    console.error('\n❌ Setup failed: Could not get bot info');
    process.exit(1);
  }
  
  // Step 2: Set up Web App
  const webAppSetup = await setupWebApp();
  if (!webAppSetup) {
    console.error('\n❌ Setup failed: Could not set up Web App');
    process.exit(1);
  }
  
  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Open your bot in Telegram');
  console.log('   2. Click the "Open Showpls" button in the menu');
  console.log('   3. Test the authentication flow');
}

main().catch(console.error);
