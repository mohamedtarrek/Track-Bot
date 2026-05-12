const axios = require('axios');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

// Monitoring state
let isRunning = false;
let intervalId = null;
let debugIntervalId = null;
let lastChecked = null;
let notificationsSent = 0;
// To prevent duplicate notifications: track last notified price for each trader
const lastNotifiedPrices = {}; // key: traderName, value: last price we notified for this trader

// Debug information from last monitoring run
let debugInfo = {
  ourTraderName: null,
  scrapedData: [], // Array of {traderName, price, paymentMethods, maxQuantity}
  ourTraderFound: false,
  ourTraderPrice: null,
  instapayCount: 0,
  higherPriceCount: 0,
  sufficientQuantityCount: 0,
  competitorAnalysis: [] // Array of analysis for each competitor
};
let lastMonitoringData = null; // Stores the debugInfo from the last completed monitoring run

// Gate.io P2P URL for USDT/EGP sell
const GATEIO_P2P_URL = 'https://www.gate.com/ar/p2p/sell/USDT-EGP';

// Initialize Telegram bot (if token is available)
let bot = null;
function initTelegramBot() {
  const { telegramToken } = config.getSettings();
  if (telegramToken && telegramToken !== null && telegramToken.trim() !== '') {
    bot = new TelegramBot(telegramToken, { polling: false });
    console.log('[DEBUG] Telegram bot initialized');
  } else {
    bot = null;
    console.log('[DEBUG] Telegram token not set, bot not initialized');
  }
}

// Send Telegram notification (for alerts)
async function sendTelegramNotification(message) {
  const { telegramToken, telegramChatId } = config.getSettings();
  console.log(`[DEBUG] sendTelegramNotification called. Token exists: !!${!!telegramToken && telegramToken !== null}, Chat ID exists: !!${!!telegramChatId && telegramChatId !== null}`);
  if (!telegramToken || telegramToken === null || telegramToken.trim() === '' ||
      !telegramChatId || telegramChatId === null || telegramChatId.trim() === '') {
    console.log('[DEBUG] Telegram credentials not set. Skipping notification.');
    return false;
  }
  if (!bot) {
    console.log('[DEBUG] Initializing Telegram bot...');
    initTelegramBot();
    if (!bot) {
      console.log('[DEBUG] Failed to initialize Telegram bot.');
      return false;
    }
  }
  try {
    console.log(`[DEBUG] Sending Telegram message to chat ID: ${telegramChatId}`);
    const result = await bot.sendMessage(telegramChatId, message);
    console.log('[DEBUG] Telegram message sent successfully:', result.message_id);
    return true;
  } catch (error) {
    console.error('[DEBUG] Error sending Telegram message:', error.response ? error.response.body : error.message);
    return false;
  }
}

// Generate debug report string from monitoring data
function generateDebugReport(data) {
  const timestamp = new Date().toLocaleString();
  let report = `🐛 *DEBUG REPORT* 🐛\n*Time:* ${timestamp}\n\n`;

  // 1. Scraped data (first 5 orders)
  report += `1. *Scraped data (first 5 orders):*\n`;
  if (data.scrapedData.length > 0) {
    data.scrapedData.forEach((item, index) => {
      report += `   ${index + 1}. ${item.traderName}: ${item.price} EGP, ${item.maxQuantity} USDT, Payments: ${item.paymentMethods.join(', ')}\n`;
    });
  } else {
    report += `   No scraped data available\n`;
  }
  report += '\n';

  // 2. Whether my trader was found and what their price is
  report += `2. *Trader "${data.ourTraderName || 'N/A'}":* ${data.ourTraderFound ? `FOUND - Price: ${data.ourTraderPrice} EGP` : 'NOT FOUND in scraped data'}\n\n`;

  // 3. Count of competitors with Instapay
  report += `3. *Competitors with Instapay:* ${data.instapayCount}\n\n`;

  // 4. Count of competitors with higher price
  report += `4. *Competitors with higher price:* ${data.higherPriceCount}\n\n`;

  // 5. Count of competitors with sufficient quantity
  report += `5. *Competitors with sufficient quantity:* ${data.sufficientQuantityCount}\n\n`;

  // 6. Detailed competitor analysis
  report += `6. *Competitor analysis:*\n`;
  if (data.competitorAnalysis.length > 0) {
    data.competitorAnalysis.forEach((analysis, index) => {
      report += `   ${index + 1}. ${analysis.traderName}: ${analysis.reason}\n`;
      report += `      Details: ${analysis.details}\n`;
    });
  } else {
    report += `   No competitor analysis available\n`;
  }

  return report;
}

// Send debug report via Telegram
async function sendDebugReport() {
  if (!lastMonitoringData) {
    console.log('[DEBUG] No monitoring data available for debug report.');
    return;
  }

  const { telegramToken, telegramChatId } = config.getSettings();
  if (!telegramToken || telegramToken === null || telegramToken.trim() === '' ||
      !telegramChatId || telegramChatId === null || telegramChatId.trim() === '') {
    console.log('[DEBUG] Telegram credentials not set. Skipping debug report.');
    return;
  }
  if (!bot) {
    console.log('[DEBUG] Initializing Telegram bot for debug report...');
    initTelegramBot();
    if (!bot) {
      console.log('[DEBUG] Failed to initialize Telegram bot for debug report.');
      return;
    }
  }

  const report = generateDebugReport(lastMonitoringData);
  try {
    await bot.sendMessage(telegramChatId, report);
    console.log('[DEBUG] Debug report sent via Telegram');
  } catch (error) {
    console.error('[DEBUG] Error sending debug report:', error.response ? error.response.body : error.message);
  }
}

// Get debug information (for potential future use)
function getDebugInfo() {
  return { ...debugInfo }; // Return a copy
}

// Reset debug information for new monitoring run
function resetDebugInfo() {
  debugInfo = {
    ourTraderName: null,
    scrapedData: [],
    ourTraderFound: false,
    ourTraderPrice: null,
    instapayCount: 0,
    higherPriceCount: 0,
    sufficientQuantityCount: 0,
    competitorAnalysis: []
  };
}

// Scrape Gate.io P2P page
async function scrapeGateioP2P() {
  try {
    console.log('[DEBUG] Scraping Gate.io P2P page:', GATEIO_P2P_URL);
    const response = await axios.get(GATEIO_P2P_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log('[DEBUG] Gate.io P2P page scraped successfully, status:', response.status);
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

    // Store scraped data for debugging (first 5 traders)
    debugInfo.scrapedData = traders.slice(0, 5).map(t => ({
      traderName: t.traderName,
      price: t.price,
      paymentMethods: t.paymentMethods,
      maxQuantity: t.maxQuantity
    }));

    console.log(`[DEBUG] Scraped ${traders.length} traders from Gate.io P2P page`);
    if (traders.length === 0) {
      console.log('[DEBUG] WARNING: No traders found. Check HTML selectors.');
      // Log a snippet of the HTML for debugging
      console.log('[DEBUG] HTML snippet:', $.html().substring(0, 500));
    }

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
    console.error('[DEBUG] Error scraping Gate.io P2P page:', error.response ? error.response.status : error.message);
    throw error;
  }
}

// Main monitoring function
async function monitorPrices() {
  console.log('[DEBUG] monitorPrices function called');
  try {
    // Reset debug info for this run
    resetDebugInfo();
    // Store the trader name we are looking for (from settings)
    const settings = config.getSettings();
    debugInfo.ourTraderName = settings.myTraderName;

    const { myTraderName, minQuantity, telegramToken, telegramChatId, pollingInterval } = settings;
    console.log(`[DEBUG] Settings: myTraderName="${myTraderName}", minQuantity=${minQuantity}, telegramToken set: !!${!!telegramToken && telegramToken !== null}, telegramChatId set: !!${!!telegramChatId && telegramChatId !== null}, pollingInterval=${pollingInterval}`);

    // Validate required settings
    if (!myTraderName || myTraderName === null || myTraderName.trim() === '') {
      console.log('[DEBUG] My trader name is not set. Skipping this check.');
      return;
    }
    if (!telegramToken || telegramToken === null || telegramToken.trim() === '') {
      console.log('[DEBUG] Telegram token is not set. Skipping this check.');
      return;
    }
    if (!telegramChatId || telegramChatId === null || telegramChatId.trim() === '') {
      console.log('[DEBUG] Telegram chat ID is not set. Skipping this check.');
      return;
    }
    if (minQuantity === null) {
      console.log('[DEBUG] Min quantity is not set. Skipping this check.');
      return;
    }
    if (pollingInterval === null) {
      console.log('[DEBUG] Polling interval is not set. Skipping this check.');
      return;
    }

    const traders = await scrapeGateioP2P();
    lastChecked = new Date().toISOString();
    console.log(`[DEBUG] Last checked updated to: ${lastChecked}`);

    // Find our trader
    const ourTrader = traders.find(t =>
      t.traderName.toLowerCase() === myTraderName.toLowerCase()
    );

    if (!ourTrader) {
      console.log(`[DEBUG] Our trader "${myTraderName}" not found in the list of ${traders.length} traders.`);
      // Log all trader names for debugging
      const traderNames = traders.map(t => t.traderName);
      console.log('[DEBUG] Available trader names:', traderNames);
      debugInfo.ourTraderFound = false;
      // Save debug info for the report
      lastMonitoringData = { ...debugInfo };
      return;
    }

    debugInfo.ourTraderFound = true;
    debugInfo.ourTraderPrice = ourTrader.price;
    console.log(`[DEBUG] Found our trader: ${ourTrader.traderName} with price ${ourPrice}`);

    // Check other traders
    let eligibleCompetitors = 0;
    for (const trader of traders) {
      // Skip our own trader
      if (trader.traderName.toLowerCase() === myTraderName.toLowerCase()) {
        console.log(`[DEBUG] Skipping own trader: ${trader.traderName}`);
        debugInfo.competitorAnalysis.push({
          traderName: trader.traderName,
          reason: 'Own trader',
          details: 'Skipped self'
        });
        continue;
      }

      // Check payment method: must include Instapay (case-insensitive)
      const hasInstapay = trader.paymentMethods.some(method =>
        method.includes('instapay') || method.includes('إنستاباي')
      );
      if (!hasInstapay) {
        console.log(`[DEBUG] Skipping trader ${trader.traderName}: no Instapay payment method. Methods: ${trader.paymentMethods.join(', ')}`);
        debugInfo.competitorAnalysis.push({
          traderName: trader.traderName,
          reason: 'No Instapay payment method',
          details: `Methods: ${trader.paymentMethods.join(', ')}`
        });
        continue;
      }
      debugInfo.instapayCount++;

      // Check if trader's price is higher than ours
      if (trader.price <= ourTrader.price) {
        console.log(`[DEBUG] Skipping trader ${trader.traderName}: price ${trader.price} <= our price ${ourTrader.price}`);
        debugInfo.competitorAnalysis.push({
          traderName: trader.traderName,
          reason: 'Price not higher than ours',
          details: `Their price: ${trader.price}, Our price: ${ourTrader.price}`
        });
        continue;
      }
      debugInfo.higherPriceCount++;

      // Check if max quantity meets the minimum threshold
      if (trader.maxQuantity < minQuantity) {
        console.log(`[DEBUG] Skipping trader ${trader.traderName}: quantity ${trader.maxQuantity} < min quantity ${minQuantity}`);
        debugInfo.competitorAnalysis.push({
          traderName: trader.traderName,
          reason: 'Insufficient quantity',
          details: `Their quantity: ${trader.maxQuantity}, Minimum: ${minQuantity}`
        });
        continue;
      }
      debugInfo.sufficientQuantityCount++;

      // Check for duplicate notification: if we already notified for this trader at this price (or higher)
      const lastNotified = lastNotifiedPrices[trader.traderName];
      if (lastNotified !== undefined && trader.price <= lastNotified) {
        console.log(`[DEBUG] Skipping trader ${trader.traderName}: already notified for price >= ${lastNotified}, current price ${trader.price}`);
        debugInfo.competitorAnalysis.push({
          traderName: trader.traderName,
          reason: 'Already notified for this price or higher',
          details: `Last notified price: ${lastNotified}, Current price: ${trader.price}`
        });
        continue;
      }

      // All conditions met: send notification
      eligibleCompetitors++;
      console.log(`[DEBUG] Found eligible competitor #${eligibleCompetitors}: ${trader.traderName}`);

      const priceDifference = trader.price - ourTrader.price;
      const priceDifferencePercent = (priceDifference / ourTrader.price) * 100;
      const timestamp = new Date().toLocaleString();

      const message = `
🚨 *P2P Price Alert* 🚨

*Competitor Trader:* ${trader.traderName}
*Competitor Price:* ${trader.price} EGP/USDT
*Our Price:* ${ourTrader.price} EGP/USDT
*Price Difference:* +${priceDifference.toFixed(4)} EGP (${priceDifferencePercent.toFixed(2)}%)
*Max Quantity:* ${trader.maxQuantity} USDT
*Ad Link:* ${trader.adLink}
*Time:* ${timestamp}
      `.trim();

      const sent = await sendTelegramNotification(message);
      if (sent) {
        notificationsSent++;
        lastNotifiedPrices[trader.traderName] = trader.price;
        console.log(`[DEBUG] Notification sent for trader ${trader.traderName}. Total notifications: ${notificationsSent}`);
        debugInfo.competitorAnalysis.push({
          traderName: trader.traderName,
          reason: 'ELIGIBLE - Notification sent',
          details: `Price difference: +${priceDifference.toFixed(4)} EGP (${priceDifferencePercent.toFixed(2)}%)`
        });
      } else {
        console.log(`[DEBUG] Failed to send notification for trader ${trader.traderName}`);
        debugInfo.competitorAnalysis.push({
          traderName: trader.traderName,
          reason: 'Failed to send notification',
          details: 'Telegram send failed'
        });
      }
    }

    if (eligibleCompetitors === 0) {
      console.log('[DEBUG] No eligible competitors found in this check.');
    }

    // Save the debug info from this run for the debug report
    lastMonitoringData = { ...debugInfo };
  } catch (error) {
    console.error('[DEBUG] Error in monitorPrices:', error);
  }
}

// Start monitoring
function start() {
  if (isRunning) {
    console.log('[DEBUG] Monitoring is already running.');
    return;
  }

  const settings = config.getSettings();
  const intervalSeconds = settings.pollingInterval || 5; // fallback to 5 if null (shouldn't happen due to checks)
  const intervalMs = intervalSeconds * 1000;

  console.log(`[DEBUG] Starting monitoring with interval ${intervalSeconds} seconds...`);
  initTelegramBot(); // Initialize bot if credentials are available

  // Run immediately on start
  monitorPrices().then(() => {
    // Set up monitoring interval
    intervalId = setInterval(monitorPrices, intervalMs);
    // Set up debug report interval (every 30 seconds)
    debugIntervalId = setInterval(sendDebugReport, 30 * 1000);
    isRunning = true;
    lastChecked = new Date().toISOString();
    console.log('[DEBUG] Monitoring started successfully');
  }).catch(err => {
    console.error('[DEBUG] Failed to run initial monitor:', err);
  });
}

// Stop monitoring
function stop() {
  if (!isRunning) {
    console.log('[DEBUG] Monitoring is not running.');
    return;
  }

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (debugIntervalId) {
    clearInterval(debugIntervalId);
    debugIntervalId = null;
  }
  isRunning = false;
  console.log('[DEBUG] Monitoring stopped.');
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
  getStatus,
  getDebugInfo
};