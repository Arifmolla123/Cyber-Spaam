// language: Java, file: android-src/MainActivity.java
package com.cyberspaam.app; // appId এর সাথে মিল রাখতে হবে

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ওয়েবভিউ তৈরি হলে সেখানে একটি জাভাস্ক্রিপ্ট ইন্টারফেস যোগ করা
        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public String getFbCookie() {
                // ফেসবুকের কুকি রিড করা
                String cookie = CookieManager.getInstance().getCookie("https://www.facebook.com");
                return cookie != null ? cookie : "";
            }
        }, "AndroidCookieManager");
    }
}
