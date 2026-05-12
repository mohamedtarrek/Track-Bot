const express = require('express');
const router = express.Router();
const monitor = require('../monitor');
const config = require('../config');

// GET /api/status
router.get('/status', (req, res) => {
  const status = monitor.getStatus();
  res.json(status);
});

// POST /api/update-settings
router.post('/update-settings', (req, res) => {
  try {
    config.updateSettings(req.body);
    res.json({ success: true, message: 'Successfully updated settings' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/start
router.post('/start', (req, res) => {
  try {
    monitor.start();
    res.json({ success: true, message: 'Monitoring started' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/stop
router.post('/stop', (req, res) => {
  try {
    monitor.stop();
    res.json({ success: true, message: 'Monitoring stopped' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;