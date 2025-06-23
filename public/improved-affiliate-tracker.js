// Verbeterde Affiliate Tracker met Duplicate Protection
<script>
(function() {
  // Helper functions
  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }
  
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
  }
  
  function getQueryParam(param) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Extract order amount from thank you page
  function getOrderAmount() {
    var amount = null;
    
    // Try different methods to extract order amount
    // Method 1: Look for euro amounts in the page
    var bodyText = document.body.innerText || document.body.textContent;
    var euroMatches = bodyText.match(/€\s*(\d+[.,]\d{2})/g);
    
    if (euroMatches && euroMatches.length > 0) {
      // Get the largest amount (likely the order total)
      var amounts = euroMatches.map(function(match) {
        return parseFloat(match.replace('€', '').replace(',', '.').trim());
      });
      amount = Math.max.apply(Math, amounts);
    }
    
    // Method 2: Look for specific order total elements
    var totalElements = document.querySelectorAll('[class*="total"], [class*="amount"], [id*="total"]');
    totalElements.forEach(function(el) {
      var text = el.innerText || el.textContent;
      var match = text.match(/€\s*(\d+[.,]\d{2})/);
      if (match) {
        var foundAmount = parseFloat(match[1].replace(',', '.'));
        if (foundAmount > (amount || 0)) {
          amount = foundAmount;
        }
      }
    });
    
    return amount;
  }
  
  // Save ref parameter to cookie
  var ref = getQueryParam('ref');
  if (ref) {
    setCookie('affiliate_ref', ref, 30);
    console.log('🎯 Affiliate ref opgeslagen:', ref);
  }
  
  // Track affiliate on thank you page (with duplicate protection)
  if (window.location.pathname.indexOf('/checkout/thankyou') !== -1) {
    var orderId = null;
    var orderAmount = null;
    
    // Extract order ID
    var paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(function(p) {
      if (p.textContent.includes('Je bestelling met ordernummer')) {
        var strong = p.querySelector('strong');
        if (strong) {
          orderId = strong.textContent.trim();
        }
      }
    });
    
    // Extract order amount
    orderAmount = getOrderAmount();
    
    var savedRef = getCookie('affiliate_ref');
    if (savedRef && orderId) {
      
      // Duplicate protection check
      var trackedKey = 'affiliate_tracked_' + orderId;
      var alreadyTracked = localStorage.getItem(trackedKey);
      
      if (alreadyTracked) {
        console.log('ℹ️ Order al getrackt (F5 protection):', orderId);
        return;
      }
      
      console.log('🚀 Affiliate tracking starten:', { ref: savedRef, orderId: orderId, amount: orderAmount });
      
      var payload = { 
        ref: savedRef, 
        orderId: orderId
      };
      
      // Add amount if found
      if (orderAmount) {
        payload.amount = orderAmount;
      }
      
      fetch('https://affiliate.filright.com/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(response) {
        return response.json();
      }).then(function(data) {
        console.log('✅ Affiliate tracking success:', data);
        
        // Mark this order as tracked (prevents F5 duplicates)
        localStorage.setItem(trackedKey, JSON.stringify({
          ref: savedRef,
          orderId: orderId,
          amount: orderAmount,
          timestamp: new Date().toISOString()
        }));
        
      }).catch(function(error) {
        console.log('❌ Affiliate tracking error:', error);
      });
    } else {
      console.log('ℹ️ Geen affiliate tracking: ref=' + savedRef + ', orderId=' + orderId);
    }
  }
})();
</script> 