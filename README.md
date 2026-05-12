# Track Bot - Gate.io P2P Price Monitor

A web application that monitors P2P traders on Gate.io for USDT/EGP sell orders and sends Telegram notifications when competitors offer better prices than your own trader profile.

## Features

- Monitor Gate.io P2P market for USDT/EGP with Instapay payment method
- Compare competitor prices with your own trader price
- Send real-time Telegram notifications when profitable opportunities are found
- Prevent duplicate notifications for the same price level
- Configurable polling interval
- Simple React frontend to configure settings
- Backend Node.js server with continuous monitoring
- Ready to deploy to Railway or any Node.js hosting

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

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` to add your initial settings (optional, can be configured via frontend):
   ```
   PORT=5000
   MY_TRADER_NAME=your_trader_name
   MIN_QUANTITY=0.1
   TELEGRAM_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   POLLING_INTERVAL=5
   ```

5. Start the backend server:
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

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Port for the backend server | No (defaults to 5000) |
| `MY_TRADER_NAME` | Your trader name on Gate.io | Yes (for monitoring) |
| `MIN_QUANTITY` | Minimum quantity (USDT) to monitor for competitors | No (defaults to 0) |
| `TELEGRAM_TOKEN` | Telegram Bot API token | Yes (for notifications) |
| `TELEGRAM_CHAT_ID` | Your Telegram Chat ID | Yes (for notifications) |
| `POLLING_INTERVAL` | How often to check prices (in seconds) | No (defaults to 5) |

## Deployment to Railway

1. Push this repository to GitHub

2. In Railway:
   - Create a new project
   - Connect your GitHub repository
   - Railway will automatically detect the Node.js project
   - Set the build command: `cd frontend && npm install && npm run build && cd ..`
   - Set the start command: `node backend/server.js`
   - Add the following environment variables in the Railway dashboard:
     - `MY_TRADER_NAME`
     - `MIN_QUANTITY`
     - `TELEGRAM_TOKEN`
     - `TELEGRAM_CHAT_ID`
     - `POLLING_INTERVAL` (optional)
     - `NODE_ENV` set to `production`

3. Railway will:
   - Install backend dependencies
   - Install frontend dependencies and build the React app
   - Serve the built frontend from the backend server
   - Start the Node.js server

## How It Works

1. The backend periodically scrapes the Gate.io P2P page for USDT/EGP sell orders
2. It looks for traders using the Instapay payment method
3. It compares each trader's price with your configured trader price
4. If a competitor offers a higher price and has sufficient quantity (≥ your minimum), a Telegram notification is sent
5. Duplicate notifications are prevented by tracking the last notified price for each trader

## Telegram Message Format

Notifications include:
- Competitor trader name
- Competitor price
- Your price
- Price difference (absolute and percentage)
- Maximum quantity available from competitor
- Direct link to the competitor's ad
- Timestamp

## Notes

- The scraping relies on the current structure of Gate.io's P2P page. If the page changes significantly, the scraper may need updating.
- Be respectful of Gate.io's terms of service and avoid excessive polling.
- For production use, consider adjusting the polling interval to avoid overloading the service.
- This tool is for educational purposes. Use at your own risk.

## License

MIT