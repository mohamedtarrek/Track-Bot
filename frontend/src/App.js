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

  // Fetch settings and status on load and periodically
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Update status every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [statusRes] = await Promise.all([
        axios.get('/api/status')
        // We don't need settings for now since we're not implementing the update endpoint
      ]);

      // Update status
      setStatus(statusRes.data);

      // Log debug information to console
      if (statusRes.data.debugInfo) {
        console.log('=== GATE.IO MONITOR DEBUG INFO ===');
        console.log('Timestamp:', new Date().toLocaleString());

        // 1. What data is being scraped from Gate.io (first 5 orders)
        if (statusRes.data.debugInfo.scrapedData.length > 0) {
          console.log('1. Scraped data (first 5 orders):');
          statusRes.data.debugInfo.scrapedData.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.traderName}: ${item.price} EGP, ${item.maxQuantity} USDT, Payments: ${item.paymentMethods.join(', ')}`);
          });
        } else {
          console.log('1. No scraped data available');
        }

        // 2. Whether my trader was found and what their price is
        console.log(`2. Trader "${statusRes.data.debugInfo.ourTraderFound ? 'FOUND' : 'NOT FOUND'}": ${statusRes.data.debugInfo.ourTraderFound ? `Price: ${statusRes.data.debugInfo.ourTraderPrice} EGP` : 'Not found in scraped data'}`);

        // 3. How many competitors use Instapay payment method
        console.log(`3. Competitors with Instapay: ${statusRes.data.debugInfo.instapayCount}`);

        // 4. How many competitors have price higher than my trader
        console.log(`4. Competitors with higher price: ${statusRes.data.debugInfo.higherPriceCount}`);

        // 5. How many competitors meet the minimum quantity requirement
        console.log(`5. Competitors with sufficient quantity: ${statusRes.data.debugInfo.sufficientQuantityCount}`);

        // 6. Why each competitor is or isn't eligible for notification
        if (statusRes.data.debugInfo.competitorAnalysis.length > 0) {
          console.log('6. Competitor analysis:');
          statusRes.data.debugInfo.competitorAnalysis.forEach((analysis, index) => {
            console.log(`   ${index + 1}. ${analysis.traderName}: ${analysis.reason}`);
            console.log(`      Details: ${analysis.details}`);
          });
        } else {
          console.log('6. No competitor analysis available');
        }

        console.log('====================================\n');
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }

  // Note: We're not implementing the setting update/start/stop functions as per the user's request
  // to focus on the debugging feature. In a real implementation, these would be needed.

  return (
    <div className="App">
      <header className="App-header">
        <h1>Track Bot - Gate.io P2P Monitor</h1>
        <p>Check browser console (F12) for debug information</p>
      </header>
      <main className="App-main">
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

        <div className="card">
          <h2>Instructions</h2>
          <p>To see debug information:</p>
          <ol>
            <li>Enter your settings in a real implementation (this demo focuses on debugging)</li>
            <li>Click "Start" to begin monitoring</li>
            <li>Open browser developer tools (F12) and go to the Console tab</li>
            <li>Debug information will appear every 5 seconds</li>
          </ol>
          <p>Each debug block shows:</p>
          <ul>
            <li>Scraped data (first 5 orders)</li>
            <li>Whether your trader was found and their price</li>
            <li>Counts of competitors meeting various criteria</li>
            <li>Detailed analysis of why each competitor is or isn't eligible</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;