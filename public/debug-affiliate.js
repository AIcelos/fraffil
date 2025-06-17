// Debug script voor CORS en Affiliate API problemen
console.log('🔧 Affiliate Debug Script gestart');

class AffiliateDebugger {
  constructor() {
    this.baseUrl = 'https://fraffil.vercel.app';
    this.testResults = {};
  }

  async testCORS() {
    console.log('🌐 CORS Test starten...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/test`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ CORS Test GELUKT:', data);
        this.testResults.cors = 'SUCCESS';
        return true;
      } else {
        console.log('❌ CORS Test gefaald - HTTP Status:', response.status);
        this.testResults.cors = `FAILED - HTTP ${response.status}`;
        return false;
      }
    } catch (error) {
      console.log('❌ CORS Test ERROR:', error.message);
      this.testResults.cors = `ERROR - ${error.message}`;
      return false;
    }
  }

  async testAffiliateAPI() {
    console.log('🎯 Affiliate API Test starten...');
    
    const testData = {
      ref: 'debug-test-' + Date.now(),
      orderId: 'test-order-' + Math.floor(Math.random() * 1000)
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/affiliate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
        mode: 'cors',
        credentials: 'omit'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Affiliate API Test GELUKT:', result);
        this.testResults.affiliate = 'SUCCESS';
        return true;
      } else {
        console.log('❌ Affiliate API Test gefaald - HTTP Status:', response.status);
        const errorText = await response.text();
        console.log('Error details:', errorText);
        this.testResults.affiliate = `FAILED - HTTP ${response.status}`;
        return false;
      }
    } catch (error) {
      console.log('❌ Affiliate API Test ERROR:', error.message);
      this.testResults.affiliate = `ERROR - ${error.message}`;
      return false;
    }
  }

  getEnvironmentInfo() {
    const info = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      origin: window.location.origin,
      referrer: document.referrer,
      cookies: document.cookie,
      localStorage: {
        affiliate_ref: localStorage.getItem('affiliate_ref'),
        affiliate_tracked: localStorage.getItem('affiliate_tracked'),
        affiliate_fallbacks: localStorage.getItem('affiliate_fallbacks')
      }
    };
    
    console.log('🔍 Environment Info:', info);
    return info;
  }

  async runFullDiagnostic() {
    console.log('🚀 Volledige Affiliate Diagnostiek starten...');
    
    // Environment info
    const envInfo = this.getEnvironmentInfo();
    
    // CORS test
    const corsResult = await this.testCORS();
    
    // Affiliate API test
    const affiliateResult = await this.testAffiliateAPI();
    
    // Summary
    const summary = {
      timestamp: new Date().toISOString(),
      environment: envInfo,
      tests: this.testResults,
      overall: corsResult && affiliateResult ? 'SUCCESS' : 'FAILED'
    };
    
    console.log('📊 DIAGNOSTIEK SAMENVATTING:', summary);
    
    // Sla resultaten op voor debugging
    localStorage.setItem('affiliate_debug_results', JSON.stringify(summary));
    
    return summary;
  }

  // Quick test functie
  async quickTest() {
    console.log('⚡ Quick CORS Test...');
    return await this.testCORS();
  }
}

// Maak debugger beschikbaar
window.affiliateDebugger = new AffiliateDebugger();

// Auto-run diagnostiek
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 Auto-diagnostiek starten in 2 seconden...');
  setTimeout(() => {
    window.affiliateDebugger.runFullDiagnostic();
  }, 2000);
});

console.log('🔧 Debug script geladen. Gebruik: window.affiliateDebugger.runFullDiagnostic()'); 