const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

// Test the scraping functionality
async function testScraper() {
  try {
    console.log('Testing scraper on Tropical Fruit Paradise...\n');
    
    const response = await fetch('https://tropicalfruitparadise.com/fructe-bio/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    console.log('=== ALL PRODUCTS WITH "Vezi detalii" ===');
    const viewDetailsLinks = Array.from(document.querySelectorAll('a')).filter(a => 
      a.textContent.includes('Vezi detalii')
    );
    
    viewDetailsLinks.forEach((link, index) => {
      // Find the product container (parent elements)
      let productContainer = link;
      let productName = '';
      
      for (let i = 0; i < 10; i++) { // Go up max 10 levels
        productContainer = productContainer.parentElement;
        if (!productContainer) break;
        
        // Look for product title in this container
        const titleElements = productContainer.querySelectorAll('h2, h3, .product-title, .woocommerce-loop-product__title');
        for (const titleEl of titleElements) {
          if (titleEl.textContent.trim().length > 5) {
            productName = titleEl.textContent.trim();
            break;
          }
        }
        if (productName) break;
      }
      
      if (productName) {
        console.log(`${index + 1}. ${productName}`);
        console.log(`   Link: ${link.href}`);
        console.log(`   Contains 'avocado': ${productName.toLowerCase().includes('avocado')}`);
        console.log('');
      }
    });
    
    console.log('\n=== SEARCHING FOR AVOCADO SPECIFICALLY ===');
    const avocadoProducts = [];
    
    // Method 1: Check each "Vezi detalii" link for avocado products
    for (const link of viewDetailsLinks) {
      let productContainer = link;
      for (let i = 0; i < 10; i++) {
        productContainer = productContainer.parentElement;
        if (!productContainer) break;
        
        const titleElements = productContainer.querySelectorAll('h2, h3, .product-title, .woocommerce-loop-product__title');
        for (const titleEl of titleElements) {
          const title = titleEl.textContent.toLowerCase();
          if (title.includes('avocado')) {
            const productName = titleEl.textContent.trim();
            console.log(`Found avocado product: ${productName}`);
            console.log(`Has "Vezi detalii": true`);
            
            if (!avocadoProducts.includes(productName)) {
              avocadoProducts.push(productName);
            }
            break;
          }
        }
      }
    }
    
    // Method 2: Search page text for "avocado" mentions
    const allText = document.body.textContent.toLowerCase();
    if (allText.includes('avocado')) {
      console.log(`Found "avocado" text in page content`);
      // Additional search could be implemented here if needed
    }
    
    console.log('\n=== FINAL RESULT ===');
    if (avocadoProducts.length > 0) {
      console.log('🥑 AVOCADO PRODUCTS IN STOCK:');
      avocadoProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product}`);
      });
    } else {
      console.log('❌ No avocado products found with "Vezi detalii" button');
      console.log('(This is expected based on the current website state)');
    }
    
    console.log('\n=== PAGE INFO ===');
    console.log(`Total "Vezi detalii" buttons found: ${viewDetailsLinks.length}`);
    console.log(`Page title: ${document.querySelector('title')?.textContent || 'No title found'}`);
    console.log(`Page loaded successfully: ${response.ok}`);
    
  } catch (error) {
    console.error('Error testing scraper:', error.message);
  }
}

testScraper(); 