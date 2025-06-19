import { sql } from '@vercel/postgres';
import googleSheetsService from '../../../lib/googleSheets';

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

  // Accept both 'username' and 'influencer' parameters for compatibility
  const { username, influencer } = req.query;
  const targetUser = username || influencer;

  if (!targetUser) {
    return res.status(400).json({ error: 'Username or influencer parameter is required' });
  }

  try {
    console.log('📊 Dashboard stats request for:', targetUser);

    // Get influencer info from database
    const result = await sql`
      SELECT ref, name, email, commission, status, created_at
      FROM influencers 
      WHERE ref = ${targetUser.toLowerCase()}
      LIMIT 1
    `;
    
    const influencerData = result.rows[0];
    
    if (!influencerData) {
      console.log('❌ Influencer not found:', targetUser);
      return res.status(404).json({ error: 'Influencer not found' });
    }

    if (influencerData.status !== 'active') {
      console.log('❌ Inactive influencer:', targetUser);
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Get real stats from Google Sheets
    let googleSheetsStats = null;
    try {
      console.log('📊 Fetching Google Sheets data for:', targetUser);
      googleSheetsStats = await googleSheetsService.getInfluencerStats(targetUser);
      console.log('✅ Google Sheets data retrieved:', googleSheetsStats);
    } catch (error) {
      console.error('⚠️ Google Sheets error:', error);
      // Continue with fallback data
    }

    // Calculate commission based on real data
    const commissionRate = influencerData.commission || 6.0;
    const totalRevenue = googleSheetsStats?.totalRevenue || 0;
    const totalCommission = (totalRevenue * commissionRate) / 100;

    // Build stats object with real data
    const stats = {
      totalSales: googleSheetsStats?.totalSales || 0,
      totalRevenue: totalRevenue,
      totalCommission: totalCommission,
      avgOrderValue: googleSheetsStats?.avgOrderValue || 0,
      recentOrders: googleSheetsStats?.recentOrders || [],
      lastSale: googleSheetsStats?.lastSale || null,
      commissionRate: commissionRate,
      accountStatus: influencerData.status,
      memberSince: influencerData.created_at,
      // Calculate monthly stats
      monthlyStats: googleSheetsStats?.monthlyStats || {},
      // Current month stats
      thisMonth: {
        sales: 0, // TODO: Calculate from monthly stats
        revenue: 0,
        commission: 0
      },
      lastMonth: {
        sales: 0, // TODO: Calculate from monthly stats  
        revenue: 0,
        commission: 0
      }
    };

    console.log('✅ Dashboard stats calculated for:', targetUser, {
      totalSales: stats.totalSales,
      totalRevenue: stats.totalRevenue.toFixed(2),
      totalCommission: stats.totalCommission.toFixed(2),
      dataSource: googleSheetsStats ? 'Google Sheets' : 'fallback'
    });

    res.status(200).json({
      success: true,
      data: stats,
      influencer: {
        name: influencerData.name,
        email: influencerData.email,
        username: influencerData.ref,
        commission: influencerData.commission,
        status: influencerData.status
      },
      dataSource: googleSheetsStats ? 'Google Sheets' : 'fallback',
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