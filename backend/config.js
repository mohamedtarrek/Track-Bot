let settings = {
  myTraderName: process.env.MY_TRADER_NAME || '',
  minQuantity: parseFloat(process.env.MIN_QUANTITY) || 0,
  telegramToken: process.env.TELEGRAM_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  pollingInterval: parseInt(process.env.POLLING_INTERVAL) || 5
};

// Update settings
function updateSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  // Also update process.env for any modules that might read it directly
  process.env.MY_TRADER_NAME = settings.myTraderName;
  process.env.MIN_QUANTITY = settings.minQuantity.toString();
  process.env.TELEGRAM_TOKEN = settings.telegramToken;
  process.env.TELEGRAM_CHAT_ID = settings.telegramChatId;
  process.env.POLLING_INTERVAL = settings.pollingInterval.toString();
}

// Get current settings
function getSettings() {
  return { ...settings };
}

module.exports = {
  updateSettings,
  getSettings
};