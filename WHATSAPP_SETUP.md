# 📱 WhatsApp Setup Guide

## Step 1: Get Twilio WhatsApp API (Free Tier)

### Create Twilio Account:
1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for free account
3. Verify your phone number

### Get Your Credentials:
1. In Twilio Console → **Account Info**
2. Copy your **Account SID** and **Auth Token**

## Step 2: Set Up WhatsApp Sandbox (Free Testing)

### Enable WhatsApp Sandbox:
1. In Twilio Console → **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see a sandbox number like: `+1 415 523 8886`
3. You'll see a code like: `join <unique-code>`

### Connect Your Phone:
1. **Send WhatsApp message** to `+1 415 523 8886`
2. **Message content**: `join <your-unique-code>` (e.g., `join elephant-monkey`)
3. You'll get confirmation: "Joined sandbox! You can now receive messages."

### Add More People:
- Each person who wants notifications must send the join message
- They'll use the same sandbox number and code

## Step 3: Configure the Script

### Update Phone Numbers:
In `check-once.js`, update the phone numbers (line 9-12):
```javascript
phoneNumbers: [
  '40123456789',  // Replace with actual phone number (Romania example)
  '40987654321',  // Add more numbers
  '1234567890'    // US number example
],
```

**Format**: Country code + number (NO + sign, NO spaces)
- Romania: `40123456789`
- US: `1234567890` 
- UK: `44123456789`

### Test Locally (Optional):
```bash
export TWILIO_ACCOUNT_SID="your_account_sid"
export TWILIO_AUTH_TOKEN="your_auth_token"
node check-once.js
```

## Step 4: Add Secrets to GitHub

### Set GitHub Secrets:
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:

**Secret 1:**
- Name: `TWILIO_ACCOUNT_SID`
- Value: Your Account SID from Twilio

**Secret 2:**
- Name: `TWILIO_AUTH_TOKEN`
- Value: Your Auth Token from Twilio

## Step 5: Deploy & Test

### Push Changes:
```bash
git add .
git commit -m "Switch to WhatsApp notifications"
git push origin main
```

### Test the Workflow:
1. Go to **Actions** tab in GitHub
2. Click **Daily Avocado Check**
3. Click **Run workflow** → **Run workflow**
4. Check logs for success messages

## Expected WhatsApp Message Formats:

### 🎉 New Avocados Found:
```
🥑 *AVOCADO NOU ÎN STOC!*

Bună! Avocado este din nou disponibil la Tropical Fruit Paradise:

• Avocado Bio Premium
  https://tropicalfruitparadise.com/product/avocado-bio

• Avocado Hass Organic
  https://tropicalfruitparadise.com/product/avocado-hass

Verifică site-ul: https://tropicalfruitparadise.com/fructe-bio/

_Avocado Bot - marți, 16 august 2025_
```

### ✅ Still In Stock:
```
🥑 *Avocado încă în stoc*

Bună! Avocado este încă disponibil la Tropical Fruit Paradise:

• Avocado Bio Premium
  https://tropicalfruitparadise.com/product/avocado-bio

Verifică site-ul: https://tropicalfruitparadise.com/fructe-bio/

_Avocado Bot - marți, 16 august 2025_
```

### 😔 No Stock:
```
😔 *Nu este avocado în stoc*

Bună! Din păcate, avocado nu este disponibil astăzi la Tropical Fruit Paradise.

Te voi anunța când devine disponibil!

Verifică site-ul: https://tropicalfruitparadise.com/fructe-bio/

_Avocado Bot - marți, 16 august 2025_
```

**Note**: You'll receive a WhatsApp message **every day at 10 AM** regardless of stock status!

## Upgrading to Production (Optional)

### For Higher Limits:
- **Sandbox**: Free, 200 messages/day
- **Production**: $0.0055/message, unlimited

### Production Setup:
1. In Twilio Console → **WhatsApp** → **Senders**
2. Request approval for your business
3. Update `fromNumber` in config to your approved number

## Troubleshooting

### "Join sandbox" doesn't work?
- Make sure you send exactly: `join your-code-here`
- Check you're messaging the correct sandbox number
- Try from a different phone

### No messages received?
- Check GitHub Actions logs for errors
- Verify phone numbers are correct format (no + or spaces)
- Ensure people joined the sandbox

### Rate limits?
- Sandbox: 200 messages/day max
- Script has 1-second delay between messages
- For more people, consider production account

## Cost Breakdown

- **Twilio Account**: Free
- **WhatsApp Sandbox**: Free (200 messages/day)
- **GitHub Actions**: Free
- **Total Monthly Cost**: $0 🎉

Perfect for personal use and small groups! 