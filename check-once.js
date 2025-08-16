// Single-run version for GitHub Actions
// This runs once and exits (no continuous scheduling)

const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  url: 'https://tropicalfruitparadise.com/fructe-bio/',
  whatsapp: {
    // Add multiple phone numbers (with country code, no + sign)
    phoneNumbers: [
      '40123456789',  // Replace with your actual phone number
      '40987654321'   // Add more numbers as needed
    ],
    // Twilio credentials
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN',
    fromNumber: 'whatsapp:+14155238886' // Twilio WhatsApp sandbox number
  },
  stateFile: path.join(__dirname, 'state.json')
};

// Import functions from main script
async function scrapeAvocadoStock() {
  try {
    console.log(`[${new Date().toISOString()}] Checking avocado stock...`);
    
    const response = await fetch(CONFIG.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const avocadoProducts = [];

    // Look for all links with "Vezi detalii" text
    const viewDetailsLinks = Array.from(document.querySelectorAll('a')).filter(a => 
      a.textContent.includes('Vezi detalii')
    );

    for (const link of viewDetailsLinks) {
      // Find the product container (parent elements)
      let productContainer = link;
      for (let i = 0; i < 10; i++) { // Go up max 10 levels
        productContainer = productContainer.parentElement;
        if (!productContainer) break;
        
        // Look for product title in this container
        const titleElements = productContainer.querySelectorAll('h2, h3, .product-title, .woocommerce-loop-product__title');
        for (const titleEl of titleElements) {
          const title = titleEl.textContent.toLowerCase();
          if (title.includes('avocado')) {
            const productName = titleEl.textContent.trim();
            const productUrl = link.href;
            
            // Check if we already found this product
            const existingProduct = avocadoProducts.find(p => p.name === productName);
            if (!existingProduct) {
              avocadoProducts.push({
                name: productName,
                url: productUrl ? (productUrl.startsWith('http') ? productUrl : `https://tropicalfruitparadise.com${productUrl}`) : null,
                inStock: true,
                timestamp: new Date().toISOString()
              });
            }
            break;
          }
        }
      }
    }

    console.log(`[${new Date().toISOString()}] Found ${avocadoProducts.length} avocado products in stock`);
    return avocadoProducts;
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error scraping website:`, error.message);
    return [];
  }
}

async function loadState() {
  try {
    const data = await fs.readFile(CONFIG.stateFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { lastCheck: null, productsInStock: [] };
  }
}

async function saveState(state) {
  try {
    await fs.writeFile(CONFIG.stateFile, JSON.stringify(state, null, 2));
    console.log(`[${new Date().toISOString()}] State saved`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error saving state:`, error.message);
  }
}

async function sendWhatsAppNotification(newProducts) {
  try {
    const { accountSid, authToken, fromNumber, phoneNumbers } = CONFIG.whatsapp;
    
    // Check if credentials are set
    if (!accountSid || accountSid === 'YOUR_TWILIO_ACCOUNT_SID' || !authToken || authToken === 'YOUR_TWILIO_AUTH_TOKEN') {
      console.log(`[${new Date().toISOString()}] ⚠️  No Twilio credentials - Demo mode`);
      console.log(`[${new Date().toISOString()}] 📱 Would send WhatsApp to ${phoneNumbers.length} numbers about ${newProducts.length} new products`);
      newProducts.forEach(p => console.log(`- ${p.name}`));
      return;
    }

    // Create message content
    const productList = newProducts.map(p => `• ${p.name}${p.url ? `\n  ${p.url}` : ''}`).join('\n\n');
    const message = `🥑 *Avocado în stoc!*

Bună! Avocado este din nou disponibil la Tropical Fruit Paradise:

${productList}

Verifică site-ul: ${CONFIG.url}

_Avocado Notification Bot_`;

    // Send to all phone numbers
    const results = [];
    for (const phoneNumber of phoneNumbers) {
      try {
        const toNumber = `whatsapp:+${phoneNumber}`;
        
        // Twilio API call
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: fromNumber,
            To: toNumber,
            Body: message
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log(`[${new Date().toISOString()}] ✅ WhatsApp sent to ${phoneNumber} - SID: ${result.sid}`);
          results.push({ phoneNumber, success: true, sid: result.sid });
        } else {
          console.error(`[${new Date().toISOString()}] ❌ Failed to send to ${phoneNumber}:`, result.message);
          results.push({ phoneNumber, success: false, error: result.message });
        }
        
        // Small delay between messages to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Error sending to ${phoneNumber}:`, error.message);
        results.push({ phoneNumber, success: false, error: error.message });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`[${new Date().toISOString()}] 📱 WhatsApp notifications: ${successful}/${phoneNumbers.length} sent successfully`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error in WhatsApp notification:`, error.message);
  }
}

// Main function - runs once and exits
async function checkAvocadoStock() {
  try {
    console.log(`[${new Date().toISOString()}] 🥑 Starting avocado check (GitHub Actions)`);
    
    const currentProducts = await scrapeAvocadoStock();
    const previousState = await loadState();
    
    // Check if any new products are available
    const newProducts = currentProducts.filter(current => {
      return !previousState.productsInStock.some(previous => previous.name === current.name);
    });
    
    // Update state
    const newState = {
      lastCheck: new Date().toISOString(),
      productsInStock: currentProducts
    };
    
    await saveState(newState);
    
    // Send notification if new products found
    if (newProducts.length > 0) {
      console.log(`[${new Date().toISOString()}] 🎉 New avocado products found:`, newProducts.map(p => p.name));
      await sendWhatsAppNotification(newProducts);
    } else if (currentProducts.length === 0) {
      console.log(`[${new Date().toISOString()}] 😔 No avocado products in stock`);
    } else {
      console.log(`[${new Date().toISOString()}] ✅ Avocado still in stock, no new products`);
    }
    
    console.log(`[${new Date().toISOString()}] ✨ Check completed successfully`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error in main check:`, error.message);
    process.exit(1);
  }
}

// Run the check once and exit
checkAvocadoStock().then(() => {
  console.log(`[${new Date().toISOString()}] 👋 Exiting...`);
  process.exit(0);
}); 