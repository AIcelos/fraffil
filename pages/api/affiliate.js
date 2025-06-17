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

  const { ref, orderId } = req.body;

  if (!ref || !orderId) {
    return res.status(400).json({ error: 'Missing ref or orderId' });
  }

  // Vervang hieronder door jouw echte Zapier webhook URL!
  const zapierWebhookUrl = 'https://hooks.zapier.com/hooks/catch/23408429/uouxrfg/';

  try {
    const zapierRes = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, orderId }),
    });

    if (!zapierRes.ok) {
      throw new Error('Zapier webhook error');
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
} 