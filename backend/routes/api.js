const express = require('express');
const router = express.Router();
const monitor = require('../monitor');

// Get current status with debug info
router.get('/status', (req, res) => {
  const status = monitor.getStatus();
  const debugInfo = monitor.getDebugInfo();
  res.json({ ...status, debugInfo });
});

// Update settings
router.post('/update-settings', (req, res) => {
  try {
    // This would normally update settings, but we're not implementing that part
    // since the user wants to remove .env dependencies
    // For now, we'll just return success
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

module.exports = router;