// language: Java, file: android-src/MainActivity.java
package com.cyberspaam.app; // appId এর সাথে মিল রাখতে হবে (com.cyberspaam.app)

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ক্যাপাসিটরের WebView নেওয়া
        WebView webView = getBridge().getWebView();

        // ১. জাভাস্ক্রিপ্ট এবং কুকি চালু করা
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);

        // ২. থার্ড-পার্টি কুকি অ্যালাও করা (সবচেয়ে জরুরি ধাপ)
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // ৩. ফেসবুকের কুকি রিড করার জন্য জাভাস্ক্রিপ্ট ইন্টারফেস যোগ করা
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public String getFbCookie() {
                CookieManager cm = CookieManager.getInstance();
                
                // ডেস্কটপ সাইট থেকে কুকি খোঁজা
                String cookie = cm.getCookie("https://www.facebook.com");
                if (cookie == null || cookie.isEmpty() || !cookie.contains("c_user")) {
                    // মোবাইল সাইট থেকে কুকি খোঁজা
                    cookie = cm.getCookie("https://m.facebook.com");
                }
                if (cookie == null || cookie.isEmpty() || !cookie.contains("c_user")) {
                    // সাধারণ ডোমেইন থেকে কুকি খোঁজা
                    cookie = cm.getCookie("https://facebook.com");
                }
                
                return (cookie != null) ? cookie : "";
            }
        }, "AndroidCookieManager");
    }
}
