const googleSheetsService = require('../../../lib/googleSheets');
const { getAllInfluencers } = require('../../../lib/database.js');

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

  try {
    console.log('Admin stats request received');

    // Start with fallback data to ensure dashboard works
    let systemStats = {
      totalRevenue: 0,
      totalOrders: 0,
      activeInfluencers: 0,
      totalInfluencers: 0,
      influencers: []
    };

    try {
      // Try to get database influencers first
      const dbInfluencers = await getAllInfluencers();
      console.log('📋 Found database influencers:', dbInfluencers.length);
      
      systemStats.totalInfluencers = dbInfluencers.length;
      systemStats.influencers = dbInfluencers.map(inf => ({
        name: inf.ref,
        totalSales: 0,
        totalRevenue: 0,
        lastSale: null,
        recentOrders: [],
        email: inf.email || '',
        phone: inf.phone || '',
        commission: inf.commission || 10.00,
        status: inf.status || 'active',
        instagram: inf.instagram || '',
        tiktok: inf.tiktok || '',
        youtube: inf.youtube || '',
        notes: inf.notes || '',
        profileComplete: true
      }));

      // Try to enhance with Google Sheets data
      try {
        const allData = await googleSheetsService.getAllData();
        
        if (allData && allData.length > 0) {
          console.log('📊 Found Google Sheets data:', allData.length, 'orders');
          
          // Get unique influencers from sheets
          const influencerNames = [...new Set(allData.map(row => row.ref))].filter(Boolean);
          
          // Update stats with real data
          const influencerStats = await Promise.all(
            influencerNames.map(async (name) => {
              const stats = await googleSheetsService.getInfluencerStats(name);
              const dbProfile = dbInfluencers.find(inf => inf.ref === name);
              
              return {
                name: name,
                totalSales: stats.totalSales,
                totalRevenue: stats.totalRevenue,
                lastSale: stats.lastSale,
                recentOrders: stats.recentOrders,
                email: dbProfile?.email || '',
                phone: dbProfile?.phone || '',
                commission: dbProfile?.commission || 10.00,
                status: dbProfile?.status || 'active',
                instagram: dbProfile?.instagram || '',
                tiktok: dbProfile?.tiktok || '',
                youtube: dbProfile?.youtube || '',
                notes: dbProfile?.notes || '',
                profileComplete: !!dbProfile
              };
            })
          );

          // Update system stats
          systemStats = {
            totalRevenue: influencerStats.reduce((sum, inf) => sum + parseFloat(inf.totalRevenue || 0), 0),
            totalOrders: influencerStats.reduce((sum, inf) => sum + inf.totalSales, 0),
            activeInfluencers: influencerStats.filter(inf => inf.totalSales > 0).length,
            totalInfluencers: Math.max(influencerStats.length, dbInfluencers.length),
            influencers: influencerStats.sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue))
          };
        }
      } catch (sheetsError) {
        console.log('📊 Google Sheets not available, using database only:', sheetsError.message);
      }

    } catch (dbError) {
      console.log('📋 Database not available, using minimal fallback:', dbError.message);
    }

    console.log('✅ System stats calculated:', {
      totalRevenue: systemStats.totalRevenue,
      totalOrders: systemStats.totalOrders,
      activeInfluencers: systemStats.activeInfluencers,
      totalInfluencers: systemStats.totalInfluencers
    });

    return res.status(200).json({
      success: true,
      data: systemStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin stats error:', error);
    
    // Always return working fallback data
    const fallbackStats = {
      totalRevenue: 0,
      totalOrders: 0,
      activeInfluencers: 0,
      totalInfluencers: 0,
      influencers: []
    };

    return res.status(200).json({
      success: true,
      data: fallbackStats,
      fallback: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 