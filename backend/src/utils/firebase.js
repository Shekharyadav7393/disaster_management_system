import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import logger from "./logger.js";

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

let isFirebaseInitialized = false;

if (serviceAccountBase64) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
    );
    
    initializeApp({
      credential: cert(serviceAccount),
    });
    isFirebaseInitialized = true;
    logger.info("Firebase Admin initialized successfully.");
  } catch (error) {
    logger.error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
} else {
  logger.warn("Firebase credentials not found. Push notifications will be disabled.");
}

export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!isFirebaseInitialized) return false;
  
  try {
    const message = {
      notification: { title, body },
      data,
      token: fcmToken,
    };
    const response = await getMessaging().send(message);
    logger.info(`Successfully sent Firebase push notification: ${response}`);
    return true;
  } catch (error) {
    logger.error(`Error sending push notification: ${error.message}`);
    return false;
  }
};

export const sendMulticastPushNotification = async (fcmTokens, title, body, data = {}) => {
  if (!isFirebaseInitialized || !fcmTokens || fcmTokens.length === 0) return false;
  
  try {
    const message = {
      notification: { title, body },
      data,
      tokens: fcmTokens,
    };
    const response = await getMessaging().sendEachForMulticast(message);
    logger.info(`Firebase multicast sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);
    return true;
  } catch (error) {
    logger.error(`Error sending multicast push notification: ${error.message}`);
    return false;
  }
};
