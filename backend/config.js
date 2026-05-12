let settings = {
  myTraderName: null,
  minQuantity: null,
  telegramToken: null,
  telegramChatId: null,
  pollingInterval: null
};

// Update settings
function updateSettings(newSettings) {
  settings = { ...settings, ...newSettings };
}

// Get current settings
function getSettings() {
  return { ...settings };
}

module.exports = {
  updateSettings,
  getSettings
};