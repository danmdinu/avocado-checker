# 🚀 Deployment Guide

## 🆓 FREE Deployment Options

### Option 1: Render (100% Free - Recommended)

**Limitations**: Spins down after 15 minutes of inactivity, spins back up when needed
**Perfect for**: Daily scheduled tasks like this bot

#### Steps:
1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for free deployment"
   git push origin main
   ```

2. **Deploy on Render (Free)**:
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New" → "Background Worker"
   - Connect your GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Select **"Free"** plan

3. **Set Environment Variable**:
   - In Environment tab, add: `RESEND_API_KEY` = your API key
   - Click "Create Background Worker"

**Why this works perfectly**: Even though it "sleeps", the cron job will wake it up at 10 AM daily!

### Option 2: Railway (Free Trial)

**Free**: $5 credit monthly (covers small apps)
- Follow steps from Option 1 in paid section below
- Select the free tier during setup

### Option 3: GitHub Actions (Completely Free)

Convert your script to run as a GitHub Action:

#### Create `.github/workflows/avocado-check.yml`:
```yaml
name: Daily Avocado Check

on:
  schedule:
    - cron: '0 8 * * *'  # 10 AM EET = 8 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  check-avocado:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run avocado check
      env:
        RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
      run: node check-once.js
```

#### Create `check-once.js`:
```javascript
// Single run version (no scheduling, just check once)
const { checkAvocadoStock } = require('./index.js');

// Run once and exit
checkAvocadoStock().then(() => {
  console.log('Check completed, exiting...');
  process.exit(0);
});
```

**Setup**:
1. Add files to your repo
2. In GitHub repo → Settings → Secrets → Add `RESEND_API_KEY`
3. GitHub runs it daily for free!

### Option 4: Vercel Cron (Free)

Convert to serverless function with cron:

#### Create `api/check-avocado.js`:
```javascript
// Serverless function version
export default async function handler(req, res) {
  // Your check logic here
  const { checkAvocadoStock } = require('../index.js');
  
  try {
    await checkAvocadoStock();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/check-avocado",
    "schedule": "0 8 * * *"
  }]
}
```

**Deploy**: Connect to Vercel, add environment variable

---

## 💰 Paid Options (More Reliable)

### Option 1: Railway (Recommended - Easiest)

### Steps:
1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository
   - Railway will auto-detect it's a Node.js app

3. **Set Environment Variable**:
   - In Railway dashboard → Variables tab
   - Add: `RESEND_API_KEY` = your actual API key from resend.com

4. **Deploy**:
   - Railway automatically deploys
   - Your bot runs 24/7 and checks daily at 10 AM EET

**Cost**: $5/month

## Option 2: Render

### Steps:
1. **Push to GitHub** (if not already)

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - "New" → "Background Worker"
   - Connect your GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Set Environment Variable**:
   - Add `RESEND_API_KEY` in Environment tab

**Cost**: Free tier available, $7/month for always-on

## Option 3: DigitalOcean App Platform

### Steps:
1. **Push to GitHub**

2. **Create App**:
   - Go to DigitalOcean → Apps
   - Create App from GitHub
   - Select repository

3. **Configure**:
   - App Type: Worker
   - Add environment variable: `RESEND_API_KEY`

**Cost**: $5/month

## Option 4: VPS with PM2 (Most Control)

### Steps:
1. **Get a VPS** (DigitalOcean, Linode, etc.)

2. **Setup**:
   ```bash
   # On your VPS
   git clone https://github.com/yourusername/avocado_notifications.git
   cd avocado_notifications
   npm install
   npm install -g pm2
   
   # Set environment variable
   export RESEND_API_KEY="your_key_here"
   
   # Start with PM2
   pm2 start index.js --name avocado-bot
   pm2 startup
   pm2 save
   ```

**Cost**: $5-10/month for VPS

## Getting Your Resend API Key

1. Sign up free at [resend.com](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy it (starts with `re_`)

## Verification

After deployment, check the logs to see:
- "Starting Avocado Stock Checker..."
- "Running initial check..."
- "Scheduled to run daily at 10:00 AM EET"

Your bot is now running 24/7! 🥑 