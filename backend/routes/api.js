const express = require('express');
const router = express.Router();
const monitor = require('../monitor');
const { updateSettings, getSettings } = require('../config');

// Get current status
router.get('/status', (req, res) => {
  const status = monitor.getStatus();
  res.json(status);
});

// Update settings
router.post('/update-settings', (req, res) => {
  try {
    const { myTraderName, minQuantity, telegramToken, telegramChatId, pollingInterval } = req.body;
    updateSettings({
      myTraderName,
      minQuantity: parseFloat(minQuantity) || 0,
      telegramToken,
      telegramChatId,
      pollingInterval: parseInt(pollingInterval) || 5
    });
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Start monitoring
router.post('/start', (req, res) => {
  try {
    monitor.start();
    res.json({ success: true, message: 'Monitoring started' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Stop monitoring
router.post('/stop', (req, res) => {
  try {
    monitor.stop();
    res.json({ success: true, message: 'Monitoring stopped' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current settings (for frontend to display)
router.get('/settings', (req, res) => {
  const settings = getSettings();
  res.json(settings);
});

module.exports = router;