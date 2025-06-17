export default async function handler(req, res) {
  // Breedere CORS voor debugging - later weer specifiek maken
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Debug logging
  console.log('Affiliate API called:', req.method, req.headers.origin);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS preflight for affiliate API');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ref, orderId, amount } = req.body;

  // Debug logging
  console.log('📋 Received data:', { ref, orderId, amount });

  if (!ref || !orderId) {
    console.log('❌ Missing data - ref:', ref, 'orderId:', orderId);
    return res.status(400).json({ error: 'Missing ref or orderId' });
  }

  // Duplicate protection - store processed orders in memory (simple approach)
  // In production, consider using a database or Redis for persistence
  global.processedOrders = global.processedOrders || new Set();
  const orderKey = `${ref}-${orderId}`;
  
  if (global.processedOrders.has(orderKey)) {
    console.log('⚠️ Duplicate order detected, skipping:', orderKey);
    return res.status(200).json({ success: true, message: 'Duplicate order, skipped' });
  }
  
  // Mark this order as processed
  global.processedOrders.add(orderKey);

  // Vervang hieronder door jouw echte Zapier webhook URL!
  const zapierWebhookUrl = 'https://hooks.zapier.com/hooks/catch/23408429/uouxrfg/';
  
  const payload = { 
    Ref: ref,
    "Order Id": orderId,
    timestamp: new Date().toISOString(),
    source: 'fraffil-api'
  };

  // Add amount if provided
  if (amount && typeof amount === 'number' && amount > 0) {
    payload.Amount = amount;
    payload.AmountFormatted = `€${amount.toFixed(2)}`;
  }
  
  console.log('🚀 Sending to Zapier:', payload);

  try {
    const zapierRes = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('📡 Zapier response status:', zapierRes.status);
    
    if (!zapierRes.ok) {
      const errorText = await zapierRes.text();
      console.log('❌ Zapier error response:', errorText);
      throw new Error(`Zapier webhook error: ${zapierRes.status}`);
    }

    const zapierResult = await zapierRes.json();
    console.log('✅ Zapier success:', zapierResult);

    return res.status(200).json({ success: true, zapierResult });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
} 