# Track Bot - Gate.io P2P Price Monitor (Debug Version)

A web application that monitors P2P traders on Gate.io for USDT/EGP sell orders and sends Telegram notifications when competitors offer better prices than your own trader profile. This version includes detailed debugging information in the browser console.

## Features

- Monitor Gate.io P2P market for USDT/EGP with Instapay payment method
- Compare competitor prices with your own trader price
- Send real-time Telegram notifications when profitable opportunities are found
- Prevent duplicate notifications for the same price level
- **Debugging**: View detailed monitoring information in browser console (F12)
- Configurable polling interval
- Simple React frontend to configure settings
- Backend Node.js server with continuous monitoring

## Debugging Features

When monitoring is active, detailed information is logged to the browser console every 5 seconds:

1. **Scraped Data**: First 5 orders showing trader name, price, payment methods, and max quantity
2. **Trader Status**: Whether your trader was found and their price
3. **Counters**: 
   - Number of competitors using Instapay
   - Number of competitors with higher prices
   - Number of competitors meeting minimum quantity requirements
4. **Detailed Analysis**: For each competitor, see exactly why they are or aren't eligible for notification

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Your Telegram Chat ID (get from [@userinfobot](https://t.me/userinfobot))

## Local Development

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   The frontend will run on `http://localhost:3000` and proxy API requests to `http://localhost:5000`

### How to Use Debugging

1. Start both frontend and backend servers
2. In the web interface, you would normally enter your settings and click "Start"
3. Open browser developer tools (F12) and go to the Console tab
4. Every 5 seconds, you'll see a detailed debug block showing:
   - Timestamp
   - Scraped data (first 5 orders)
   - Whether your trader was found and their price
   - Counters for various criteria
   - Detailed analysis of each competitor

## API Endpoints

- `GET /api/status` - Returns status information plus debug data
- `POST /api/start` - Starts monitoring
- `POST /api/stop` - Stops monitoring

## How It Works

1. The backend periodically scrapes the Gate.io P2P page for USDT/EGP sell orders
2. It looks for traders using the Instapay payment method
3. It compares each trader's price with your configured trader price
4. If a competitor offers a higher price and has sufficient quantity (≥ your minimum), a Telegram notification is sent
5. Duplicate notifications are prevented by tracking the last notified price for each trader
6. During each monitoring cycle, detailed debug information is collected and made available via the `/api/status` endpoint
7. The frontend fetches this data every 5 seconds and logs it to the browser console

## Notes

- This version focuses on debugging capabilities. In a production version, you would implement the settings endpoints to allow configuration via the UI.
- The scraping relies on the current structure of Gate.io's P2P page. If the page changes significantly, the scraper may need updating.
- Be respectful of Gate.io's terms of service and avoid excessive polling.
- For production use, consider adjusting the polling interval to avoid overloading the service.
- This tool is for educational purposes. Use at your own risk.

## License

MIT