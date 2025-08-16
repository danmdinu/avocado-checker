# 🥑 Avocado Stock Notifier

A simple Node.js app that monitors [Tropical Fruit Paradise](https://tropicalfruitparadise.com/fructe-bio/) for avocado availability and sends email notifications when avocado products come back in stock.

## Features

- 🔍 **Smart Detection**: Looks for avocado products with "Vezi detalii" (View Details) buttons
- 📧 **Email Notifications**: Simple email alerts when new avocado products are available  
- ⏰ **Daily Scheduling**: Runs automatically once per day at 10 AM (Eastern European Time)
- 💾 **State Tracking**: Remembers previous checks to avoid duplicate notifications
- 🛡️ **Error Handling**: Robust error handling and logging

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Test the Scraper
```bash
npm test
```
This will show you all current products and verify the scraping is working.

### 3. Start the Bot
```bash
npm start
```

The bot will:
- Run an initial check immediately
- Schedule daily checks at 10 AM EET
- Create a `state.json` file to track previous checks
- Log all activity to the console

## How It Works

1. **Scrapes the website** daily for products containing "avocado"
2. **Checks for "Vezi detalii" buttons** - this indicates the product is actually in stock
3. **Compares with previous state** to detect new products
4. **Sends email notification** only when new avocado products become available

## Email Setup (Free!)

The app uses **Resend** - a free email service that actually sends emails (3,000/month free):

### To Get Real Email Notifications:

1. **Sign up for free** at [resend.com](https://resend.com)
2. **Get your API key** from [resend.com/api-keys](https://resend.com/api-keys)
3. **Set your API key** (choose one method):

   **Option A: Environment Variable (Recommended)**
   ```bash
   export RESEND_API_KEY="re_your_actual_api_key_here"
   npm start
   ```

   **Option B: Edit the code**
   ```javascript
   // In index.js, replace this line:
   resendApiKey: process.env.RESEND_API_KEY || 'YOUR_RESEND_API_KEY',
   // With your actual key:
   resendApiKey: 're_your_actual_api_key_here',
   ```

### Demo Mode
Without an API key, emails are logged to console so you can see what would be sent.

## Files

- `index.js` - Main application
- `test-scraper.js` - Test script to verify scraping
- `state.json` - Created automatically to track previous checks
- `package.json` - Dependencies and scripts

## Configuration

Edit the `CONFIG` object in `index.js` to customize:

```javascript
const CONFIG = {
  url: 'https://tropicalfruitparadise.com/fructe-bio/',
  email: {
    to: 'danmdinu@gmail.com',  // Change this to your email
    from: 'avocado.bot@notifications.com'
  },
  schedule: '0 10 * * *'  // 10 AM daily (cron format)
};
```

## Scheduling Options

The app uses cron syntax for scheduling. Examples:
- `'0 10 * * *'` - Daily at 10 AM
- `'0 9,15 * * *'` - Twice daily at 9 AM and 3 PM  
- `'0 10 * * 1-5'` - Weekdays only at 10 AM

## Troubleshooting

### No emails received?
- Check console for "Email sent:" messages
- If using test mode, look for "Preview URL:" in logs
- Verify your email settings if using real SMTP

### Scraper not finding products?
- Run `npm test` to see what the scraper detects
- Website structure might have changed - check the selectors in `scrapeAvocadoStock()`

### App stops running?
- The app needs to stay running to work on schedule
- Consider using PM2 for production: `npm install -g pm2 && pm2 start index.js --name avocado-bot`

## Logs

The app logs all activity with timestamps:
```
[2025-01-09T10:00:00.000Z] Starting Avocado Stock Checker...
[2025-01-09T10:00:00.000Z] Running initial check...
[2025-01-09T10:00:01.000Z] Checking avocado stock...
[2025-01-09T10:00:02.000Z] Found 0 avocado products in stock
[2025-01-09T10:00:02.000Z] No avocado products in stock
```

## Deployment Ideas

### Local (Current Setup)
- Run `npm start` and leave terminal open
- Simple but requires your computer to stay on

### Server Deployment
- Use PM2 on a VPS: `pm2 start index.js --name avocado-bot`
- Deploy to services like Railway, Render, or DigitalOcean

### Cloud Functions
- Convert to run on AWS Lambda, Vercel, or Netlify Functions
- Triggered by cron jobs instead of internal scheduling

## Contributing

Feel free to improve the scraping logic, add new notification methods, or enhance error handling!

## License

MIT License - Use freely! 