const axios = require('axios');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

// Monitoring state
let isRunning = false;
let intervalId = null;
let lastChecked = null;
let notificationsSent = 0;
// To prevent duplicate notifications: track last notified price for each trader
const lastNotifiedPrices = {}; // key: traderName, value: last price we notified for this trader

// Gate.io P2P URL for USDT/EGP sell
const GATEIO_P2P_URL = 'https://www.gate.com/ar/p2p/sell/USDT-EGP';

// Initialize Telegram bot (if token is available)
let bot = null;
function initTelegramBot() {
  const { telegramToken } = config.getSettings();
  if (telegramToken && telegramToken.trim() !== '') {
    bot = new TelegramBot(telegramToken, { polling: false });
  } else {
    bot = null;
  }
}

// Send Telegram notification
async function sendTelegramNotification(message) {
  const { telegramToken, telegramChatId } = config.getSettings();
  if (!telegramToken || !telegramChatId || telegramToken.trim() === '' || telegramChatId.trim() === '') {
    console.log('Telegram credentials not set. Skipping notification.');
    return false;
  }
  if (!bot) {
    initTelegramBot();
    if (!bot) {
      console.log('Failed to initialize Telegram bot.');
      return false;
    }
  }
  try {
    await bot.sendMessage(telegramChatId, message);
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error.response ? error.response.body : error.message);
    return false;
  }
}

// Scrape Gate.io P2P page
async function scrapeGateioP2P() {
  try {
    const response = await axios.get(GATEIO_P2P_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    const traders = [];

    // Based on inspecting the Gate.io P2P page, traders are in containers with class "item-list"
    // Each trader item has class "item" or similar. We'll look for common patterns.
    // Note: This selector might need adjustment if the page changes.
    $('.item-list .item, .p2p-trader-item, .trader-item').each((index, element) => {
      const $element = $(element);
      // Extract trader name
      const traderName = $element.find('.user-name, .trader-name, [data-test="user-name"]').text().trim();
      // Extract price
      const priceText = $element.find('.price, .num, [data-test="price"]').text().trim();
      const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
      // Extract payment methods
      const paymentMethods = [];
      $element.find('.payment-method, .pay-method, img[alt]').each((_, payElem) => {
        const alt = $(payElem).attr('alt');
        if (alt) paymentMethods.push(alt.toLowerCase());
        const text = $(payElem).text().trim().toLowerCase();
        if (text) paymentMethods.push(text);
      });
      // Extract max quantity (or limits)
      const limitText = $element.find('.limit, .amount, [data-test="limit"]').text().trim();
      const maxQuantity = parseFloat(limitText.replace(/[^\d.]/g, '')) || 0;
      // Extract ad link (link to the trader's ad)
      const adLink = $element.find('a').attr('href') || '';
      const fullAdLink = adLink.startsWith('http') ? adLink : `https://www.gate.com${adLink}`;

      if (traderName && !isNaN(price)) {
        traders.push({
          traderName,
          price,
          paymentMethods,
          maxQuantity,
          adLink: fullAdLink
        });
      }
    });

    // If the above selector doesn't work, try a fallback
    if (traders.length === 0) {
      // Fallback: look for any divs that might contain trader info
      $('div').each((index, element) => {
        const $element = $(element);
        const text = $element.text();
        if (text.includes('USDT') && text.includes('EGP') && /\d+\.?\d*/.test(text)) {
          // Very basic fallback - not reliable but better than nothing
          // We'll skip this for now and rely on the primary selector
        }
      });
    }

    return traders;
  } catch (error) {
    console.error('Error scraping Gate.io P2P page:', error.response ? error.response.status : error.message);
    throw error;
  }
}

// Main monitoring function
async function monitorPrices() {
  try {
    const settings = config.getSettings();
    const { myTraderName, minQuantity } = settings;

    if (!myTraderName || myTraderName.trim() === '') {
      console.log('My trader name is not set. Skipping this check.');
      return;
    }

    const traders = await scrapeGateioP2P();
    lastChecked = new Date().toISOString();

    // Find our trader
    const ourTrader = traders.find(t =>
      t.traderName.toLowerCase() === myTraderName.toLowerCase()
    );

    if (!ourTrader) {
      console.log(`Our trader "${myTraderName}" not found in the list.`);
      return;
    }

    const ourPrice = ourTrader.price;

    // Check other traders
    for (const trader of traders) {
      // Skip our own trader
      if (trader.traderName.toLowerCase() === myTraderName.toLowerCase()) continue;

      // Check payment method: must include Instapay (case-insensitive)
      const hasInstapay = trader.paymentMethods.some(method =>
        method.includes('instapay') || method.includes('إنستاباي')
      );
      if (!hasInstapay) continue;

      // Check if trader's price is higher than ours
      if (trader.price <= ourPrice) continue;

      // Check if max quantity meets the minimum threshold
      if (trader.maxQuantity < minQuantity) continue;

      // Check for duplicate notification: if we already notified for this trader at this price (or higher)
      const lastNotified = lastNotifiedPrices[trader.traderName];
      if (lastNotified !== undefined && trader.price <= lastNotified) {
        // We've already notified for this trader at a price >= current price
        continue;
      }

      // All conditions met: send notification
      const priceDifference = trader.price - ourPrice;
      const priceDifferencePercent = (priceDifference / ourPrice) * 100;
      const timestamp = new Date().toLocaleString();

      const message = `
🚨 *P2P Price Alert* 🚨

*Competitor Trader:* ${trader.traderName}
*Competitor Price:* ${trader.price} EGP/USDT
*Our Price:* ${ourPrice} EGP/USDT
*Price Difference:* +${priceDifference.toFixed(4)} EGP (${priceDifferencePercent.toFixed(2)}%)
*Max Quantity:* ${trader.maxQuantity} USDT
*Ad Link:* ${trader.adLink}
*Time:* ${timestamp}
      `.trim();

      const sent = await sendTelegramNotification(message);
      if (sent) {
        notificationsSent++;
        lastNotifiedPrices[trader.traderName] = trader.price;
        console.log(`Notification sent for trader ${trader.traderName}`);
      }
    }
  } catch (error) {
    console.error('Error in monitorPrices:', error);
  }
}

// Start monitoring
function start() {
  if (isRunning) {
    console.log('Monitoring is already running.');
    return;
  }

  const settings = config.getSettings();
  const intervalSeconds = settings.pollingInterval || 5;
  const intervalMs = intervalSeconds * 1000;

  console.log(`Starting monitoring with interval ${intervalSeconds} seconds...`);
  initTelegramBot(); // Initialize bot if credentials are available

  // Run immediately on start
  monitorPrices().then(() => {
    // Set up interval
    intervalId = setInterval(monitorPrices, intervalMs);
    isRunning = true;
    lastChecked = new Date().toISOString();
  }).catch(err => {
    console.error('Failed to run initial monitor:', err);
  });
}

// Stop monitoring
function stop() {
  if (!isRunning) {
    console.log('Monitoring is not running.');
    return;
  }

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  console.log('Monitoring stopped.');
}

// Get status
function getStatus() {
  return {
    isRunning,
    lastChecked: lastChecked || null,
    notificationsSent
  };
}

module.exports = {
  start,
  stop,
  getStatus
};