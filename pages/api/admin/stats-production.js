const { sql } = require('@vercel/postgres');

// Database functions directly in this file
async function getAllInfluencersLocal() {
  try {
    const result = await sql`
      SELECT 
        ref, name, email, phone, instagram, tiktok, youtube,
        commission, status, notes, created_at, updated_at
      FROM influencers 
      ORDER BY created_at DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching all influencers:', error);
    return [];
  }
}

function handler(req, res) {
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

  // Get stats from database
  getAllInfluencersLocal()
    .then(dbInfluencers => {
      console.log('📊 Admin stats request - found users:', dbInfluencers.length);

      // Calculate basic stats from database
      const systemStats = {
        totalRevenue: 0, // TODO: Connect to Google Sheets for order data
        totalOrders: 0,  // TODO: Connect to Google Sheets for order data
        activeInfluencers: dbInfluencers.filter(inf => inf.status === 'active').length,
        totalInfluencers: dbInfluencers.length,
        influencers: dbInfluencers.map(inf => ({
          name: inf.ref,
          totalSales: 0,      // TODO: Connect to Google Sheets
          totalRevenue: 0,    // TODO: Connect to Google Sheets
          lastSale: null,     // TODO: Connect to Google Sheets
          recentOrders: [],   // TODO: Connect to Google Sheets
          email: inf.email || '',
          phone: inf.phone || '',
          commission: inf.commission || 10.00,
          status: inf.status || 'active',
          instagram: inf.instagram || '',
          tiktok: inf.tiktok || '',
          youtube: inf.youtube || '',
          notes: inf.notes || '',
          profileComplete: true,
          created_at: inf.created_at
        }))
      };

      console.log('✅ Database stats calculated:', {
        totalInfluencers: systemStats.totalInfluencers,
        activeInfluencers: systemStats.activeInfluencers
      });

      res.status(200).json({
        success: true,
        data: systemStats,
        message: `Dashboard geladen met ${systemStats.totalInfluencers} gebruiker(s) uit database`,
        timestamp: new Date().toISOString()
      });
    })
    .catch(error => {
      console.error('❌ Database error in stats:', error);
      
      // Fallback to empty stats if database fails
      const fallbackStats = {
        totalRevenue: 0,
        totalOrders: 0,
        activeInfluencers: 0,
        totalInfluencers: 0,
        influencers: []
      };

      res.status(200).json({
        success: true,
        data: fallbackStats,
        fallback: true,
        message: 'Database niet beschikbaar - fallback data getoond',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
}

module.exports = handler; 