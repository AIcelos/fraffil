// /api/affiliate.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ref, orderId } = req.body;

  if (!ref || !orderId) {
    return res.status(400).json({ error: 'Missing ref or orderId' });
  }

  // Stuur data door naar Zapier Webhook
  const zapierWebhookUrl = 'JOUW_ZAPIER_WEBHOOK_URL_HIER';

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
