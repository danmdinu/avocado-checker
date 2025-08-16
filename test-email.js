const { Resend } = require('resend');

// Test the email notification with simulated avocado products
const CONFIG = {
  email: {
    to: 'danmdinu@gmail.com',
    from: 'Avocado Bot <onboarding@resend.dev>'
  },
  resendApiKey: process.env.RESEND_API_KEY || 'YOUR_RESEND_API_KEY',
  url: 'https://tropicalfruitparadise.com/fructe-bio/'
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

// Send email notification
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

// Test with fake avocado products
async function testEmail() {
  console.log(`[${new Date().toISOString()}] Testing email notification...`);
  
  const fakeAvocadoProducts = [
    {
      name: 'Avocado Hass Premium',
      url: 'https://tropicalfruitparadise.com/avocado-hass-premium/',
      inStock: true,
      timestamp: new Date().toISOString()
    },
    {
      name: 'Avocado Bio Ecuador',
      url: 'https://tropicalfruitparadise.com/avocado-bio-ecuador/',
      inStock: true,
      timestamp: new Date().toISOString()
    }
  ];
  
  await sendNotification(fakeAvocadoProducts);
  console.log(`[${new Date().toISOString()}] Test completed!`);
}

testEmail(); 