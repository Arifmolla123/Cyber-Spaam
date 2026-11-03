// language: JavaScript (ESM), file: spaam.mjs
import admin from 'firebase-admin';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';

puppeteer.use(StealthPlugin());

// ═══════════════════════════════════════════════════════════════
// ১. গিটহাব সিক্রেট থেকে সার্ভিস অ্যাকাউন্ট লোড করা
// ═══════════════════════════════════════════════════════════════
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const DATABASE_URL = "https://cyber-spaam-default-rtdb.asia-southeast1.firebasedatabase.app";

admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount),
  databaseURL: DATABASE_URL
});
const db = admin.database();

// ═══ ফ্রি প্রক্সি (রেসিডেন্সিয়াল থাকলে আরও ভালো) ═══
async function getFreeProxy() {
  try {
    const res = await axios.get('https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt', { timeout: 5000 });
    const proxies = res.data.split('\n').filter(p => p.trim() !== '');
    return proxies[Math.floor(Math.random() * proxies.length)];
  } catch { return null; }
}

// ═══ হিউম্যান বিহেভিয়ার সিমুলেশন ═══
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min) * 1000;

// ═══ মূল অ্যাটাক ফাংশন ═══
async function runAttack(targetUrl, account, proxy) {
  const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'];
  if (proxy) args.push(`--proxy-server=http://${proxy}`);

  const browser = await puppeteer.launch({ headless: "new", args });
  const page = await browser.newPage();
  
  // ইউজার এজেন্ট র‍্যান্ডম করা (আসল মানুষের মতো)
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
  ];
  await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

  try {
    if (account.cookie) {
      console.log(`[BOT] Using Cookie for attack...`);
      const cookies = account.cookie.split('; ').map(c => {
        const [name, value] = c.split('=');
        return { name, value, domain: '.facebook.com' };
      });
      await page.setCookie(...cookies);
    } else if (account.email && account.password) {
      console.log(`[BOT] Logging in with Email: ${account.email}`);
      await page.goto('https://m.facebook.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('#m_login_email', { timeout: 10000 });
      await sleep(randomDelay(1, 3));
      await page.type('#m_login_email', account.email);
      await sleep(randomDelay(1, 2));
      await page.type('#m_login_password', account.password);
      await sleep(randomDelay(1, 2));
      await page.click('button[name="login"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      if (page.url().includes('checkpoint') || page.url().includes('login')) {
        throw new Error("Login failed / Checkpoint required");
      }
      console.log(`[BOT] Login successful!`);
    } else {
      throw new Error("No valid cookie or credentials found.");
    }

    console.log(`[BOT] Attacking Target: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // ═══ হিউম্যান বিহেভিয়ার: র‍্যান্ডম স্ক্রল করা ═══
    await sleep(randomDelay(2, 4));
    await page.evaluate(() => window.scrollBy(0, 300));
    await sleep(randomDelay(1, 2));

    // মেনু ক্লিক
    await page.waitForSelector('div[aria-label="More"], div[aria-label="Actions for this profile"]', { timeout: 15000 });
    await sleep(randomDelay(1, 3)); // রিপোর্ট করার আগে অপেক্ষা
    await page.click('div[aria-label="More"], div[aria-label="Actions for this profile"]');
    await sleep(randomDelay(1, 2));

    const items = await page.$$('div[role="menuitem"]');
    for (const item of items) {
      const text = await page.evaluate(el => el.innerText, item);
      if (text.includes('Report') || text.includes('রিপোর্ট')) { 
        await item.click(); 
        break; 
      }
    }
    await sleep(randomDelay(1, 2));

    const radios = await page.$$('div[role="radio"]');
    if (radios.length > 2) {
      await sleep(randomDelay(1, 2));
      await radios[2].click();
    }
    
    await page.waitForSelector('div[aria-label="Submit"]');
    await sleep(randomDelay(1, 2));
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

// ═══ মেইন লজিক ═══
async function main() {
  const jobsSnap = await db.ref('jobs').orderByChild('status').equalTo('pending').limitToFirst(10).once('value');
  
  if (!jobsSnap.exists()) { 
    console.log("No pending jobs."); 
    process.exit(0); 
  }

  const jobs = [];
  jobsSnap.forEach(child => {
    jobs.push({ id: child.key, ...child.val() });
  });

  console.log(`Found ${jobs.length} pending jobs. Starting processing...`);

  const accSnap = await db.ref('accounts').once('value');
  const accounts = accSnap.val();
  if (!accounts) { console.log("No accounts in Botnet!"); process.exit(0); }
  const accKeys = Object.keys(accounts);

  for (const job of jobs) {
    console.log(`\n--- Processing Job: ${job.id} for target: ${job.targetUrl} ---`);
    
    await db.ref(`jobs/${job.id}`).update({ status: 'running' });

    const randomAccKey = accKeys[Math.floor(Math.random() * accKeys.length)];
    const randomAcc = accounts[randomAccKey];
    const proxy = await getFreeProxy();

    const success = await runAttack(job.targetUrl, randomAcc, proxy);

    if (success) {
      await db.ref(`jobs/${job.id}`).update({ status: 'completed' });
      console.log(`✅ Job ${job.id} Completed!`);
    } else {
      await db.ref(`jobs/${job.id}`).update({ status: 'failed' });
      await db.ref(`accounts/${randomAccKey}`).remove();
      console.log(`❌ Job ${job.id} Failed.`);
    }

    // ═══ দুই অ্যাটাকের মাঝে ২০-৪০ সেকেন্ড গ্যাপ ═══
    const gap = randomDelay(20, 40);
    console.log(`Waiting for ${gap/1000} seconds to avoid detection...`);
    await sleep(gap); 
  }

  console.log("\n🏁 All pending jobs processed.");
}

main();
