import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Geen geldige authenticatie'
    });
  }

  try {
    console.log('📊 Admin requesting stats from database');
    
    // Get all influencers for stats calculation
    const result = await sql`
      SELECT ref, name, email, status, commission, created_at
      FROM influencers 
      ORDER BY created_at DESC
    `;
    
    const influencers = result.rows;
    console.log(`📊 Found ${influencers.length} influencers for stats`);

    // Calculate stats
    const totalInfluencers = influencers.length;
    const activeInfluencers = influencers.filter(inf => inf.status === 'active').length;
    const inactiveInfluencers = influencers.filter(inf => inf.status === 'inactive').length;
    
    // Calculate recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentInfluencers = influencers.filter(inf => 
      new Date(inf.created_at) > thirtyDaysAgo
    ).length;

    // Calculate average commission
    const avgCommission = influencers.length > 0 
      ? influencers.reduce((sum, inf) => sum + parseFloat(inf.commission || 0), 0) / influencers.length
      : 0;

    const stats = {
      totalInfluencers,
      activeInfluencers,
      inactiveInfluencers,
      recentInfluencers,
      avgCommission: Math.round(avgCommission * 100) / 100,
      // Mock data for now - in future connect to sales/orders system
      totalSales: 0,
      totalRevenue: 0,
      totalCommissionPaid: 0
    };

    console.log('📊 Stats calculated:', stats);

    res.status(200).json({
      success: true,
      stats: stats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin stats error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 