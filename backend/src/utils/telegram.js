import axios from "axios";
import logger from "./logger.js";
import Setting from "../models/Setting.js";

export const sendTelegramAlert = async (message) => {
  let botToken = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID;
  let isEnabled = true;

  try {
    const settings = await Setting.findOne({ key: "global" }).lean();
    const telegramIntegration = settings?.integrations?.find(
      (item) => item.key.toLowerCase() === "telegram"
    );

    if (telegramIntegration) {
      if (telegramIntegration.enabled === false) {
        isEnabled = false;
      }
      if (telegramIntegration.apiKey) {
        botToken = telegramIntegration.apiKey;
      }
      if (telegramIntegration.apiSecret) {
        chatId = telegramIntegration.apiSecret;
      }
    }
  } catch (dbError) {
    logger.error(`Error reading Telegram settings from DB: ${dbError.message}`);
  }

  if (!isEnabled) {
    logger.info("Telegram integration is disabled in settings. Skipping alert.");
    return false;
  }

  if (!botToken || !chatId) {
    logger.warn("Telegram bot token or chat ID not set. Skipping telegram alert.");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown"
    });
    logger.info("Telegram alert sent successfully.");
    return true;
  } catch (error) {
    logger.error(`Failed to send Telegram alert: ${error.message}`);
    return false;
  }
};
