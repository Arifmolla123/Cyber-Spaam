// language: Java, file: android-src/WorkerService.java
package com.cyberspaam.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class WorkerService extends Service {
    private static final String CHANNEL_ID = "CyberSpaamServiceChannel";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // নোটিফিকেশন তৈরি করা (যাতে অ্যান্ড্রয়েড অ্যাপকে মেরে ফেলতে না পারে)
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Cyber Spaam Engine")
                .setContentText("Botnet is running in background...")
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        // সার্ভিসটাকে ফোরগ্রাউন্ডে চালু করা
        startForeground(1, notification);
        
        // START_STICKY মানে হলো, ফোনের মেমোরি কম হলে বা সিস্টেম কিল করলে অ্যান্ড্রয়েড আবার সার্ভিসটা চালু করবে
        return START_STICKY; 
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Cyber Spaam Background Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}
