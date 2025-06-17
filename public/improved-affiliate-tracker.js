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
  
  // Save ref parameter to cookie
  var ref = getQueryParam('ref');
  if (ref) {
    setCookie('affiliate_ref', ref, 30);
    console.log('🎯 Affiliate ref opgeslagen:', ref);
  }
  
  // Track affiliate on thank you page (with duplicate protection)
  if (window.location.pathname.indexOf('/checkout/thankyou') !== -1) {
    var orderId = null;
    var paragraphs = document.querySelectorAll('p');
    
    paragraphs.forEach(function(p) {
      if (p.textContent.includes('Je bestelling met ordernummer')) {
        var strong = p.querySelector('strong');
        if (strong) {
          orderId = strong.textContent.trim();
        }
      }
    });
    
    var savedRef = getCookie('affiliate_ref');
    if (savedRef && orderId) {
      
      // Duplicate protection check
      var trackedKey = 'affiliate_tracked_' + orderId;
      var alreadyTracked = localStorage.getItem(trackedKey);
      
      if (alreadyTracked) {
        console.log('ℹ️ Order al getrackt (F5 protection):', orderId);
        return;
      }
      
      console.log('🚀 Affiliate tracking starten:', savedRef, orderId);
      
      fetch('https://fraffil.vercel.app/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: savedRef, orderId: orderId })
      }).then(function(response) {
        return response.json();
      }).then(function(data) {
        console.log('✅ Affiliate tracking success:', data);
        
        // Mark this order as tracked (prevents F5 duplicates)
        localStorage.setItem(trackedKey, JSON.stringify({
          ref: savedRef,
          orderId: orderId,
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