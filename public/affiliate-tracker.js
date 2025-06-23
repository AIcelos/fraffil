// Affiliate Tracker Script voor Filright
// Gebruik dit script op de dankpagina

class AffiliateTracker {
  constructor() {
    this.apiUrl = 'https://affiliate.filright.com/api/affiliate';
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 seconde
  }

  // Haal referral code op uit URL parameters of localStorage
  getReferralCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || urlParams.get('referral') || localStorage.getItem('affiliate_ref');
    return ref;
  }

  // Haal order ID op uit de pagina (aanpassen naar jouw structuur)
  getOrderId() {
    // Probeer verschillende manieren om order ID te vinden
    const orderElement = document.querySelector('[data-order-id]');
    if (orderElement) return orderElement.dataset.orderId;
    
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order') || urlParams.get('order_id');
    if (orderId) return orderId;
    
    // Fallback: zoek in page content
    const orderMatch = document.body.innerText.match(/(?:order|bestelling)[\s#:]*(\d+)/i);
    return orderMatch ? orderMatch[1] : null;
  }

  // Verstuur tracking data met retry mechanisme
  async trackAffiliate(ref, orderId, attempt = 1) {
    console.log(`🎯 Affiliate tracking poging ${attempt}: ref=${ref}, orderId=${orderId}`);
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref, orderId }),
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Affiliate tracking succesvol:', result);
      
      // Sla succesvolle tracking op in localStorage
      localStorage.setItem('affiliate_tracked', JSON.stringify({
        ref,
        orderId,
        timestamp: Date.now()
      }));
      
      return result;
      
    } catch (error) {
      console.error(`❌ Affiliate tracking fout (poging ${attempt}):`, error);
      
      if (attempt < this.retryAttempts) {
        console.log(`🔄 Opnieuw proberen in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.trackAffiliate(ref, orderId, attempt + 1);
      } else {
        console.error('💥 Affiliate tracking definitief gefaald na', this.retryAttempts, 'pogingen');
        
        // Fallback: sla data op voor handmatige verwerking
        this.saveFallbackData(ref, orderId, error.message);
        throw error;
      }
    }
  }

  // Fallback: sla data op in localStorage voor handmatige verwerking
  saveFallbackData(ref, orderId, error) {
    const fallbackData = {
      ref,
      orderId,
      error,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    const existingFallbacks = JSON.parse(localStorage.getItem('affiliate_fallbacks') || '[]');
    existingFallbacks.push(fallbackData);
    localStorage.setItem('affiliate_fallbacks', JSON.stringify(existingFallbacks));
    
    console.log('💾 Fallback data opgeslagen:', fallbackData);
  }

  // Hoofdfunctie om affiliate tracking uit te voeren
  async init() {
    try {
      const ref = this.getReferralCode();
      const orderId = this.getOrderId();

      if (!ref) {
        console.log('ℹ️ Geen referral code gevonden - geen affiliate tracking');
        return;
      }

      if (!orderId) {
        console.warn('⚠️ Geen order ID gevonden - affiliate tracking overslaan');
        return;
      }

      // Check of we deze combinatie al hebben getrackt
      const existing = localStorage.getItem('affiliate_tracked');
      if (existing) {
        const tracked = JSON.parse(existing);
        if (tracked.ref === ref && tracked.orderId === orderId) {
          console.log('ℹ️ Deze affiliate sale is al getrackt');
          return;
        }
      }

      await this.trackAffiliate(ref, orderId);
      
    } catch (error) {
      console.error('💥 Kritieke fout in affiliate tracker:', error);
    }
  }
}

// Auto-start wanneer de pagina geladen is
document.addEventListener('DOMContentLoaded', () => {
  const tracker = new AffiliateTracker();
  tracker.init();
});

// Export voor handmatig gebruik
window.affiliateTracker = new AffiliateTracker(); 