import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [settings, setSettings] = useState({
    myTraderName: '',
    minQuantity: '',
    telegramToken: '',
    telegramChatId: '',
    pollingInterval: ''
  });
  const [status, setStatus] = useState({
    isRunning: false,
    lastChecked: null,
    notificationsSent: 0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch status periodically
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get('/api/status');
        setStatus(res.data);
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleUpdate() {
    setLoading(true);
    setMessage('');
    try {
      // Convert empty strings to null for numeric fields
      const updateSettings = {
        ...settings,
        minQuantity: settings.minQuantity === '' ? null : parseFloat(settings.minQuantity),
        pollingInterval: settings.pollingInterval === '' ? null : parseInt(settings.pollingInterval)
      };
      await axios.post('/api/update-settings', updateSettings);
      setMessage('Settings updated successfully!');
      // Fetch updated status
      const res = await axios.get('/api/status');
      setStatus(res.data);
    } catch (err) {
      setMessage('Failed to update settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/start');
      const res = await axios.get('/api/status');
      setStatus(res.data);
      setMessage('Monitoring started!');
    } catch (err) {
      setMessage('Failed to start monitoring: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/stop');
      const res = await axios.get('/api/status');
      setStatus(res.data);
      setMessage('Monitoring stopped!');
    } catch (err) {
      setMessage('Failed to stop monitoring: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Track Bot - Gate.io P2P Monitor</h1>
      </header>
      <main className="App-main">
        <div className="card">
          <h2>Settings</h2>
          <div className="form-group">
            <label>My Trader Name on Gate.io:</label>
            <input
              type="text"
              name="myTraderName"
              value={settings.myTraderName}
              onChange={handleChange}
              placeholder="Enter your trader name"
              className="input"
            />
          </div>
          <div className="form-group">
            <label>Minimum Quantity to Monitor (USDT):</label>
            <input
              type="number"
              name="minQuantity"
              value={settings.minQuantity}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="input"
            />
          </div>
          <div className="form-group">
            <label>Telegram API Token:</label>
            <input
              type="password"
              name="telegramToken"
              value={settings.telegramToken}
              onChange={handleChange}
              placeholder="Get from @BotFather"
              className="input"
            />
          </div>
          <div className="form-group">
            <label>Telegram Chat ID:</label>
            <input
              type="text"
              name="telegramChatId"
              value={settings.telegramChatId}
              onChange={handleChange}
              placeholder="Get from @userinfobot"
              className="input"
            />
          </div>
          <div className="form-group">
            <label>Polling Interval (seconds):</label>
            <input
              type="number"
              name="pollingInterval"
              value={settings.pollingInterval}
              onChange={handleChange}
              min="1"
              className="input"
            />
          </div>
          <button onClick={handleUpdate} disabled={loading} className="button primary">
            {loading ? 'Updating...' : 'Save / Update'}
          </button>
        </div>

        <div className="card">
          <h2>System Status</h2>
          <div className="status-item">
            <span>Status:</span>
            <span className={status.isRunning ? 'status-running' : 'status-stopped'}>
              {status.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="status-item">
            <span>Last Checked:</span>
            <span>{status.lastChecked ? new Date(status.lastChecked).toLocaleString() : 'Never'}</span>
          </div>
          <div className="status-item">
            <span>Notifications Sent:</span>
            <span>{status.notificationsSent}</span>
          </div>
        </div>

        <div className="card actions">
          <button onClick={handleStart} disabled={loading || status.isRunning} className="button success">
            {loading ? 'Starting...' : 'Start Telegram Notifications'}
          </button>
          <button onClick={handleStop} disabled={loading || !status.isRunning} className="button danger">
            {loading ? 'Stopping...' : 'Stop Telegram Notifications'}
          </button>
        </div>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;