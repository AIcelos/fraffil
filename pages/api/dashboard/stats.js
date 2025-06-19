import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
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

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    console.log('📊 Dashboard stats request for:', username);

    // Get influencer info from database
    const result = await sql`
      SELECT ref, name, email, commission, status, created_at
      FROM influencers 
      WHERE ref = ${username.toLowerCase()}
      LIMIT 1
    `;
    
    const influencer = result.rows[0];
    
    if (!influencer) {
      console.log('❌ Influencer not found:', username);
      return res.status(404).json({ error: 'Influencer not found' });
    }

    if (influencer.status !== 'active') {
      console.log('❌ Inactive influencer:', username);
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // For now, return basic stats with mock data
    // In the future, connect to actual sales/orders system
    const stats = {
      totalSales: 0,
      totalRevenue: 0,
      totalCommission: 0,
      recentOrders: [],
      lastSale: null,
      commissionRate: influencer.commission || 6.0,
      accountStatus: influencer.status,
      memberSince: influencer.created_at,
      // Mock performance data
      thisMonth: {
        sales: 0,
        revenue: 0,
        commission: 0
      },
      lastMonth: {
        sales: 0,
        revenue: 0,
        commission: 0
      }
    };

    console.log('✅ Dashboard stats calculated for:', username);

    res.status(200).json({
      success: true,
      stats: stats,
      influencer: {
        name: influencer.name,
        email: influencer.email,
        username: influencer.ref,
        commission: influencer.commission,
        status: influencer.status
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 