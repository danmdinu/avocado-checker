const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { Resend } = require('resend');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  url: 'https://tropicalfruitparadise.com/fructe-bio/',
  email: {
    to: 'danmdinu@gmail.com',
    from: 'Avocado Bot <onboarding@resend.dev>' // Using Resend's test domain
  },
  // Get your API key from: https://resend.com/api-keys
  // Replace 'YOUR_RESEND_API_KEY' with your actual key
  resendApiKey: process.env.RESEND_API_KEY || 'YOUR_RESEND_API_KEY',
  stateFile: path.join(__dirname, 'state.json'),
  // Cron: Every day at 10 AM EET (UTC+2/UTC+3 depending on DST)
  schedule: '0 10 * * *'
};

// Initialize Resend client
const initializeResend = () => {
  if (CONFIG.resendApiKey === 'YOUR_RESEND_API_KEY') {
    console.log(`[${new Date().toISOString()}] ⚠️  Using placeholder API key. Get your free API key from https://resend.com/api-keys`);
    console.log(`[${new Date().toISOString()}] 📧 Emails will be logged to console instead of sent`);
    return null;
  }
  return new Resend(CONFIG.resendApiKey);
};

// Scrape the website for avocado products
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

    // Alternative: search the entire page for "avocado" text and check nearby for "Vezi detalii"
    const allText = document.body.textContent.toLowerCase();
    if (allText.includes('avocado')) {
      // Get all elements containing "avocado"
      const walker = document.createTreeWalker(
        document.body,
        dom.window.NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            return node.textContent.toLowerCase().includes('avocado') ? 
              dom.window.NodeFilter.FILTER_ACCEPT : 
              dom.window.NodeFilter.FILTER_REJECT;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        let element = node.parentElement;
        // Go up the DOM tree to find a product container
        for (let i = 0; i < 10; i++) {
          if (!element) break;
          
          // Check if this container has a "Vezi detalii" link
          const viewDetailsInContainer = element.querySelector('a[href*=""]');
          if (viewDetailsInContainer && viewDetailsInContainer.textContent.includes('Vezi detalii')) {
            const productName = node.textContent.trim();
            if (productName.toLowerCase().includes('avocado') && productName.length > 5) {
              const existingProduct = avocadoProducts.find(p => p.name === productName);
              if (!existingProduct) {
                avocadoProducts.push({
                  name: productName,
                  url: viewDetailsInContainer.href ? 
                    (viewDetailsInContainer.href.startsWith('http') ? 
                      viewDetailsInContainer.href : 
                      `https://tropicalfruitparadise.com${viewDetailsInContainer.href}`) : null,
                  inStock: true,
                  timestamp: new Date().toISOString()
                });
              }
              break;
            }
          }
          element = element.parentElement;
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

// Load previous state
async function loadState() {
  try {
    const data = await fs.readFile(CONFIG.stateFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, return empty state
    return { lastCheck: null, productsInStock: [] };
  }
}

// Save current state
async function saveState(state) {
  try {
    await fs.writeFile(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error saving state:`, error.message);
  }
}

// Note: This file still uses email for backward compatibility
// For WhatsApp notifications, use check-once.js with GitHub Actions
async function sendNotification(newProducts) {
  try {
    const resend = initializeResend();
    
    const productList = newProducts.map(p => `• ${p.name}${p.url ? ` - ${p.url}` : ''}`).join('\n');
    
    const emailData = {
      from: CONFIG.email.from,
      to: [CONFIG.email.to],
      subject: '🥑 Avocado în stoc la Tropical Fruit Paradise!',
      text: `Bună!\n\nAvocado este din nou disponibil:\n\n${productList}\n\nVerifică site-ul: ${CONFIG.url}\n\n--\nAvocado Notification Bot`,
      html: `
        <h2>🥑 Avocado în stoc!</h2>
        <p>Bună!</p>
        <p>Avocado este din nou disponibil la Tropical Fruit Paradise:</p>
        <ul>
          ${newProducts.map(p => `<li><strong>${p.name}</strong>${p.url ? ` - <a href="${p.url}">Vezi detalii</a>` : ''}</li>`).join('')}
        </ul>
        <p><a href="${CONFIG.url}">Vizitează site-ul</a></p>
        <p><em>--<br>Avocado Notification Bot</em></p>
      `
    };

    if (!resend) {
      // Demo mode - log email content
      console.log(`[${new Date().toISOString()}] 📧 EMAIL CONTENT (Demo Mode):`);
      console.log(`To: ${CONFIG.email.to}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log(`Text: ${emailData.text}`);
      console.log(`[${new Date().toISOString()}] ℹ️  To send real emails, get your API key from https://resend.com/api-keys`);
      return;
    }

    const { data, error } = await resend.emails.send(emailData);
    
    if (error) {
      console.error(`[${new Date().toISOString()}] Error sending email:`, error);
      return;
    }

    console.log(`[${new Date().toISOString()}] ✅ Email sent successfully! ID:`, data.id);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error sending email:`, error.message);
  }
}

// Main check function
async function checkAvocadoStock() {
  try {
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
      console.log(`[${new Date().toISOString()}] New avocado products found:`, newProducts.map(p => p.name));
      await sendNotification(newProducts);
    } else if (currentProducts.length === 0) {
      console.log(`[${new Date().toISOString()}] No avocado products in stock`);
    } else {
      console.log(`[${new Date().toISOString()}] Avocado still in stock, no new products`);
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in main check:`, error.message);
  }
}

// Schedule daily checks
console.log(`[${new Date().toISOString()}] Starting Avocado Stock Checker...`);
console.log(`[${new Date().toISOString()}] Scheduled to run daily at 10:00 AM EET`);

// Schedule the job (10 AM every day)
cron.schedule(CONFIG.schedule, () => {
  console.log(`[${new Date().toISOString()}] Running scheduled check...`);
  checkAvocadoStock();
}, {
  timezone: 'Europe/Bucharest'
});

// Run initial check
console.log(`[${new Date().toISOString()}] Running initial check...`);
checkAvocadoStock();

// Keep the process running
console.log(`[${new Date().toISOString()}] Bot is running. Press Ctrl+C to stop.`); 