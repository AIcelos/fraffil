export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return minimal working data
  const systemStats = {
    totalRevenue: 0,
    totalOrders: 0,
    activeInfluencers: 0,
    totalInfluencers: 0,
    influencers: []
  };

  return res.status(200).json({
    success: true,
    data: systemStats,
    message: 'Dashboard is working! Add influencers to see data.',
    timestamp: new Date().toISOString()
  });
} 