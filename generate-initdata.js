// generate-initdata.js
import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // set this in your shell
if (!BOT_TOKEN) {
  console.error('Set TELEGRAM_BOT_TOKEN env first'); process.exit(1);
}

const user = {
  id: 123456789,
  first_name: 'Local',
  last_name: 'Tester',
  username: 'local_tester',
  language_code: 'en',
  is_premium: false
};

const params = new URLSearchParams();
params.set('user', JSON.stringify(user));
params.set('auth_date', Math.floor(Date.now() / 1000).toString());
// Optional:
params.set('chat_instance', 'local_instance');
params.set('chat_type', 'private');

// Create secret key from bot token (per Telegram spec)
const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();

// Sort and sign
const sorted = Array.from(params.entries())
  .sort(([a],[b]) => a.localeCompare(b))
  .map(([k, v]) => `${k}=${v}`)
  .join('\n');

const hash = crypto.createHmac('sha256', secretKey).update(sorted).digest('hex');
params.set('hash', hash);

const initData = params.toString();
const url = `http://localhost:5000/twa?__twaInitData=${encodeURIComponent(initData)}`;
console.log(url);