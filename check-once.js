// Single-run version for GitHub Actions
// This runs once and exits (no continuous scheduling)

const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');

// Configuration (same as index.js)
const CONFIG = {
  url: 'https://tropicalfruitparadise.com/fructe-bio/',
  email: {
    to: 'danmdinu@gmail.com',
    from: 'Avocado Bot <onboarding@resend.dev>'
  },
  resendApiKey: process.env.RESEND_API_KEY || 'YOUR_RESEND_API_KEY',
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

async function sendNotification(newProducts) {
  try {
    if (!CONFIG.resendApiKey || CONFIG.resendApiKey === 'YOUR_RESEND_API_KEY') {
      console.log(`[${new Date().toISOString()}] ⚠️  No API key - Demo mode`);
      console.log(`[${new Date().toISOString()}] 📧 Would send email about ${newProducts.length} new products`);
      newProducts.forEach(p => console.log(`- ${p.name}`));
      return;
    }

    const resend = new Resend(CONFIG.resendApiKey);
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
      await sendNotification(newProducts);
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