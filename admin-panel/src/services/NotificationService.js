// Firebase Cloud Messaging Service
// Uses FCM REST API to send push notifications to users

import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Send push notification via FCM REST API
 * @param {string} userId - User ID to fetch FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export const sendPushNotification = async (userId, title, body) => {
  try {
    // 1. Get User Token
    const userDoc = await getDoc(doc(db, 'users', userId));
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      console.warn("User has no FCM Token");
      return;
    }

    // 2. YOUR LEGACY SERVER KEY (Start with AIza...)
    const SERVER_KEY = "AIzaSyA3umsznH48g4fujI8ifOdIw1VvkSkZrwY"; 

    // 3. 🔥 CRITICAL CHANGE: Use this URL, NOT the V1 URL
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${SERVER_KEY}` // Note: key= prefix is required
      },
      body: JSON.stringify({
        "to": fcmToken,
        "notification": {
          "title": title,
          "body": body,
          "sound": "default", // ✅ Tells iOS to play sound
          "android_channel_id": "evora_high_importance" // ✅ MUST MATCH YOUR FLUTTER CODE
        },
        "android": {
          "priority": "high", // ✅ Wakes up device
          "notification": {
            "sound": "default",
            "channel_id": "evora_high_importance"
          }
        },
        "data": {
          "click_action": "FLUTTER_NOTIFICATION_CLICK",
          "type": "general"
        },
        "priority": "high" // ✅ Legacy API priority
      })
    });

    if (response.status === 200) {
      console.log("✅ Notification sent successfully via Legacy API");
    } else {
      console.error(`❌ FCM Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Response:", errorText);
    }

  } catch (error) {
    console.error("❌ Network Error:", error);
  }
};
